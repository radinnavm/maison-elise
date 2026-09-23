import { Router } from 'express';

import { addressController } from '../controllers/address.controller.js';
import { authenticate } from '../middleware/authenticate.js';

export const addressRouter = Router();

addressRouter.use(authenticate);

addressRouter.get('/', addressController.list);
addressRouter.post('/', addressController.create);
addressRouter.patch('/:id/default', addressController.setDefault);
addressRouter.patch('/:id', addressController.update);
addressRouter.delete('/:id', addressController.remove);
