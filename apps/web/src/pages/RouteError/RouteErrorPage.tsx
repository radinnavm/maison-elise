import { isRouteErrorResponse, useRouteError } from 'react-router';

import { ButtonLink } from '@/components/Button/Button';
import { ErrorState } from '@/components/StateMessage/ErrorState';

import styles from './RouteErrorPage.module.css';

export function RouteErrorPage() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : 'Something went wrong';

  const description =
    isRouteErrorResponse(error) && error.status === 404
      ? 'The page you are looking for could not be found.'
      : 'An unexpected error occurred while loading this page. Please try again.';

  return (
    <div className={`container ${styles.page}`}>
      <ErrorState
        title={title}
        description={description}
        action={
          <ButtonLink to="/" variant="primary" size="md">
            Return Home
          </ButtonLink>
        }
      />
    </div>
  );
}
