import { Router } from 'express';

import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { adminRateLimiter } from '../middleware/rateLimit.js';

export const adminRouter = Router();

// Every admin route requires an authenticated ADMIN session. The backend is
// authoritative — the admin UI never determines authorization.
adminRouter.use(adminRateLimiter, authenticate, authorize('ADMIN'));

adminRouter.get('/dashboard', adminController.dashboard);

adminRouter.get('/orders', adminController.listOrders);
adminRouter.get('/orders/:id', adminController.getOrder);
adminRouter.patch('/orders/:id/status', adminController.updateOrderStatus);

adminRouter.get('/products', adminController.listProducts);
adminRouter.get('/products/:id', adminController.getProduct);
adminRouter.post('/products', adminController.createProduct);
adminRouter.patch('/products/:id', adminController.updateProduct);

adminRouter.get('/inventory', adminController.listInventory);
adminRouter.patch('/inventory/:variantId', adminController.updateInventory);

adminRouter.get('/categories', adminController.listCategories);
adminRouter.post('/categories', adminController.createCategory);
adminRouter.patch('/categories/:id', adminController.updateCategory);

adminRouter.get('/customers', adminController.listCustomers);
adminRouter.get('/customers/:id', adminController.getCustomer);
