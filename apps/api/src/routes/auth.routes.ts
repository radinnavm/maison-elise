import { Router } from 'express';

import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

export const authRouter = Router();

authRouter.post('/register', authRateLimiter, authController.register);
authRouter.post('/login', authRateLimiter, authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);
