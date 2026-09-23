import type { AuthResponse } from '@maison-elise/shared';
import type { Request, Response } from 'express';

import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../utils/authContext.js';
import { clearAuthCookie, setAuthCookie } from '../utils/cookies.js';
import { signAuthToken } from '../utils/jwt.js';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);
    const user = await authService.register(input);

    setAuthCookie(res, signAuthToken({ userId: user.id, role: user.role }));

    const body: AuthResponse = { user };
    res.status(201).json(body);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);
    const user = await authService.login(input);

    setAuthCookie(res, signAuthToken({ userId: user.id, role: user.role }));

    const body: AuthResponse = { user };
    res.status(200).json(body);
  }),

  logout: (_req: Request, res: Response): void => {
    clearAuthCookie(res);
    res.status(200).json({ status: 'ok' });
  },

  me: asyncHandler(async (req: Request, res: Response) => {
    const { userId } = requireAuth(req);
    const user = await authService.getById(userId);

    const body: AuthResponse = { user };
    res.status(200).json(body);
  }),
};
