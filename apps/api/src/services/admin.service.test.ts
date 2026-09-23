import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';

const { adminService } = await import('./admin.service.js');
const { adminRepository } = await import('../repositories/admin.repository.js');

beforeEach(() => {
  mock.method(adminRepository, 'dashboard', async () => ({
    total: 10,
    pending: 4,
    confirmed: 5,
    cancelled: 1,
    confirmedRevenue: 1234,
    products: 12,
    lowStockVariants: 3,
    outOfStockVariants: 2,
    customers: 7,
  }));
  mock.method(adminRepository, 'findOrders', async () => ({ items: [], total: 0 }));
  mock.method(adminRepository, 'findOrder', async () => null);
  mock.method(adminRepository, 'findInventory', async () => ({ items: [], total: 0 }));
  mock.method(adminRepository, 'findVariant', async () => null);
  mock.method(adminRepository, 'findCustomers', async () => ({ items: [], total: 0 }));
  mock.method(adminRepository, 'findCustomer', async () => null);
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

describe('adminService.getDashboard', () => {
  it('maps aggregates into the dashboard DTO', async () => {
    const dashboard = await adminService.getDashboard();

    assert.deepEqual(dashboard, {
      orders: { total: 10, pending: 4, confirmed: 5, cancelled: 1 },
      revenue: { confirmed: 1234, currency: 'EUR' },
      inventory: { products: 12, lowStockVariants: 3, outOfStockVariants: 2 },
      customers: { total: 7 },
    });
  });
});

describe('adminService.listOrders', () => {
  it('applies status, payment status and search filters with pagination', async () => {
    const findMock = mock.method(adminRepository, 'findOrders', async () => ({
      items: [],
      total: 0,
    }));

    const result = await adminService.listOrders({
      page: 2,
      limit: 20,
      status: 'PENDING',
      paymentStatus: 'PAID',
      search: 'jane',
    });

    const [where, skip, take] = findMock.mock.calls[0]?.arguments ?? [];
    assert.equal(where?.status, 'PENDING');
    assert.equal(where?.paymentStatus, 'PAID');
    assert.ok(Array.isArray(where?.OR));
    assert.equal(skip, 20);
    assert.equal(take, 20);
    assert.deepEqual(result.meta, { page: 2, limit: 20, total: 0, totalPages: 1 });
  });

  it('searches by numeric order sequence', async () => {
    const findMock = mock.method(adminRepository, 'findOrders', async () => ({
      items: [],
      total: 0,
    }));

    await adminService.listOrders({ page: 1, limit: 20, search: '42' });

    const [where] = findMock.mock.calls[0]?.arguments ?? [];
    assert.ok(where?.OR?.some((clause) => 'sequence' in clause && clause.sequence === 42));
  });
});

describe('adminService.getOrder', () => {
  it('reports a missing order', async () => {
    await expectError(adminService.getOrder('missing'), 'ORDER_NOT_FOUND');
  });
});

describe('adminService.updateInventory', () => {
  it('reports a missing variant', async () => {
    await expectError(adminService.updateInventory('missing', 5), 'VARIANT_NOT_FOUND');
  });

  it('updates and maps the variant', async () => {
    mock.method(adminRepository, 'findVariant', async () => ({ id: 'var-1' }));
    mock.method(
      adminRepository,
      'updateVariantStock',
      async (_id: string, stockQuantity: number) => ({
        id: 'var-1',
        sku: 'ME-1',
        size: 'M',
        color: 'Black',
        stockQuantity,
        price: 190,
        productId: 'prod-1',
        product: { name: 'Aurelia Satin Dress', slug: 'aurelia-satin-dress' },
      }),
    );

    const updated = await adminService.updateInventory('var-1', 9);

    assert.equal(updated.stockQuantity, 9);
    assert.equal(updated.productName, 'Aurelia Satin Dress');
  });
});

describe('adminService.getCustomer', () => {
  it('reports a missing customer', async () => {
    await expectError(adminService.getCustomer('missing'), 'CUSTOMER_NOT_FOUND');
  });

  it('includes confirmed spend and recent orders', async () => {
    mock.method(adminRepository, 'findCustomer', async () => ({
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      role: 'CUSTOMER',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      _count: { orders: 2 },
    }));
    mock.method(adminRepository, 'customerConfirmedSpend', async () => 500);
    mock.method(adminRepository, 'customerRecentOrders', async () => []);

    const customer = await adminService.getCustomer('user-1');

    assert.equal(customer.name, 'Jane Doe');
    assert.equal(customer.orderCount, 2);
    assert.equal(customer.confirmedSpend, 500);
    assert.equal(customer.recentOrders.length, 0);
  });
});
