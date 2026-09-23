import type { Request, Response } from 'express';

import { productListQuerySchema } from '../schemas/query.schema.js';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema.js';
import { productService } from '../services/product.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireParam } from '../utils/params.js';

export const productController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = productListQuerySchema.parse(req.query);
    const result = await productService.list(query);
    res.status(200).json(result);
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getBySlug(requireParam(req, 'slug'));
    res.status(200).json(product);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createProductSchema.parse(req.body);
    const product = await productService.create(input);
    res.status(201).json(product);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updateProductSchema.parse(req.body);
    const product = await productService.update(requireParam(req, 'id'), input);
    res.status(200).json(product);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await productService.remove(requireParam(req, 'id'));
    res.status(204).send();
  }),
};
