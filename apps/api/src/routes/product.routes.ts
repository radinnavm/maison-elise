import { Router } from 'express';

import { productController } from '../controllers/product.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

export const productRouter = Router();

productRouter.get('/', productController.list);
productRouter.get('/:slug', productController.getBySlug);

productRouter.post('/', authenticate, authorize('ADMIN'), productController.create);
productRouter.patch('/:id', authenticate, authorize('ADMIN'), productController.update);
productRouter.delete('/:id', authenticate, authorize('ADMIN'), productController.remove);
