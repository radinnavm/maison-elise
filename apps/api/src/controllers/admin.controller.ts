import type { Request, Response } from 'express';

import {
  adminCustomerListQuerySchema,
  adminInventoryListQuerySchema,
  adminOrderListQuerySchema,
  adminProductListQuerySchema,
  inventoryUpdateSchema,
  orderStatusUpdateSchema,
} from '../schemas/admin.schema.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema.js';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema.js';
import { adminService } from '../services/admin.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireParam } from '../utils/params.js';

export const adminController = {
  dashboard: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json({ data: await adminService.getDashboard() });
  }),

  listOrders: asyncHandler(async (req: Request, res: Response) => {
    const query = adminOrderListQuerySchema.parse(req.query);
    res.status(200).json(await adminService.listOrders(query));
  }),

  getOrder: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({ data: await adminService.getOrder(requireParam(req, 'id')) });
  }),

  updateOrderStatus: asyncHandler(async (req: Request, res: Response) => {
    const input = orderStatusUpdateSchema.parse(req.body);
    res
      .status(200)
      .json({ data: await adminService.updateOrderStatus(requireParam(req, 'id'), input.status) });
  }),

  listProducts: asyncHandler(async (req: Request, res: Response) => {
    const query = adminProductListQuerySchema.parse(req.query);
    res.status(200).json(await adminService.listProducts(query));
  }),

  getProduct: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({ data: await adminService.getProduct(requireParam(req, 'id')) });
  }),

  createProduct: asyncHandler(async (req: Request, res: Response) => {
    const input = createProductSchema.parse(req.body);
    res.status(201).json({ data: await adminService.createProduct(input) });
  }),

  updateProduct: asyncHandler(async (req: Request, res: Response) => {
    const input = updateProductSchema.parse(req.body);
    res
      .status(200)
      .json({ data: await adminService.updateProduct(requireParam(req, 'id'), input) });
  }),

  listInventory: asyncHandler(async (req: Request, res: Response) => {
    const query = adminInventoryListQuerySchema.parse(req.query);
    res.status(200).json(await adminService.listInventory(query));
  }),

  updateInventory: asyncHandler(async (req: Request, res: Response) => {
    const input = inventoryUpdateSchema.parse(req.body);
    res.status(200).json({
      data: await adminService.updateInventory(requireParam(req, 'variantId'), input.stockQuantity),
    });
  }),

  listCategories: asyncHandler(async (_req: Request, res: Response) => {
    res.status(200).json(await adminService.listCategories());
  }),

  createCategory: asyncHandler(async (req: Request, res: Response) => {
    const input = createCategorySchema.parse(req.body);
    res.status(201).json({ data: await adminService.createCategory(input) });
  }),

  updateCategory: asyncHandler(async (req: Request, res: Response) => {
    const input = updateCategorySchema.parse(req.body);
    res
      .status(200)
      .json({ data: await adminService.updateCategory(requireParam(req, 'id'), input) });
  }),

  listCustomers: asyncHandler(async (req: Request, res: Response) => {
    const query = adminCustomerListQuerySchema.parse(req.query);
    res.status(200).json(await adminService.listCustomers(query));
  }),

  getCustomer: asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json({ data: await adminService.getCustomer(requireParam(req, 'id')) });
  }),
};
