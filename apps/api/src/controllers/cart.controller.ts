import type { Request, Response } from 'express';

import {
  addCartItemSchema,
  mergeCartSchema,
  updateCartItemSchema,
} from '../schemas/cart.schema.js';
import { cartService } from '../services/cart.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/authContext.js';
import { requireParam } from '../utils/params.js';

export const cartController = {
  getCart: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const cart = await cartService.getCart(userId);
    res.status(200).json({ data: cart });
  }),

  addItem: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const input = addCartItemSchema.parse(req.body);
    const cart = await cartService.addItem(userId, input.variantId, input.quantity);
    res.status(201).json({ data: cart });
  }),

  updateItem: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const input = updateCartItemSchema.parse(req.body);
    const cart = await cartService.updateItem(userId, requireParam(req, 'itemId'), input.quantity);
    res.status(200).json({ data: cart });
  }),

  removeItem: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const cart = await cartService.removeItem(userId, requireParam(req, 'itemId'));
    res.status(200).json({ data: cart });
  }),

  clear: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const cart = await cartService.clear(userId);
    res.status(200).json({ data: cart });
  }),

  merge: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const input = mergeCartSchema.parse(req.body);
    const cart = await cartService.merge(userId, input.items);
    res.status(200).json({ data: cart });
  }),
};
