import { Router } from 'express';

import { orderController } from '../controllers/order.controller.js';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { paymentRateLimiter } from '../middleware/rateLimit.js';

export const orderRouter = Router();

orderRouter.use(authenticate);

orderRouter.post('/', orderController.createOrder);
orderRouter.get('/', orderController.list);
orderRouter.get('/:id', orderController.getById);
orderRouter.post('/:id/payment', paymentRateLimiter, paymentController.createPaymentIntent);
