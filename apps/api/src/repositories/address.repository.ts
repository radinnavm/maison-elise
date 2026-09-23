import type { Address, Prisma } from '@prisma/client';

import { prisma } from '../config/prisma.js';

export type AddressRecord = Address;

export interface AddressTransaction {
  clearDefault(userId: string): Promise<void>;
  create(
    userId: string,
    data: Prisma.AddressUncheckedCreateWithoutUserInput,
  ): Promise<AddressRecord>;
  update(id: string, data: Prisma.AddressUpdateInput): Promise<AddressRecord>;
  remove(id: string): Promise<void>;
}

function createTransaction(tx: Prisma.TransactionClient): AddressTransaction {
  return {
    async clearDefault(userId) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    },
    create(userId, data) {
      return tx.address.create({ data: { ...data, userId } });
    },
    update(id, data) {
      return tx.address.update({ where: { id }, data });
    },
    async remove(id) {
      await tx.address.delete({ where: { id } });
    },
  };
}

export const addressRepository = {
  findManyByUser(userId: string): Promise<AddressRecord[]> {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  },

  findForUser(id: string, userId: string): Promise<AddressRecord | null> {
    return prisma.address.findFirst({ where: { id, userId } });
  },

  countByUser(userId: string): Promise<number> {
    return prisma.address.count({ where: { userId } });
  },

  transaction<T>(fn: (tx: AddressTransaction) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => fn(createTransaction(tx)));
  },
};
