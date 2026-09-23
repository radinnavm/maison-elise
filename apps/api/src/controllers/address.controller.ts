import type { Request, Response } from 'express';

import { addressInputSchema, updateAddressSchema } from '../schemas/address.schema.js';
import { addressService } from '../services/address.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/authContext.js';
import { requireParam } from '../utils/params.js';

export const addressController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    res.status(200).json({ data: await addressService.list(userId) });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const input = addressInputSchema.parse(req.body);
    res.status(201).json({ data: await addressService.create(userId, input) });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const input = updateAddressSchema.parse(req.body);
    res
      .status(200)
      .json({ data: await addressService.update(userId, requireParam(req, 'id'), input) });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    await addressService.remove(userId, requireParam(req, 'id'));
    res.status(204).send();
  }),

  setDefault: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    res
      .status(200)
      .json({ data: await addressService.setDefault(userId, requireParam(req, 'id')) });
  }),
};
