export interface ProductColorOption {
  name: string;
  value: string;
}

export const PRODUCT_COLORS: ProductColorOption[] = [
  { name: 'Black', value: '#1c1a18' },
  { name: 'Ivory', value: '#f0e9dd' },
  { name: 'Beige', value: '#d8c6ad' },
  { name: 'Brown', value: '#6f5240' },
  { name: 'Burgundy', value: '#5d2a2f' },
];

const FALLBACK_COLOR = '#cbbca6';

export function getColorValue(name: string): string {
  const match = PRODUCT_COLORS.find((color) => color.name.toLowerCase() === name.toLowerCase());
  return match?.value ?? FALLBACK_COLOR;
}
