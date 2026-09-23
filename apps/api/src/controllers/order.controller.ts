import type { Request, Response } from 'express';

import { createOrderSchema, orderListQuerySchema } from '../schemas/order.schema.js';
import { orderService } from '../services/order.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/authContext.js';
import { requireParam } from '../utils/params.js';

export const orderController = {
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const input = createOrderSchema.parse(req.body);
    const order = await orderService.createOrder(userId, input.addressId);
    res.status(201).json({ data: order });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const query = orderListQuerySchema.parse(req.query);
    const orders = await orderService.list(userId, query.page, query.limit);
    res.status(200).json(orders);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const order = await orderService.getById(userId, requireParam(req, 'id'));
    res.status(200).json({ data: order });
  }),
};
