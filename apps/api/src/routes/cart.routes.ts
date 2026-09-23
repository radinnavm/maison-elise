import { Router } from 'express';

import { cartController } from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/authenticate.js';

export const cartRouter = Router();

cartRouter.use(authenticate);

cartRouter.get('/', cartController.getCart);
cartRouter.post('/items', cartController.addItem);
cartRouter.patch('/items/:itemId', cartController.updateItem);
cartRouter.delete('/items/:itemId', cartController.removeItem);
cartRouter.delete('/', cartController.clear);
cartRouter.post('/merge', cartController.merge);
