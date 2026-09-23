import { useCallback, useMemo } from 'react';

import type { CartItemDto } from '@maison-elise/shared';

import {
  useAddCartItemMutation,
  useClearCartMutation,
  useGetCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '@/api/cartApi';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import {
  addItem as addGuestItem,
  clearCart as clearGuestCart,
  removeItem as removeGuestItem,
  selectCartItems,
  updateQuantity as updateGuestQuantity,
} from '@/features/cart/cartSlice';
import type { AddCartItemInput } from '@/types/cart';

export type CartLine = CartItemDto;

export interface UseCartResult {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: unknown;
  isMutating: boolean;
  refetch: () => void;
  addItem: (input: AddCartItemInput) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clear: () => Promise<void>;
}

export function useCart(): UseCartResult {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const guestItems = useAppSelector(selectCartItems);

  const { data, isLoading, error, refetch } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [addCartItem, addState] = useAddCartItemMutation();
  const [updateCartItem, updateState] = useUpdateCartItemMutation();
  const [removeCartItem, removeState] = useRemoveCartItemMutation();
  const [clearServerCart, clearState] = useClearCartMutation();

  const serverItems = useMemo(() => data?.data.items ?? [], [data]);

  const items: CartLine[] = isAuthenticated
    ? serverItems
    : guestItems.map((item) => ({
        id: item.variantId,
        variantId: item.variantId,
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        image: item.image,
        size: item.size,
        color: item.color,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity,
        stockQuantity: Number.MAX_SAFE_INTEGER,
        inStock: true,
      }));

  const itemCount = isAuthenticated
    ? (data?.data.itemCount ?? 0)
    : guestItems.reduce((total, item) => total + item.quantity, 0);

  const subtotal = isAuthenticated
    ? (data?.data.subtotal ?? 0)
    : guestItems.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

  const addItem = useCallback(
    async (input: AddCartItemInput) => {
      if (isAuthenticated) {
        await addCartItem({ variantId: input.variantId, quantity: input.quantity ?? 1 }).unwrap();
        return;
      }

      dispatch(addGuestItem(input));
    },
    [isAuthenticated, addCartItem, dispatch],
  );

  const updateQuantity = useCallback(
    async (variantId: string, quantity: number) => {
      if (isAuthenticated) {
        const line = serverItems.find((item) => item.variantId === variantId);
        if (!line) {
          return;
        }
        await updateCartItem({ itemId: line.id, body: { quantity } }).unwrap();
        return;
      }

      dispatch(updateGuestQuantity({ variantId, quantity }));
    },
    [isAuthenticated, serverItems, updateCartItem, dispatch],
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      if (isAuthenticated) {
        const line = serverItems.find((item) => item.variantId === variantId);
        if (!line) {
          return;
        }
        await removeCartItem(line.id).unwrap();
        return;
      }

      dispatch(removeGuestItem(variantId));
    },
    [isAuthenticated, serverItems, removeCartItem, dispatch],
  );

  const clear = useCallback(async () => {
    if (isAuthenticated) {
      await clearServerCart().unwrap();
      return;
    }

    dispatch(clearGuestCart());
  }, [isAuthenticated, clearServerCart, dispatch]);

  return {
    items,
    itemCount,
    subtotal,
    isAuthenticated,
    isLoading: isAuthenticated && isLoading,
    error,
    isMutating:
      addState.isLoading || updateState.isLoading || removeState.isLoading || clearState.isLoading,
    refetch: () => {
      void refetch();
    },
    addItem,
    updateQuantity,
    removeItem,
    clear,
  };
}
