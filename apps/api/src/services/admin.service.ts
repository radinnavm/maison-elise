import { LOW_STOCK_THRESHOLD } from '@maison-elise/shared';
import type {
  AdminCustomerDetailDto,
  AdminCustomerListResponse,
  AdminDashboardDto,
  AdminInventoryItem,
  AdminInventoryListResponse,
  AdminOrderDetailDto,
  AdminOrderListResponse,
  AdminProductListResponse,
  CategoryDto,
  OrderDto,
  OrderStatus,
  ProductDto,
} from '@maison-elise/shared';
import type { Prisma } from '@prisma/client';

import {
  toAdminCustomerDetail,
  toAdminCustomerListItem,
  toAdminInventoryItem,
  toAdminOrderDetailDto,
  toAdminOrderDto,
  toAdminProductListItem,
} from '../mappers/admin.mapper.js';
import { toCategoryDto } from '../mappers/category.mapper.js';
import { toProductDto } from '../mappers/product.mapper.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import type {
  AdminCustomerListQuery,
  AdminInventoryListQuery,
  AdminOrderListQuery,
  AdminProductListQuery,
} from '../schemas/admin.schema.js';
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema.js';
import type { CreateProductInput, UpdateProductInput } from '../schemas/product.schema.js';
import { NotFoundError } from '../utils/errors.js';
import { buildPaginationMeta, parsePagination } from '../utils/pagination.js';
import { categoryService } from './category.service.js';
import { orderService } from './order.service.js';
import { productService } from './product.service.js';

export const adminService = {
  async getDashboard(): Promise<AdminDashboardDto> {
    const stats = await adminRepository.dashboard();

    return {
      orders: {
        total: stats.total,
        pending: stats.pending,
        confirmed: stats.confirmed,
        cancelled: stats.cancelled,
      },
      revenue: { confirmed: stats.confirmedRevenue, currency: 'EUR' },
      inventory: {
        products: stats.products,
        lowStockVariants: stats.lowStockVariants,
        outOfStockVariants: stats.outOfStockVariants,
      },
      customers: { total: stats.customers },
    };
  },

  async listOrders(query: AdminOrderListQuery): Promise<AdminOrderListResponse> {
    const pagination = parsePagination(query.page, query.limit);
    const where: Prisma.OrderWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    if (query.search) {
      const term = query.search;
      const numeric = /^\d+$/.test(term) ? Number(term) : undefined;

      where.OR = [
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { firstName: { contains: term, mode: 'insensitive' } } },
        { user: { lastName: { contains: term, mode: 'insensitive' } } },
        ...(numeric !== undefined ? [{ sequence: numeric }] : []),
      ];
    }

    const { items, total } = await adminRepository.findOrders(
      where,
      pagination.skip,
      pagination.take,
    );

    return {
      data: items.map(toAdminOrderDto),
      meta: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  },

  async getOrder(orderId: string): Promise<AdminOrderDetailDto> {
    const order = await adminRepository.findOrder(orderId);

    if (!order) {
      throw new NotFoundError('Order not found.', 'ORDER_NOT_FOUND');
    }

    const emails = await adminRepository.findEmailDeliveries(orderId);

    return toAdminOrderDetailDto(order, emails);
  },

  updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderDto> {
    return orderService.updateStatus(orderId, status);
  },

  async listProducts(query: AdminProductListQuery): Promise<AdminProductListResponse> {
    const pagination = parsePagination(query.page, query.limit);
    const where: Prisma.ProductWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'name_asc'
        ? { name: 'asc' }
        : query.sort === 'price_asc'
          ? { basePrice: 'asc' }
          : query.sort === 'price_desc'
            ? { basePrice: 'desc' }
            : { createdAt: 'desc' };

    const { items, total } = await adminRepository.findProducts(
      where,
      orderBy,
      pagination.skip,
      pagination.take,
    );

    return {
      data: items.map(toAdminProductListItem),
      meta: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  },

  async getProduct(productId: string): Promise<ProductDto> {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw new NotFoundError('Product not found.', 'PRODUCT_NOT_FOUND');
    }

    return toProductDto(product);
  },

  createProduct(input: CreateProductInput): Promise<ProductDto> {
    return productService.create(input);
  },

  updateProduct(id: string, input: UpdateProductInput): Promise<ProductDto> {
    return productService.update(id, input);
  },

  async listInventory(query: AdminInventoryListQuery): Promise<AdminInventoryListResponse> {
    const pagination = parsePagination(query.page, query.limit);
    const where: Prisma.ProductVariantWhereInput = {};

    if (query.stock === 'low') {
      where.stockQuantity = { gt: 0, lte: LOW_STOCK_THRESHOLD };
    } else if (query.stock === 'out') {
      where.stockQuantity = { lte: 0 };
    }

    if (query.search) {
      where.OR = [
        { sku: { contains: query.search, mode: 'insensitive' } },
        { size: { contains: query.search, mode: 'insensitive' } },
        { color: { contains: query.search, mode: 'insensitive' } },
        { product: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const { items, total } = await adminRepository.findInventory(
      where,
      pagination.skip,
      pagination.take,
    );

    return {
      data: items.map(toAdminInventoryItem),
      meta: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  },

  async updateInventory(variantId: string, stockQuantity: number): Promise<AdminInventoryItem> {
    const variant = await adminRepository.findVariant(variantId);

    if (!variant) {
      throw new NotFoundError('Variant not found.', 'VARIANT_NOT_FOUND');
    }

    return toAdminInventoryItem(await adminRepository.updateVariantStock(variantId, stockQuantity));
  },

  async listCategories(): Promise<CategoryDto[]> {
    const categories = await categoryRepository.findMany();
    return categories.map(toCategoryDto);
  },

  createCategory(input: CreateCategoryInput): Promise<CategoryDto> {
    return categoryService.create(input);
  },

  updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryDto> {
    return categoryService.update(id, input);
  },

  async listCustomers(query: AdminCustomerListQuery): Promise<AdminCustomerListResponse> {
    const pagination = parsePagination(query.page, query.limit);
    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { items, total } = await adminRepository.findCustomers(
      where,
      pagination.skip,
      pagination.take,
    );

    return {
      data: items.map(toAdminCustomerListItem),
      meta: buildPaginationMeta(total, pagination.page, pagination.limit),
    };
  },

  async getCustomer(customerId: string): Promise<AdminCustomerDetailDto> {
    const customer = await adminRepository.findCustomer(customerId);

    if (!customer) {
      throw new NotFoundError('Customer not found.', 'CUSTOMER_NOT_FOUND');
    }

    const [confirmedSpend, recentOrders] = await Promise.all([
      adminRepository.customerConfirmedSpend(customerId),
      adminRepository.customerRecentOrders(customerId, 5),
    ]);

    return toAdminCustomerDetail(customer, confirmedSpend, recentOrders);
  },
};
