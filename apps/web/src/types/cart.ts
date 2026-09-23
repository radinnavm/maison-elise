export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
}

export interface AddCartItemInput extends Omit<CartItem, 'quantity'> {
  quantity?: number;
}
