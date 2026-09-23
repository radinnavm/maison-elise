import type { Request, Response } from 'express';
import type Stripe from 'stripe';

import { getStripeWebhookSecret } from '../config/stripe.js';
import { paymentService } from '../services/payment.service.js';
import { stripeGateway } from '../services/stripe.gateway.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/authContext.js';
import { AppError } from '../utils/errors.js';
import { requireParam } from '../utils/params.js';

export const paymentController = {
  createPaymentIntent: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const result = await paymentService.createPaymentIntent(userId, requireParam(req, 'id'));
    res.status(200).json({ data: result });
  }),

  stripeWebhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];

    if (typeof signature !== 'string') {
      throw new AppError(400, 'INVALID_SIGNATURE', 'Missing Stripe signature.');
    }

    let event: Stripe.Event;

    try {
      // req.body is a Buffer here because the route uses express.raw().
      event = stripeGateway.constructEvent(req.body as Buffer, signature, getStripeWebhookSecret());
    } catch {
      throw new AppError(400, 'INVALID_SIGNATURE', 'Invalid Stripe signature.');
    }

    await paymentService.handleWebhookEvent(event);

    res.status(200).json({ received: true });
  }),
};
