import type { AddressDto } from '@maison-elise/shared';
import type { Prisma } from '@prisma/client';

import { toAddressDto } from '../mappers/address.mapper.js';
import { addressRepository } from '../repositories/address.repository.js';
import type { AddressInput, UpdateAddressInput } from '../schemas/address.schema.js';
import { NotFoundError } from '../utils/errors.js';

async function requireOwnedAddress(id: string, userId: string) {
  const address = await addressRepository.findForUser(id, userId);

  if (!address) {
    throw new NotFoundError('Address not found.', 'ADDRESS_NOT_FOUND');
  }

  return address;
}

export const addressService = {
  async list(userId: string): Promise<AddressDto[]> {
    const addresses = await addressRepository.findManyByUser(userId);
    return addresses.map(toAddressDto);
  },

  async create(userId: string, input: AddressInput): Promise<AddressDto> {
    const existing = await addressRepository.countByUser(userId);
    const isDefault = input.isDefault === true || existing === 0;

    return addressRepository.transaction(async (tx) => {
      if (isDefault) {
        await tx.clearDefault(userId);
      }

      const address = await tx.create(userId, {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 ?? null,
        city: input.city,
        postalCode: input.postalCode,
        countryCode: input.countryCode,
        isDefault,
      });

      return toAddressDto(address);
    });
  },

  async update(userId: string, id: string, input: UpdateAddressInput): Promise<AddressDto> {
    await requireOwnedAddress(id, userId);

    const data: Prisma.AddressUpdateInput = {};

    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.addressLine1 !== undefined) data.addressLine1 = input.addressLine1;
    if (input.addressLine2 !== undefined) data.addressLine2 = input.addressLine2;
    if (input.city !== undefined) data.city = input.city;
    if (input.postalCode !== undefined) data.postalCode = input.postalCode;
    if (input.countryCode !== undefined) data.countryCode = input.countryCode;

    return addressRepository.transaction(async (tx) => {
      if (input.isDefault === true) {
        await tx.clearDefault(userId);
        data.isDefault = true;
      }

      return toAddressDto(await tx.update(id, data));
    });
  },

  async remove(userId: string, id: string): Promise<void> {
    await requireOwnedAddress(id, userId);
    await addressRepository.transaction((tx) => tx.remove(id));
  },

  async setDefault(userId: string, id: string): Promise<AddressDto> {
    await requireOwnedAddress(id, userId);

    return addressRepository.transaction(async (tx) => {
      await tx.clearDefault(userId);
      return toAddressDto(await tx.update(id, { isDefault: true }));
    });
  },
};
