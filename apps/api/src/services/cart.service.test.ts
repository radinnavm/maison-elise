import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type {
  CartTransaction,
  CartWithItems,
  VariantWithProduct,
} from '../repositories/cart.repository.js';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/maison_elise_test';
process.env.JWT_SECRET ??= 'test-secret';

const { cartService } = await import('./cart.service.js');
const { cartRepository } = await import('../repositories/cart.repository.js');

interface FakeVariant {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productStatus: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  size: string;
  color: string;
  stockQuantity: number;
  price: number;
  imageUrl: string;
}

interface FakeItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
}

interface FakeCart {
  id: string;
  items: FakeItem[];
}

let variants: Map<string, FakeVariant>;
let carts: Map<string, FakeCart>;

function toVariant(variant: FakeVariant): VariantWithProduct {
  return {
    id: variant.id,
    productId: variant.productId,
    size: variant.size,
    color: variant.color,
    stockQuantity: variant.stockQuantity,
    price: variant.price,
    product: {
      id: variant.productId,
      name: variant.productName,
      slug: variant.productSlug,
      status: variant.productStatus,
      images: [{ url: variant.imageUrl }],
    },
  } as unknown as VariantWithProduct;
}

function buildCart(userId: string): CartWithItems | null {
  const cart = carts.get(userId);
  if (!cart) {
    return null;
  }

  return {
    id: cart.id,
    userId,
    items: cart.items.map((item) => ({
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: {
        name: variants.get(item.variantId)?.productName ?? '',
        slug: variants.get(item.variantId)?.productSlug ?? '',
        images: [{ url: variants.get(item.variantId)?.imageUrl ?? '' }],
      },
      variant: toVariant(variants.get(item.variantId) as FakeVariant),
    })),
  } as unknown as CartWithItems;
}

function makeTransaction(): CartTransaction {
  return {
    async getOrCreateCart(userId) {
      let cart = carts.get(userId);
      if (!cart) {
        cart = { id: `cart-${userId}`, items: [] };
        carts.set(userId, cart);
      }
      return { id: cart.id };
    },
    async findItem(cartId, variantId) {
      const cart = [...carts.values()].find((entry) => entry.id === cartId);
      const item = cart?.items.find((entry) => entry.variantId === variantId);
      return item ? { quantity: item.quantity } : null;
    },
    async upsertItem({ cartId, productId, variantId, quantity }) {
      const cart = [...carts.values()].find((entry) => entry.id === cartId);
      if (!cart) {
        return;
      }
      const existing = cart.items.find((entry) => entry.variantId === variantId);
      if (existing) {
        existing.quantity = quantity;
      } else {
        cart.items.push({
          id: `item-${variantId}`,
          cartId,
          productId,
          variantId,
          quantity,
        });
      }
    },
    async findVariantWithProduct(variantId) {
      const variant = variants.get(variantId);
      return variant ? toVariant(variant) : null;
    },
  };
}

