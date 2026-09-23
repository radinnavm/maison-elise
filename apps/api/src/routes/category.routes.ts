import { Router } from 'express';

import { categoryController } from '../controllers/category.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

export const categoryRouter = Router();

categoryRouter.get('/', categoryController.list);
categoryRouter.get('/:slug', categoryController.getBySlug);

categoryRouter.post('/', authenticate, authorize('ADMIN'), categoryController.create);
categoryRouter.patch('/:id', authenticate, authorize('ADMIN'), categoryController.update);
categoryRouter.delete('/:id', authenticate, authorize('ADMIN'), categoryController.remove);
