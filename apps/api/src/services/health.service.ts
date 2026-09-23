import { prisma } from '../config/prisma.js';

/**
 * Dependency checks for readiness probes. Kept as a small seam so it can be
 * exercised in tests without touching a real database.
 */
export const healthService = {
  async checkDatabase(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  },
};
