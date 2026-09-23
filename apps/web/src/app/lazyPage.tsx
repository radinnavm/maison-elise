import { Suspense, lazy, type ComponentType } from 'react';

import { RouteLoading } from '@/components/StateMessage/RouteLoading';

/**
 * Wraps a lazily-imported route component in a single Suspense boundary with a
 * layout-stable fallback. Used to keep the initial bundle small.
 */
export function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(loader);

  return (
    <Suspense fallback={<RouteLoading />}>
      <Component />
    </Suspense>
  );
}
