import type { Request, Response } from 'express';

import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema.js';
import { categoryService } from '../services/category.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireParam } from '../utils/params.js';

export const categoryController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const categories = await categoryService.list();
    res.status(200).json(categories);
  }),

  getBySlug: asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.getBySlug(requireParam(req, 'slug'));
    res.status(200).json(category);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const input = createCategorySchema.parse(req.body);
    const category = await categoryService.create(input);
    res.status(201).json(category);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const input = updateCategorySchema.parse(req.body);
    const category = await categoryService.update(requireParam(req, 'id'), input);
    res.status(200).json(category);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await categoryService.remove(requireParam(req, 'id'));
    res.status(204).send();
  }),
};
