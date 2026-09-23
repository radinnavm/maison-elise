import { Navigate, createBrowserRouter } from 'react-router';

import { ProtectedRoute } from '@/components/ProtectedRoute/ProtectedRoute';
import { HomePage } from '@/pages/Home/HomePage';
import { NotFoundPage } from '@/pages/NotFound/NotFoundPage';
import { PlaceholderPage } from '@/pages/Placeholder/PlaceholderPage';
import { RouteErrorPage } from '@/pages/RouteError/RouteErrorPage';

import { lazyPage } from './lazyPage';
import { RootLayout } from './RootLayout';

// Route-level code splitting: the homepage and shell stay in the initial bundle,
// heavier/secondary routes load on demand.
const AccountLayout = lazyPage(() =>
  import('@/pages/Account/AccountLayout').then((module) => ({ default: module.AccountLayout })),
);
const AccountOverviewPage = lazyPage(() =>
  import('@/pages/Account/AccountOverviewPage').then((module) => ({
    default: module.AccountOverviewPage,
  })),
);
const AccountSettingsPage = lazyPage(() =>
  import('@/pages/Account/AccountSettingsPage').then((module) => ({
    default: module.AccountSettingsPage,
  })),
);
const OrderDetailPage = lazyPage(() =>
  import('@/pages/Account/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })),
);
const OrdersPage = lazyPage(() =>
  import('@/pages/Account/OrdersPage').then((module) => ({ default: module.OrdersPage })),
);
const LoginPage = lazyPage(() =>
  import('@/pages/Auth/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazyPage(() =>
  import('@/pages/Auth/RegisterPage').then((module) => ({ default: module.RegisterPage })),
);
const CartPage = lazyPage(() =>
  import('@/pages/Cart/CartPage').then((module) => ({ default: module.CartPage })),
);
const CheckoutPage = lazyPage(() =>
  import('@/pages/Checkout/CheckoutPage').then((module) => ({ default: module.CheckoutPage })),
);
const OrderConfirmationPage = lazyPage(() =>
  import('@/pages/Order/OrderConfirmationPage').then((module) => ({
    default: module.OrderConfirmationPage,
  })),
);
const ProductPage = lazyPage(() =>
  import('@/pages/Product/ProductPage').then((module) => ({ default: module.ProductPage })),
);
const ShopPage = lazyPage(() =>
  import('@/pages/Shop/ShopPage').then((module) => ({ default: module.ShopPage })),
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: ShopPage },
      { path: 'shop/:category', element: ShopPage },
      { path: 'product/:slug', element: ProductPage },
      { path: 'login', element: LoginPage },
      { path: 'register', element: RegisterPage },
      {
        path: 'forgot-password',
        element: (
          <PlaceholderPage
            eyebrow="Account"
            title="Reset Password"
            description="Password reset is coming in a later milestone. Please contact us if you need help accessing your account."
          />
        ),
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'checkout', element: CheckoutPage },
          { path: 'order/:id', element: OrderConfirmationPage },
          {
            path: 'account',
            element: AccountLayout,
            children: [
              { index: true, element: AccountOverviewPage },
              { path: 'orders', element: OrdersPage },
              { path: 'orders/:id', element: OrderDetailPage },
              { path: 'settings', element: AccountSettingsPage },
            ],
          },
        ],
      },
      {
        path: 'wishlist',
        element: (
          <PlaceholderPage
            eyebrow="Saved"
            title="Wishlist"
            description="Your saved pieces are stored on this device. A dedicated wishlist page arrives in a later milestone."
          />
        ),
      },
      { path: 'cart', element: CartPage },
      { path: 'bag', element: <Navigate to="/cart" replace /> },
      {
        path: 'search',
        element: (
          <PlaceholderPage
            eyebrow="Search"
            title="Search the Collection"
            description="Full search is being prepared. In the meantime, explore the full collection."
          />
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
