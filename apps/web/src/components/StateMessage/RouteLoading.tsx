import { LoadingState } from './LoadingState';

import styles from './StateMessage.module.css';

/**
 * Suspense fallback for lazily-loaded routes. Reserves vertical space so route
 * transitions do not cause a layout shift.
 */
export function RouteLoading() {
  return (
    <div className={`container ${styles.route}`}>
      <LoadingState label="Loading" />
    </div>
  );
}
