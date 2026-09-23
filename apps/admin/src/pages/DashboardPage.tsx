import { useGetDashboardQuery } from '@/api/adminApi';
import { PageHeader } from '@/components/PageHeader';
import { ErrorState, LoadingState } from '@/components/StateMessage';
import { formatPrice } from '@/utils/format';

export function DashboardPage() {
  const { data, isLoading, isError } = useGetDashboardQuery();

  if (isLoading) {
    return <LoadingState label="Loading dashboard…" />;
  }

  if (isError || !data) {
    return <ErrorState title="We couldn't load the dashboard." description="Please try again." />;
  }

  const { orders, revenue, inventory, customers } = data.data;

  return (
    <>
      <PageHeader title="Dashboard" description="Business overview for Maison Élise." />

      <div className="stat-grid">
        <div className="stat-card">
          <h2>Confirmed revenue</h2>
          <p className="stat-value">{formatPrice(revenue.confirmed, revenue.currency)}</p>
          <p className="stat-meta">Across confirmed orders</p>
        </div>

        <div className="stat-card">
          <h2>Orders</h2>
          <p className="stat-value">{orders.total}</p>
          <div className="stat-row">
            <span>Pending</span>
            <span>{orders.pending}</span>
          </div>
          <div className="stat-row">
            <span>Confirmed</span>
            <span>{orders.confirmed}</span>
          </div>
          <div className="stat-row">
            <span>Cancelled</span>
            <span>{orders.cancelled}</span>
          </div>
        </div>

        <div className="stat-card">
          <h2>Inventory</h2>
          <p className="stat-value">{inventory.products}</p>
          <div className="stat-row">
            <span>Active products</span>
            <span>{inventory.products}</span>
          </div>
          <div className="stat-row">
            <span>Low stock variants</span>
            <span>{inventory.lowStockVariants}</span>
          </div>
          <div className="stat-row">
            <span>Out of stock</span>
            <span>{inventory.outOfStockVariants}</span>
          </div>
        </div>

        <div className="stat-card">
          <h2>Customers</h2>
          <p className="stat-value">{customers.total}</p>
          <p className="stat-meta">Registered customer accounts</p>
        </div>
      </div>
    </>
  );
}
