export type AuthRole = 'CUSTOMER' | 'ADMIN';

export type ProductStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export type SortOption = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: AuthRole;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProductImageDto {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
  price: number;
}

export interface ProductDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: CategoryDto;
  price: number;
  compareAtPrice?: number;
  currency: string;
  images: ProductImageDto[];
  variants: ProductVariantDto[];
  sizes: string[];
  colors: string[];
  stock: number;
  isNew: boolean;
  isFeatured: boolean;
  status: ProductStatus;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListResponse {
  data: ProductDto[];
  meta: PaginationMeta;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CartItemDto {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  stockQuantity: number;
  inStock: boolean;
}

export interface CartDto {
  items: CartItemDto[];
  subtotal: number;
  itemCount: number;
}

export interface CartResponse {
  data: CartDto;
}

export interface AddCartItemRequest {
  variantId: string;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface MergeCartRequest {
  items: { variantId: string; quantity: number }[];
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface OrderItemDto {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  size: string;
  color: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  subtotal: number;
  shippingAmount: number;
  total: number;
  itemCount: number;
  items: OrderItemDto[];
  shippingAddress: OrderShippingAddressDto | null;
  createdAt: string;
}

export interface OrderResponse {
  data: OrderDto;
}

export interface OrderListResponse {
  data: OrderDto[];
  meta: PaginationMeta;
}

export interface PaymentIntentDto {
  clientSecret: string | null;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
}

export interface PaymentIntentResponse {
  data: PaymentIntentDto;
}

export interface AddressDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  countryCode: string;
  isDefault: boolean;
  createdAt: string;
}

export interface AddressInput {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  countryCode: string;
  isDefault?: boolean;
}

export interface OrderShippingAddressDto {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  countryCode: string;
}

export interface AddressListResponse {
  data: AddressDto[];
}

export interface AddressResponse {
  data: AddressDto;
}

export interface AdminCustomerSummary {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
}

export interface AdminOrderDto extends OrderDto {
  customer: AdminCustomerSummary;
}

export interface AdminOrderListResponse {
  data: AdminOrderDto[];
  meta: PaginationMeta;
}

export type EmailType =
  'WELCOME' | 'ORDER_CONFIRMATION' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'ORDER_STATUS_CHANGED';

export type EmailStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface EmailDeliveryDto {
  id: string;
  type: EmailType;
  status: EmailStatus;
  providerMessageId: string | null;
  createdAt: string;
}

export interface AdminOrderDetailDto extends AdminOrderDto {
  emails: EmailDeliveryDto[];
}

export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  category: CategoryDto;
  basePrice: number;
  currency: string;
  image: string | null;
  variantCount: number;
  createdAt: string;
}

export interface AdminProductListResponse {
  data: AdminProductListItem[];
  meta: PaginationMeta;
}

export interface AdminInventoryItem {
  id: string;
  sku: string;
  size: string;
  color: string;
  stockQuantity: number;
  price: number;
  productId: string;
  productName: string;
  productSlug: string;
}

export interface AdminInventoryListResponse {
  data: AdminInventoryItem[];
  meta: PaginationMeta;
}

export interface AdminCustomerListItem {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: AuthRole;
  createdAt: string;
  orderCount: number;
}

export interface AdminCustomerListResponse {
  data: AdminCustomerListItem[];
  meta: PaginationMeta;
}

export interface AdminCustomerDetailDto extends AdminCustomerListItem {
  confirmedSpend: number;
  recentOrders: OrderDto[];
}

export interface AdminDashboardDto {
  orders: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
  };
  revenue: {
    confirmed: number;
    currency: string;
  };
  inventory: {
    products: number;
    lowStockVariants: number;
    outOfStockVariants: number;
  };
  customers: {
    total: number;
  };
}

export interface AdminDashboardResponse {
  data: AdminDashboardDto;
}

export interface OrderStatusUpdateRequest {
  status: OrderStatus;
}

export interface InventoryUpdateRequest {
  stockQuantity: number;
}
