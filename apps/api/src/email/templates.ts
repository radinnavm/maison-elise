import { APP_NAME, formatDateTime, formatPrice } from '@maison-elise/shared';
import type { OrderDto, OrderShippingAddressDto } from '@maison-elise/shared';

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function layout(heading: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background-color:#f7f4ef;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f4ef;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background-color:#ffffff;border:1px solid #e3dcd1;">
            <tr>
              <td style="padding:32px 40px 8px 40px;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:6px;text-transform:uppercase;color:#23201c;">
                ${APP_NAME}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 0 40px;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#23201c;">
                ${heading}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 40px 40px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#4a443d;">
                ${body}
              </td>
            </tr>
          </table>
          <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1px;color:#857a6f;margin:16px 0 0 0;">
            ${APP_NAME} — this is a transactional message.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function orderItemsRows(order: OrderDto): string {
  return order.items
    .map(
      (item) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e3dcd1;">
          <strong style="color:#23201c;">${item.productName}</strong><br />
          <span style="color:#857a6f;font-size:13px;">${item.color} / ${item.size} · ${formatPrice(item.unitPrice, order.currency)} × ${item.quantity}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #e3dcd1;text-align:right;white-space:nowrap;">${formatPrice(item.lineTotal, order.currency)}</td>
      </tr>`,
    )
    .join('');
}

function shippingBlock(address: OrderShippingAddressDto | null): string {
  if (!address) {
    return '';
  }

  return `<p style="margin:20px 0 0 0;"><strong style="color:#23201c;">Shipping address</strong><br />
    ${address.firstName} ${address.lastName}<br />
    ${address.addressLine1}${address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
    ${address.postalCode} ${address.city}, ${address.countryCode}<br />
    ${address.phone}</p>`;
}

function totalsBlock(order: OrderDto): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    <tr><td style="padding:2px 0;">Subtotal</td><td style="padding:2px 0;text-align:right;">${formatPrice(order.subtotal, order.currency)}</td></tr>
    <tr><td style="padding:2px 0;">Shipping</td><td style="padding:2px 0;text-align:right;">${order.shippingAmount > 0 ? formatPrice(order.shippingAmount, order.currency) : 'Free'}</td></tr>
    <tr><td style="padding:8px 0 0 0;font-weight:bold;color:#23201c;">Total</td><td style="padding:8px 0 0 0;text-align:right;font-weight:bold;color:#23201c;">${formatPrice(order.total, order.currency)}</td></tr>
  </table>`;
}

function orderSummary(order: OrderDto): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${orderItemsRows(order)}
    </table>
    ${totalsBlock(order)}`;
}

export function renderOrderConfirmation(params: {
  firstName: string;
  order: OrderDto;
  orderUrl: string;
}): RenderedEmail {
  const { firstName, order, orderUrl } = params;

  const body = `<p style="margin:0 0 12px 0;">Dear ${firstName}, thank you for your order. We have received it and it is awaiting payment.</p>
    <p style="margin:0 0 4px 0;"><strong style="color:#23201c;">Order ${order.orderNumber}</strong><br />
    <span style="color:#857a6f;font-size:13px;">${formatDateTime(order.createdAt)}</span></p>
    ${orderSummary(order)}
    ${shippingBlock(order.shippingAddress)}
    <p style="margin:24px 0 0 0;"><a href="${orderUrl}" style="color:#2c2420;">View your order</a></p>`;

  return {
    subject: `Order ${order.orderNumber} — ${APP_NAME}`,
    html: layout('Order received', body),
    text: `Dear ${firstName}, we have received order ${order.orderNumber} (total ${formatPrice(order.total, order.currency)}). View it at ${orderUrl}.`,
  };
}

export function renderPaymentSuccess(params: {
  firstName: string;
  order: OrderDto;
  orderUrl: string;
}): RenderedEmail {
  const { firstName, order, orderUrl } = params;

  const body = `<p style="margin:0 0 12px 0;">Dear ${firstName}, we have received your payment. Your order is confirmed.</p>
    <p style="margin:0 0 4px 0;"><strong style="color:#23201c;">Order ${order.orderNumber}</strong></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr><td style="padding:2px 0;">Amount paid</td><td style="padding:2px 0;text-align:right;">${formatPrice(order.total, order.currency)}</td></tr>
      <tr><td style="padding:2px 0;">Payment status</td><td style="padding:2px 0;text-align:right;">Paid</td></tr>
    </table>
    <p style="margin:24px 0 0 0;"><a href="${orderUrl}" style="color:#2c2420;">View your order</a></p>`;

  return {
    subject: `Payment received — order ${order.orderNumber}`,
    html: layout('Payment received', body),
    text: `Dear ${firstName}, payment of ${formatPrice(order.total, order.currency)} for order ${order.orderNumber} has been received. View it at ${orderUrl}.`,
  };
}

export function renderPaymentFailed(params: {
  firstName: string;
  order: OrderDto;
  orderUrl: string;
}): RenderedEmail {
  const { firstName, order, orderUrl } = params;

  const body = `<p style="margin:0 0 12px 0;">Dear ${firstName}, we could not complete the payment for your order. No payment has been taken.</p>
    <p style="margin:0 0 4px 0;"><strong style="color:#23201c;">Order ${order.orderNumber}</strong><br />
    <span style="color:#857a6f;font-size:13px;">Amount due ${formatPrice(order.total, order.currency)}</span></p>
    <p style="margin:16px 0 0 0;">You can return to your order to try the payment again.</p>
    <p style="margin:24px 0 0 0;"><a href="${orderUrl}" style="color:#2c2420;">Retry payment</a></p>`;

  return {
    subject: `Payment could not be completed — order ${order.orderNumber}`,
    html: layout('Payment could not be completed', body),
    text: `Dear ${firstName}, the payment for order ${order.orderNumber} could not be completed. Retry at ${orderUrl}.`,
  };
}

export function renderOrderStatusChanged(params: {
  firstName: string;
  order: OrderDto;
  status: 'CONFIRMED' | 'CANCELLED';
  orderUrl: string;
}): RenderedEmail {
  const { firstName, order, status, orderUrl } = params;
  const label = status === 'CONFIRMED' ? 'confirmed' : 'cancelled';

  const body = `<p style="margin:0 0 12px 0;">Dear ${firstName}, your order has been ${label}.</p>
    <p style="margin:0 0 4px 0;"><strong style="color:#23201c;">Order ${order.orderNumber}</strong></p>
    <p style="margin:24px 0 0 0;"><a href="${orderUrl}" style="color:#2c2420;">View your order</a></p>`;

  return {
    subject: `Order ${order.orderNumber} ${label}`,
    html: layout(`Order ${label}`, body),
    text: `Dear ${firstName}, your order ${order.orderNumber} has been ${label}. View it at ${orderUrl}.`,
  };
}

export function renderWelcome(params: { firstName: string; accountUrl: string }): RenderedEmail {
  const { firstName, accountUrl } = params;

  const body = `<p style="margin:0 0 12px 0;">Dear ${firstName}, welcome to ${APP_NAME}.</p>
    <p style="margin:0 0 12px 0;">Your account is ready — you can review your orders and manage your details at any time.</p>
    <p style="margin:24px 0 0 0;"><a href="${accountUrl}" style="color:#2c2420;">Visit your account</a></p>`;

  return {
    subject: `Welcome to ${APP_NAME}`,
    html: layout('Welcome', body),
    text: `Dear ${firstName}, welcome to ${APP_NAME}. Visit your account at ${accountUrl}.`,
  };
}
