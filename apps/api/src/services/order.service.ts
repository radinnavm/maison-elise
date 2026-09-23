import type { OrderDto, OrderListResponse, OrderStatus } from '@maison-elise/shared';

import { toOrderDto } from '../mappers/order.mapper.js';
import { addressRepository } from '../repositories/address.repository.js';
import { orderRepository, type OrderItemSnapshot } from '../repositories/order.repository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { buildPaginationMeta, parsePagination } from '../utils/pagination.js';
import { notificationService } from './notification.service.js';

/**
 * Explicit order lifecycle. CONFIRMED is normally set by the Stripe webhook on a
 * successful payment; an admin may only confirm an already-paid order. Cancelling
 * an order restores stock for its items.
 */
const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
  CANCELLED: [],
};

export const orderService = {
  async createOrder(userId: string, addressId: string): Promise<OrderDto> {
    // The shipping address must belong to the authenticated user.
    const address = await addressRepository.findForUser(addressId, userId);

    if (!address) {
      throw new NotFoundError('Shipping address not found.', 'ADDRESS_NOT_FOUND');
    }

    const order = await orderRepository.transaction(async (tx) => {
      const cart = await tx.findCartWithItems(userId);

      if (!cart || cart.items.length === 0) {
        throw new ConflictError('Your bag is empty.', 'CART_EMPTY');
      }

      const lines: OrderItemSnapshot[] = [];
      let subtotal = 0;
      let currency: string | undefined;

      for (const item of cart.items) {
        if (item.product.status !== 'ACTIVE') {
          throw new ConflictError(
            `"${item.product.name}" is no longer available.`,
            'PRODUCT_UNAVAILABLE',
          );
        }

        if (!Number.isInteger(item.quantity) || item.quantity < 1) {
          throw new ConflictError('Your bag contains an invalid quantity.', 'INVALID_QUANTITY');
        }

        const decremented = await tx.decrementStock(item.variantId, item.quantity);

        if (decremented === 0) {
          throw new ConflictError(
            `Only ${item.variant.stockQuantity} left of "${item.product.name}" (${item.variant.size}/${item.variant.color}).`,
            'INSUFFICIENT_STOCK',
          );
        }

        const unitPrice = Number(item.variant.price);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        currency ??= item.product.currency;

        lines.push({
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          size: item.variant.size,
          color: item.variant.color,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        });
      }

      // Maison Élise currently offers free shipping. The amount is persisted
      // explicitly so a real shipping service can replace this calculation later.
      const shippingAmount = 0;

      const order = await tx.createOrder({
        userId,
        status: 'PENDING',
        currency: currency ?? 'EUR',
        subtotal,
        shippingAmount,
        total: subtotal + shippingAmount,
      });

      await tx.createOrderItems(order.id, lines);
      await tx.createShippingAddress(order.id, {
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        postalCode: address.postalCode,
        countryCode: address.countryCode,
      });
      await tx.clearCart(cart.id);

      const created = await tx.findOrderWithItems(order.id);
      return toOrderDto(created);
    });

    // Order confirmation is a side effect of a committed order.
    void notificationService.sendOrderConfirmation(order.id).catch(() => undefined);

    return order;
  },

  async list(userId: string, page: number, limit: number): Promise<OrderListResponse> {
    const pagination = parsePagination(page, limit);
    const { items, total } = await orderRepository.findManyByUser(
      userId,
      pagination.skip,
      pagination.take,
    );

    return {
      data: items.map(toOrderDto),
      meta: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  },

  async getById(userId: string, orderId: string): Promise<OrderDto> {
    const order = await orderRepository.findByIdForUser(orderId, userId);

    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    return toOrderDto(order);
  },

  async updateStatus(orderId: string, nextStatus: OrderStatus): Promise<OrderDto> {
    const order = await orderRepository.transaction(async (tx) => {
      const order = await tx.findOrderWithItems(orderId);

      if (!ORDER_TRANSITIONS[order.status].includes(nextStatus)) {
        throw new ConflictError(
          `An order with status ${order.status} cannot be moved to ${nextStatus}.`,
          'INVALID_STATE_TRANSITION',
        );
      }

      if (nextStatus === 'CONFIRMED' && order.paymentStatus !== 'PAID') {
        throw new ConflictError(
          'An order can only be confirmed once its payment has been received.',
          'PAYMENT_NOT_PAID',
        );
      }

      // Conditional status update: only the first concurrent transition wins,
      // so stock can never be restored twice by parallel cancellation requests.
      const changed = await tx.updateOrderStatus(orderId, nextStatus, order.status);

      if (changed === 0) {
        throw new ConflictError(
          'The order status changed while this request was being processed.',
          'INVALID_STATE_TRANSITION',
        );
      }

      if (nextStatus === 'CANCELLED') {
        // Restore reserved stock exactly once (guarded by the conditional update).
        for (const item of order.items) {
          await tx.incrementStock(item.variantId, item.quantity);
        }
      }

      return toOrderDto(await tx.findOrderWithItems(orderId));
    });

    if (nextStatus === 'CONFIRMED' || nextStatus === 'CANCELLED') {
      void notificationService.sendOrderStatusChanged(orderId, nextStatus).catch(() => undefined);
    }

    return order;
  },
};
