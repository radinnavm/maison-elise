import { Suspense, lazy, type ComponentType } from 'react';

import { LoadingState } from '@/components/StateMessage';

/** Wraps a lazily-imported admin route component in a Suspense boundary. */
export function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(loader);

  return (
    <Suspense
      fallback={
        <div className="admin-content">
          <LoadingState label="Loading…" />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}
