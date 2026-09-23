import { Navigate, createBrowserRouter } from 'react-router';

import { AdminLayout } from './AdminLayout';
import { AppBootstrap } from './AppBootstrap';
import { lazyPage } from './lazyPage';
import { RequireAdmin } from './RequireAdmin';

import { LoginPage } from '@/pages/LoginPage';

// Route-level code splitting for the heavier back-office pages. The login screen
// and shell stay eager so the first paint is fast.
const CategoriesPage = lazyPage(() =>
  import('@/pages/CategoriesPage').then((module) => ({ default: module.CategoriesPage })),
);
const CustomerDetailPage = lazyPage(() =>
  import('@/pages/CustomerDetailPage').then((module) => ({ default: module.CustomerDetailPage })),
);
const CustomersPage = lazyPage(() =>
  import('@/pages/CustomersPage').then((module) => ({ default: module.CustomersPage })),
);
const DashboardPage = lazyPage(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const InventoryPage = lazyPage(() =>
  import('@/pages/InventoryPage').then((module) => ({ default: module.InventoryPage })),
);
const OrderDetailPage = lazyPage(() =>
  import('@/pages/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })),
);
const OrdersPage = lazyPage(() =>
  import('@/pages/OrdersPage').then((module) => ({ default: module.OrdersPage })),
);
const ProductFormPage = lazyPage(() =>
  import('@/pages/ProductFormPage').then((module) => ({ default: module.ProductFormPage })),
);
const ProductsPage = lazyPage(() =>
  import('@/pages/ProductsPage').then((module) => ({ default: module.ProductsPage })),
);

export const router = createBrowserRouter([
  {
    element: <AppBootstrap />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAdmin />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: DashboardPage },
              { path: 'orders', element: OrdersPage },
              { path: 'orders/:id', element: OrderDetailPage },
              { path: 'products', element: ProductsPage },
              { path: 'products/new', element: ProductFormPage },
              { path: 'products/:id/edit', element: ProductFormPage },
              { path: 'inventory', element: InventoryPage },
              { path: 'categories', element: CategoriesPage },
              { path: 'customers', element: CustomersPage },
              { path: 'customers/:id', element: CustomerDetailPage },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
