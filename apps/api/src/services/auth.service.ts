import type { AuthUser } from '@maison-elise/shared';

import { toAuthUser } from '../mappers/user.mapper.js';
import { userRepository } from '../repositories/user.repository.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import { ConflictError, UnauthenticatedError } from '../utils/errors.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { notificationService } from './notification.service.js';

const INVALID_CREDENTIALS = 'The email or password you entered is incorrect.';

function resolveName(input: RegisterInput): { firstName: string; lastName: string } {
  if (input.firstName && input.lastName) {
    return { firstName: input.firstName, lastName: input.lastName };
  }

  const parts = (input.name ?? '').trim().split(/\s+/).filter(Boolean);

  const firstName = input.firstName ?? parts[0] ?? '';
  const lastName = input.lastName ?? parts.slice(1).join(' ');

  return { firstName, lastName };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthUser> {
    const existing = await userRepository.findByEmail(input.email);

    if (existing) {
      throw new ConflictError('An account with this email already exists.', 'EMAIL_IN_USE');
    }

    const passwordHash = await hashPassword(input.password);
    const { firstName, lastName } = resolveName(input);

    const user = await userRepository.create({
      firstName,
      lastName,
      email: input.email,
      passwordHash,
      role: 'CUSTOMER',
    });

    // Welcome email is a side effect: never block registration on delivery.
    void notificationService.sendWelcome(user.id).catch(() => undefined);

    return toAuthUser(user);
  },

  async login(input: LoginInput): Promise<AuthUser> {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      throw new UnauthenticatedError(INVALID_CREDENTIALS);
    }

    const matches = await comparePassword(input.password, user.passwordHash);

    if (!matches) {
      throw new UnauthenticatedError(INVALID_CREDENTIALS);
    }

    return toAuthUser(user);
  },

  async getById(id: string): Promise<AuthUser> {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new UnauthenticatedError('Your account could not be found.');
    }

    return toAuthUser(user);
  },
};
