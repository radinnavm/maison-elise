import type { AuthRole } from '@maison-elise/shared';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: AuthRole;
      };
      id?: string;
    }
  }
}

export {};
