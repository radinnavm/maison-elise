import type { User } from '@prisma/client';

import type { AuthUser } from '@maison-elise/shared';

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim(),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
