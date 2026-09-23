import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type {
  CartForCheckout,
  OrderItemSnapshot,
  OrderTransaction,
  OrderWithItems,
} from '../repositories/order.repository.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';

const { orderService } = await import('./order.service.js');
const { orderRepository } = await import('../repositories/order.repository.js');
const { addressRepository } = await import('../repositories/address.repository.js');
const { notificationService } = await import('./notification.service.js');

interface FakeVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  stockQuantity: number;
  price: number;
}

interface FakeProduct {
  id: string;
  name: string;
  currency: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
}

interface FakeCartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: FakeProduct;
  variant: FakeVariant;
}

interface FakeCart {
  id: string;
  userId: string;
  items: FakeCartItem[];
}

interface FakeOrder {
  id: string;
  sequence: number;
  userId: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotal: number;
  shippingAmount: number;
  total: number;
  shippingAddress: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

let carts: Map<string, FakeCart>;
let stock: Map<string, number>;
let orders: { order: FakeOrder; items: (OrderItemSnapshot & { id: string })[] }[];
let orderSequence: number;
let createdShipping: Record<string, unknown> | null;
let addressForUser: Record<string, unknown> | null;
let forceTransitionConflict: boolean;

function makeAddress(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'addr-1',
    userId: 'user-a',
    firstName: 'Camille',
    lastName: 'Laurent',
    phone: '+33123456789',
    addressLine1: '12 Rue Saint-Honoré',
    addressLine2: null,
    city: 'Paris',
    postalCode: '75001',
    countryCode: 'FR',
    isDefault: true,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<FakeProduct> = {}): FakeProduct {
  return {
    id: 'prod-1',
    name: 'Aurelia Satin Dress',
    currency: 'EUR',
    status: 'ACTIVE',
    ...overrides,
  };
}

function makeVariant(overrides: Partial<FakeVariant> = {}): FakeVariant {
  return {
    id: 'var-1',
    productId: 'prod-1',
    size: 'M',
    color: 'Black',
    stockQuantity: 5,
    price: 190,
    ...overrides,
  };
}

function setCart(userId: string, items: FakeCartItem[]): void {
  carts.set(userId, { id: `cart-${userId}`, userId, items });
}

function makeCartItem(overrides: Partial<FakeCartItem> = {}): FakeCartItem {
  const product = overrides.product ?? makeProduct();
  const variant = overrides.variant ?? makeVariant();
  return {
    id: `item-${variant.id}`,
    cartId: 'cart-user-a',
    productId: product.id,
    variantId: variant.id,
    quantity: 1,
    product,
    variant,
    ...overrides,
  };
}

function cartFor(userId: string): CartForCheckout | null {
  const cart = carts.get(userId);
  return cart ? (structuredClone(cart) as unknown as CartForCheckout) : null;
}

function makeTransaction(): OrderTransaction {
  return {
    async findCartWithItems(userId) {
      return cartFor(userId);
    },
    async decrementStock(variantId, quantity) {
      const available = stock.get(variantId) ?? 0;
      if (available < quantity) {
        return 0;
      }
      stock.set(variantId, available - quantity);
      return 1;
    },
    async createOrder(data) {
      const id = `order-${(orderSequence += 1)}`;
      orders.push({
        order: {
          id,
          sequence: orderSequence,
          userId: String(data.userId),
          status: String(data.status ?? 'PENDING'),
          paymentStatus: 'UNPAID',
          currency: String(data.currency ?? 'EUR'),
          subtotal: Number(data.subtotal),
          shippingAmount: Number(data.shippingAmount ?? 0),
          total: Number(data.total),
          shippingAddress: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        items: [],
      });
      return { id };
    },
    async createShippingAddress(orderId, data) {
      createdShipping = { orderId, ...data };
    },
    async createOrderItems(orderId, items) {
      const record = orders.find((entry) => entry.order.id === orderId);
      if (record) {
        record.items = items.map((item, index) => ({ id: `${orderId}-item-${index}`, ...item }));
      }
    },
    async clearCart(cartId) {
      for (const [userId, cart] of carts) {
        if (cart.id === cartId) {
          carts.set(userId, { ...cart, items: [] });
        }
      }
    },
    async findOrderWithItems(orderId) {
      const record = orders.find((entry) => entry.order.id === orderId);
      if (!record) {
        throw new Error('order missing');
      }
      return { ...record.order, items: record.items } as unknown as OrderWithItems;
    },
    async updateOrderStatus(orderId, status, expectedStatus) {
      if (forceTransitionConflict) {
        return 0;
      }

      const record = orders.find((entry) => entry.order.id === orderId);

      if (!record || record.order.status !== expectedStatus) {
        return 0;
      }

      record.order.status = status;
      return 1;
    },
    async incrementStock(variantId, quantity) {
      stock.set(variantId, (stock.get(variantId) ?? 0) + quantity);
    },
  };
}

beforeEach(() => {
  carts = new Map();
  stock = new Map();
  orders = [];
  orderSequence = 0;
  createdShipping = null;
  addressForUser = makeAddress();
  forceTransitionConflict = false;

  mock.method(addressRepository, 'findForUser', async () => addressForUser);
  mock.method(notificationService, 'sendOrderConfirmation', async () => undefined);
  mock.method(notificationService, 'sendOrderStatusChanged', async () => undefined);

  mock.method(
    orderRepository,
    'transaction',
    async (fn: (tx: OrderTransaction) => Promise<unknown>) => {
      const cartsSnapshot = structuredClone(carts);
      const stockSnapshot = structuredClone(stock);
      const ordersSnapshot = structuredClone(orders);
      const sequenceSnapshot = orderSequence;

      try {
        return await fn(makeTransaction());
      } catch (error) {
        carts = cartsSnapshot;
        stock = stockSnapshot;
        orders = ordersSnapshot;
        orderSequence = sequenceSnapshot;
        throw error;
      }
    },
  );

  mock.method(
    orderRepository,
    'findManyByUser',
    async (userId: string, skip: number, take: number) => {
      const all = orders.filter((entry) => entry.order.userId === userId);
      const items = all
        .slice(skip, skip + take)
        .map((entry) => ({ ...entry.order, items: entry.items }) as unknown as OrderWithItems);
      return { items, total: all.length };
    },
  );

  mock.method(orderRepository, 'findByIdForUser', async (orderId: string, userId: string) => {
    const record = orders.find(
      (entry) => entry.order.id === orderId && entry.order.userId === userId,
    );
    return record ? ({ ...record.order, items: record.items } as unknown as OrderWithItems) : null;
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

describe('orderService.createOrder', () => {
  it('rejects an empty cart', async () => {
    await expectError(orderService.createOrder('user-a', 'addr-1'), 'CART_EMPTY');
    assert.equal(orders.length, 0);
  });

  it('creates an order with correct snapshots, totals and currency', async () => {
    setCart('user-a', [makeCartItem({ quantity: 2 })]);
    stock.set('var-1', 5);

    const order = await orderService.createOrder('user-a', 'addr-1');

    assert.equal(order.status, 'PENDING');
    assert.equal(order.orderNumber, 'ME-2026-0001');
    assert.equal(order.currency, 'EUR');
    assert.equal(order.subtotal, 380);
    assert.equal(order.total, 380);
    assert.equal(order.itemCount, 2);
    assert.equal(order.items.length, 1);
    assert.deepEqual(
      {
        productId: order.items[0]?.productId,
        variantId: order.items[0]?.variantId,
        productName: order.items[0]?.productName,
        size: order.items[0]?.size,
        color: order.items[0]?.color,
        unitPrice: order.items[0]?.unitPrice,
        quantity: order.items[0]?.quantity,
        lineTotal: order.items[0]?.lineTotal,
      },
      {
        productId: 'prod-1',
        variantId: 'var-1',
        productName: 'Aurelia Satin Dress',
        size: 'M',
        color: 'Black',
        unitPrice: 190,
        quantity: 2,
        lineTotal: 380,
      },
    );
  });

  it('uses the database price, not any cart-displayed value', async () => {
    setCart('user-a', [makeCartItem({ variant: makeVariant({ price: 190 }), quantity: 1 })]);
    stock.set('var-1', 5);

    const order = await orderService.createOrder('user-a', 'addr-1');

    assert.equal(order.items[0]?.unitPrice, 190);
    assert.equal(order.total, 190);
  });

  it('clears the cart after success', async () => {
    setCart('user-a', [makeCartItem()]);
    stock.set('var-1', 5);

    await orderService.createOrder('user-a', 'addr-1');

    assert.equal(carts.get('user-a')?.items.length, 0);
  });

  it('decrements stock after success', async () => {
    setCart('user-a', [makeCartItem({ quantity: 2 })]);
    stock.set('var-1', 5);

    await orderService.createOrder('user-a', 'addr-1');

    assert.equal(stock.get('var-1'), 3);
  });

  it('rejects an unavailable product without side effects', async () => {
    setCart('user-a', [makeCartItem({ product: makeProduct({ status: 'DRAFT' }) })]);
    stock.set('var-1', 5);

    await expectError(orderService.createOrder('user-a', 'addr-1'), 'PRODUCT_UNAVAILABLE');

    assert.equal(orders.length, 0);
    assert.equal(stock.get('var-1'), 5);
    assert.equal(carts.get('user-a')?.items.length, 1);
  });

  it('rejects insufficient stock and rolls back everything', async () => {
    setCart('user-a', [makeCartItem({ quantity: 2, variant: makeVariant({ stockQuantity: 2 }) })]);
    stock.set('var-1', 1);

    await expectError(orderService.createOrder('user-a', 'addr-1'), 'INSUFFICIENT_STOCK');

    assert.equal(orders.length, 0);
    assert.equal(stock.get('var-1'), 1);
    assert.equal(carts.get('user-a')?.items.length, 1);
  });

  it('never lets stock go negative across concurrent-style attempts', async () => {
    setCart('user-a', [makeCartItem({ quantity: 1 })]);
    stock.set('var-1', 1);

    await orderService.createOrder('user-a', 'addr-1');
    assert.equal(stock.get('var-1'), 0);

    setCart('user-b', [makeCartItem({ quantity: 1 })]);
    await expectError(orderService.createOrder('user-b', 'addr-1'), 'INSUFFICIENT_STOCK');
    assert.equal(stock.get('var-1'), 0);
  });

  it('calculates subtotal across multiple lines', async () => {
    setCart('user-a', [
      makeCartItem({
        id: 'item-1',
        variantId: 'var-1',
        quantity: 1,
        variant: makeVariant({ id: 'var-1', price: 190 }),
      }),
      makeCartItem({
        id: 'item-2',
        productId: 'prod-2',
        variantId: 'var-2',
        quantity: 2,
        product: makeProduct({ id: 'prod-2', name: 'Elise Tailored Blazer' }),
        variant: makeVariant({ id: 'var-2', productId: 'prod-2', price: 520 }),
      }),
    ]);
    stock.set('var-1', 5);
    stock.set('var-2', 5);

    const order = await orderService.createOrder('user-a', 'addr-1');

    assert.equal(order.items.length, 2);
    assert.equal(order.itemCount, 3);
    assert.equal(order.subtotal, 190 + 1040);
    assert.equal(order.total, 1230);
  });
});

describe('orderService.createOrder shipping', () => {
  it('stores an immutable shipping snapshot from the selected address', async () => {
    setCart('user-a', [makeCartItem()]);
    stock.set('var-1', 5);

    const order = await orderService.createOrder('user-a', 'addr-1');

    assert.equal(order.shippingAmount, 0);
    assert.equal(order.total, order.subtotal);
    assert.ok(createdShipping);
    assert.equal(createdShipping?.firstName, 'Camille');
    assert.equal(createdShipping?.lastName, 'Laurent');
    assert.equal(createdShipping?.addressLine1, '12 Rue Saint-Honoré');
    assert.equal(createdShipping?.city, 'Paris');
    assert.equal(createdShipping?.postalCode, '75001');
    assert.equal(createdShipping?.countryCode, 'FR');
  });

  it('still creates the order when the confirmation email fails', async () => {
    setCart('user-a', [makeCartItem()]);
    stock.set('var-1', 5);
    mock.method(notificationService, 'sendOrderConfirmation', async () => {
      throw new Error('email provider down');
    });

    const order = await orderService.createOrder('user-a', 'addr-1');

    assert.ok(order.id);
    assert.equal(stock.get('var-1'), 4);
  });

  it('rejects an address that does not belong to the user', async () => {
    setCart('user-a', [makeCartItem()]);
    stock.set('var-1', 5);
    addressForUser = null;

    await expectError(orderService.createOrder('user-a', 'addr-1'), 'ADDRESS_NOT_FOUND');
    assert.equal(orders.length, 0);
    assert.equal(stock.get('var-1'), 5);
  });
});

describe('orderService.list', () => {
  it('returns only the authenticated user orders with pagination', async () => {
    setCart('user-a', [makeCartItem()]);
    stock.set('var-1', 5);
    await orderService.createOrder('user-a', 'addr-1');

    setCart('user-b', [makeCartItem()]);
    stock.set('var-1', 5);
    await orderService.createOrder('user-b', 'addr-1');

    const result = await orderService.list('user-a', 1, 10);

    assert.equal(result.meta.total, 1);
    assert.equal(result.data.length, 1);
  });
});

describe('orderService.getById', () => {
  it('returns an order owned by the user', async () => {
    setCart('user-a', [makeCartItem()]);
    stock.set('var-1', 5);
    const created = await orderService.createOrder('user-a', 'addr-1');

    const order = await orderService.getById('user-a', created.id);

    assert.equal(order.id, created.id);
  });

  it('does not return another user order', async () => {
    setCart('user-a', [makeCartItem()]);
    stock.set('var-1', 5);
    const created = await orderService.createOrder('user-a', 'addr-1');

    await expectError(orderService.getById('user-b', created.id), 'ORDER_NOT_FOUND');
  });

  it('reports a nonexistent order', async () => {
    await expectError(orderService.getById('user-a', 'missing'), 'ORDER_NOT_FOUND');
  });
});

describe('orderService.updateStatus', () => {
  async function createPaidOrder(): Promise<string> {
    setCart('user-a', [makeCartItem({ quantity: 2 })]);
    stock.set('var-1', 5);
    const created = await orderService.createOrder('user-a', 'addr-1');
    const record = orders.find((entry) => entry.order.id === created.id);
    if (record) {
      record.order.paymentStatus = 'PAID';
    }
    return created.id;
  }

  it('confirms a paid order', async () => {
    const orderId = await createPaidOrder();

    const updated = await orderService.updateStatus(orderId, 'CONFIRMED');

    assert.equal(updated.status, 'CONFIRMED');
  });

  it('rejects confirming an unpaid order', async () => {
    setCart('user-a', [makeCartItem()]);
    stock.set('var-1', 5);
    const created = await orderService.createOrder('user-a', 'addr-1');

    await expectError(orderService.updateStatus(created.id, 'CONFIRMED'), 'PAYMENT_NOT_PAID');
  });

  it('cancels a pending order and restores stock', async () => {
    setCart('user-a', [makeCartItem({ quantity: 2 })]);
    stock.set('var-1', 5);
    const created = await orderService.createOrder('user-a', 'addr-1');
    assert.equal(stock.get('var-1'), 3);

    const updated = await orderService.updateStatus(created.id, 'CANCELLED');

    assert.equal(updated.status, 'CANCELLED');
    assert.equal(stock.get('var-1'), 5);
  });

  it('rejects cancelling an order twice (no double stock restore)', async () => {
    setCart('user-a', [makeCartItem({ quantity: 2 })]);
    stock.set('var-1', 5);
    const created = await orderService.createOrder('user-a', 'addr-1');
    await orderService.updateStatus(created.id, 'CANCELLED');

    await expectError(
      orderService.updateStatus(created.id, 'CANCELLED'),
      'INVALID_STATE_TRANSITION',
    );
    assert.equal(stock.get('var-1'), 5);
  });

  it('rejects an invalid transition from a cancelled order', async () => {
    setCart('user-a', [makeCartItem()]);
    stock.set('var-1', 5);
    const created = await orderService.createOrder('user-a', 'addr-1');
    await orderService.updateStatus(created.id, 'CANCELLED');

    await expectError(
      orderService.updateStatus(created.id, 'CONFIRMED'),
      'INVALID_STATE_TRANSITION',
    );
  });

  it('does not restore stock when a concurrent transition wins the race', async () => {
    setCart('user-a', [makeCartItem({ quantity: 2 })]);
    stock.set('var-1', 5);
    const created = await orderService.createOrder('user-a', 'addr-1');
    assert.equal(stock.get('var-1'), 3);

    // Simulate another request changing the status between our read and update.
    forceTransitionConflict = true;

    await expectError(
      orderService.updateStatus(created.id, 'CANCELLED'),
      'INVALID_STATE_TRANSITION',
    );

    // Stock must not be restored by the losing request.
    assert.equal(stock.get('var-1'), 3);
  });
});
