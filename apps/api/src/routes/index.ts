import { Router } from 'express';

import { addressRouter } from './address.routes.js';
import { adminRouter } from './admin.routes.js';
import { authRouter } from './auth.routes.js';
import { cartRouter } from './cart.routes.js';
import { categoryRouter } from './category.routes.js';
import { healthRouter } from './health.routes.js';
import { orderRouter } from './order.routes.js';
import { productRouter } from './product.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/addresses', addressRouter);
apiRouter.use('/cart', cartRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/categories', categoryRouter);