beforeEach(() => {
  variants = new Map([
    [
      'var-m-black',
      {
        id: 'var-m-black',
        productId: 'prod-aurelia',
        productName: 'Aurelia Satin Dress',
        productSlug: 'aurelia-satin-dress',
        productStatus: 'ACTIVE',
        size: 'M',
        color: 'Black',
        stockQuantity: 5,
        price: 189,
        imageUrl: '/static/products/aurelia-satin-dress-1.svg',
      },
    ],
    [
      'var-s-beige',
      {
        id: 'var-s-beige',
        productId: 'prod-elise',
        productName: 'Elise Tailored Blazer',
        productSlug: 'elise-tailored-blazer',
        productStatus: 'ACTIVE',
        size: 'S',
        color: 'Beige',
        stockQuantity: 2,
        price: 520,
        imageUrl: '/static/products/elise-tailored-blazer-1.svg',
      },
    ],
    [
      'var-m-camel',
      {
        id: 'var-m-camel',
        productId: 'prod-clara',
        productName: 'Clara Wool Coat',
        productSlug: 'clara-wool-coat',
        productStatus: 'ACTIVE',
        size: 'M',
        color: 'Beige',
        stockQuantity: 1,
        price: 880,
        imageUrl: '/static/products/clara-wool-coat-1.svg',
      },
    ],
    [
      'var-draft',
      {
        id: 'var-draft',
        productId: 'prod-draft',
        productName: 'Draft Piece',
        productSlug: 'draft-piece',
        productStatus: 'DRAFT',
        size: 'M',
        color: 'Black',
        stockQuantity: 5,
        price: 100,
        imageUrl: '/static/products/draft.svg',
      },
    ],
    [
      'var-oos',
      {
        id: 'var-oos',
        productId: 'prod-oos',
        productName: 'Sold Out Piece',
        productSlug: 'sold-out-piece',
        productStatus: 'ACTIVE',
        size: 'M',
        color: 'Black',
        stockQuantity: 0,
        price: 100,
        imageUrl: '/static/products/oos.svg',
      },
    ],
  ]);

  carts = new Map();

  mock.method(cartRepository, 'findByUserId', async (userId: string) => buildCart(userId));
  mock.method(cartRepository, 'findVariantWithProduct', async (variantId: string) => {
    const variant = variants.get(variantId);
    return variant ? toVariant(variant) : null;
  });
  mock.method(
    cartRepository,
    'transaction',
    async (fn: (tx: CartTransaction) => Promise<unknown>) => fn(makeTransaction()),
  );
  mock.method(cartRepository, 'findItemForUser', async (itemId: string, userId: string) => {
    const cart = carts.get(userId);
    const item = cart?.items.find((entry) => entry.id === itemId);
    if (!item) {
      return null;
    }
    const variant = variants.get(item.variantId) as FakeVariant;
    return { id: item.id, variant: { stockQuantity: variant.stockQuantity } };
  });
  mock.method(cartRepository, 'updateItemQuantity', async (itemId: string, quantity: number) => {
    for (const cart of carts.values()) {
      const item = cart.items.find((entry) => entry.id === itemId);
      if (item) {
        item.quantity = quantity;
        return;
      }
    }
  });
  mock.method(cartRepository, 'deleteItemForUser', async (itemId: string, userId: string) => {
    const cart = carts.get(userId);
    if (!cart) {
      return { count: 0 };
    }
    const before = cart.items.length;
    cart.items = cart.items.filter((entry) => entry.id !== itemId);
    return { count: before - cart.items.length };
  });
  mock.method(cartRepository, 'findCartIdByUser', async (userId: string) => {
    const cart = carts.get(userId);
    return cart ? { id: cart.id } : null;
  });
  mock.method(cartRepository, 'clearItems', async (cartId: string) => {
    for (const cart of carts.values()) {
      if (cart.id === cartId) {
        cart.items = [];
      }
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

describe('cartService.getCart', () => {
  it('returns an empty cart for a user without one', async () => {
    const cart = await cartService.getCart('user-a');

    assert.deepEqual(cart, { items: [], subtotal: 0, itemCount: 0 });
  });
});

describe('cartService.addItem', () => {
  it('adds a variant and calculates totals from the database price', async () => {
    const cart = await cartService.addItem('user-a', 'var-m-black', 1);

    assert.equal(cart.items.length, 1);
    assert.equal(cart.itemCount, 1);
    assert.equal(cart.subtotal, 189);
    assert.equal(cart.items[0]?.unitPrice, 189);
    assert.equal(cart.items[0]?.size, 'M');
    assert.equal(cart.items[0]?.color, 'Black');
    assert.equal(cart.items[0]?.lineTotal, 189);
  });

  it('increments quantity when the same variant is added twice', async () => {
    await cartService.addItem('user-a', 'var-m-black', 1);
    const cart = await cartService.addItem('user-a', 'var-m-black', 2);

    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0]?.quantity, 3);
    assert.equal(cart.itemCount, 3);
    assert.equal(cart.subtotal, 567);
  });

  it('keeps different variants as separate lines', async () => {
    await cartService.addItem('user-a', 'var-m-black', 1);
    const cart = await cartService.addItem('user-a', 'var-s-beige', 1);

    assert.equal(cart.items.length, 2);
    assert.equal(cart.itemCount, 2);
    assert.equal(cart.subtotal, 709);
  });

  it('rejects an unknown variant', async () => {
    await expectError(cartService.addItem('user-a', 'missing', 1), 'VARIANT_NOT_FOUND');
  });

  it('rejects an inactive product', async () => {
    await expectError(cartService.addItem('user-a', 'var-draft', 1), 'PRODUCT_UNAVAILABLE');
  });

  it('rejects an out-of-stock variant', async () => {
    await expectError(cartService.addItem('user-a', 'var-oos', 1), 'INSUFFICIENT_STOCK');
  });

  it('rejects an invalid quantity', async () => {
    await expectError(cartService.addItem('user-a', 'var-m-black', 0), 'INVALID_QUANTITY');
  });

  it('enforces stock limits', async () => {
    await expectError(cartService.addItem('user-a', 'var-s-beige', 3), 'INSUFFICIENT_STOCK');
  });
});

describe('cartService.updateItem', () => {
  it('updates the quantity of an existing item', async () => {
    await cartService.addItem('user-a', 'var-m-black', 1);
    const cart = await cartService.updateItem('user-a', 'item-var-m-black', 4);

    assert.equal(cart.items[0]?.quantity, 4);
    assert.equal(cart.subtotal, 756);
  });

  it('rejects an invalid quantity', async () => {
    await cartService.addItem('user-a', 'var-m-black', 1);
    await expectError(cartService.updateItem('user-a', 'item-var-m-black', 0), 'INVALID_QUANTITY');
  });

  it('rejects a quantity above stock', async () => {
    await cartService.addItem('user-a', 'var-m-black', 1);
    await expectError(
      cartService.updateItem('user-a', 'item-var-m-black', 6),
      'INSUFFICIENT_STOCK',
    );
  });

  it('cannot modify another user cart item', async () => {
    await cartService.addItem('user-a', 'var-m-black', 1);
    await expectError(
      cartService.updateItem('user-b', 'item-var-m-black', 2),
      'CART_ITEM_NOT_FOUND',
    );
  });
});

describe('cartService.removeItem', () => {
  it('removes an existing item', async () => {
    await cartService.addItem('user-a', 'var-m-black', 1);
    const cart = await cartService.removeItem('user-a', 'item-var-m-black');

    assert.equal(cart.items.length, 0);
    assert.equal(cart.itemCount, 0);
  });

  it('reports a missing item', async () => {
    await expectError(cartService.removeItem('user-a', 'missing'), 'CART_ITEM_NOT_FOUND');
  });

  it('cannot remove another user cart item', async () => {
    await cartService.addItem('user-a', 'var-m-black', 1);
    await expectError(cartService.removeItem('user-b', 'item-var-m-black'), 'CART_ITEM_NOT_FOUND');
  });
});

describe('cartService.clear', () => {
  it('empties the cart', async () => {
    await cartService.addItem('user-a', 'var-m-black', 2);
    const cart = await cartService.clear('user-a');

    assert.equal(cart.items.length, 0);
  });
});

describe('cartService.merge', () => {
  it('does nothing for an empty guest cart', async () => {
    const cart = await cartService.merge('user-a', []);

    assert.equal(cart.items.length, 0);
  });

  it('merges a guest cart into an empty server cart', async () => {
    const cart = await cartService.merge('user-a', [
      { variantId: 'var-m-black', quantity: 1 },
      { variantId: 'var-s-beige', quantity: 1 },
    ]);

    assert.equal(cart.items.length, 2);
    assert.equal(cart.itemCount, 2);
    assert.equal(cart.subtotal, 709);
  });

  it('merges quantities for a variant present in both carts', async () => {
    await cartService.addItem('user-a', 'var-m-black', 1);
    const cart = await cartService.merge('user-a', [{ variantId: 'var-m-black', quantity: 1 }]);

    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0]?.quantity, 2);
  });

  it('merges multiple different variants', async () => {
    await cartService.addItem('user-a', 'var-m-camel', 1);
    const cart = await cartService.merge('user-a', [
      { variantId: 'var-m-black', quantity: 2 },
      { variantId: 'var-s-beige', quantity: 1 },
    ]);

    assert.equal(cart.items.length, 3);
    assert.equal(cart.itemCount, 4);
  });

  it('safely skips invalid guest variants', async () => {
    const cart = await cartService.merge('user-a', [
      { variantId: 'missing', quantity: 1 },
      { variantId: 'var-draft', quantity: 1 },
      { variantId: 'var-oos', quantity: 1 },
      { variantId: 'var-m-black', quantity: 1 },
    ]);

    assert.equal(cart.items.length, 1);
    assert.equal(cart.items[0]?.variantId, 'var-m-black');
  });

  it('respects stock limits when merging', async () => {
    const cart = await cartService.merge('user-a', [{ variantId: 'var-m-camel', quantity: 5 }]);

    assert.equal(cart.items[0]?.quantity, 1);
  });
});
