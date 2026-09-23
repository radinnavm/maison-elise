import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';

const { addressService } = await import('./address.service.js');
const { addressRepository } = await import('../repositories/address.repository.js');

interface FakeAddress {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

let addresses: FakeAddress[];
let sequence: number;

const input = {
  firstName: 'Camille',
  lastName: 'Laurent',
  phone: '+33123456789',
  addressLine1: '12 Rue Saint-Honoré',
  city: 'Paris',
  postalCode: '75001',
  countryCode: 'FR',
};

function makeAddress(overrides: Partial<FakeAddress> = {}): FakeAddress {
  return {
    id: `addr-${(sequence += 1)}`,
    userId: 'user-a',
    firstName: 'Camille',
    lastName: 'Laurent',
    phone: '+33123456789',
    addressLine1: '12 Rue Saint-Honoré',
    addressLine2: null,
    city: 'Paris',
    postalCode: '75001',
    countryCode: 'FR',
    isDefault: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

beforeEach(() => {
  addresses = [];
  sequence = 0;

  mock.method(addressRepository, 'findManyByUser', async (userId: string) =>
    addresses.filter((address) => address.userId === userId),
  );
  mock.method(
    addressRepository,
    'findForUser',
    async (id: string, userId: string) =>
      addresses.find((address) => address.id === id && address.userId === userId) ?? null,
  );
  mock.method(
    addressRepository,
    'countByUser',
    async (userId: string) => addresses.filter((address) => address.userId === userId).length,
  );
  mock.method(addressRepository, 'transaction', async (fn: (tx: unknown) => Promise<unknown>) => {
    const snapshot = structuredClone(addresses);
    const tx = {
      async clearDefault(userId: string) {
        addresses = addresses.map((address) =>
          address.userId === userId ? { ...address, isDefault: false } : address,
        );
      },
      async create(userId: string, data: Record<string, unknown>) {
        const created = makeAddress({ ...data, userId } as Partial<FakeAddress>);
        addresses.push(created);
        return created;
      },
      async update(id: string, data: Record<string, unknown>) {
        const address = addresses.find((entry) => entry.id === id);
        if (!address) throw new Error('missing');
        Object.assign(address, data);
        return address;
      },
      async remove(id: string) {
        addresses = addresses.filter((entry) => entry.id !== id);
      },
    };

    try {
      return await fn(tx);
    } catch (error) {
      addresses = snapshot;
      throw error;
    }
  });
});

afterEach(() => {
  mock.restoreAll();
});

async function expectError(promise: Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(promise, (error: unknown) => {
    assert.equal((error as { code?: string }).code, code);
    return true;
  });
}

describe('addressService', () => {
  it('lists only the user own addresses', async () => {
    addresses.push(makeAddress({ userId: 'user-a' }), makeAddress({ userId: 'user-b' }));

    const result = await addressService.list('user-a');

    assert.equal(result.length, 1);
  });

  it('creates an address and makes the first one default', async () => {
    const address = await addressService.create('user-a', input);

    assert.equal(address.isDefault, true);
    assert.equal(address.city, 'Paris');
  });

  it('keeps only one default address', async () => {
    const first = await addressService.create('user-a', input);
    await addressService.create('user-a', {
      ...input,
      addressLine1: '2 Avenue Montaigne',
      isDefault: true,
    });

    const defaults = addresses.filter((address) => address.isDefault);
    assert.equal(defaults.length, 1);
    assert.notEqual(defaults[0]?.id, first.id);
  });

  it('updates an owned address', async () => {
    const address = await addressService.create('user-a', input);

    const updated = await addressService.update('user-a', address.id, { city: 'Lyon' });

    assert.equal(updated.city, 'Lyon');
  });

  it('rejects updating another user address', async () => {
    const address = await addressService.create('user-a', input);

    await expectError(
      addressService.update('user-b', address.id, { city: 'Lyon' }),
      'ADDRESS_NOT_FOUND',
    );
  });

  it('deletes an owned address and rejects another user deletion', async () => {
    const address = await addressService.create('user-a', input);

    await expectError(addressService.remove('user-b', address.id), 'ADDRESS_NOT_FOUND');

    await addressService.remove('user-a', address.id);
    assert.equal(addresses.length, 0);
  });

  it('sets a default address', async () => {
    const first = await addressService.create('user-a', input);
    const second = await addressService.create('user-a', {
      ...input,
      addressLine1: '2 Avenue Montaigne',
    });

    const updated = await addressService.setDefault('user-a', second.id);

    assert.equal(updated.isDefault, true);
    assert.equal(addresses.find((entry) => entry.id === first.id)?.isDefault, false);
  });
});
