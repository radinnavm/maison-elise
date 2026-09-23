import type { ReactNode } from 'react';

interface StateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', description, action }: StateProps) {
  return (
    <div className="state" role="alert">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div style={{ marginTop: '1rem' }}>{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, action }: StateProps) {
  return (
    <div className="state">
      <h2>{title ?? 'Nothing here yet'}</h2>
      {description ? <p>{description}</p> : null}
      {action ? <div style={{ marginTop: '1rem' }}>{action}</div> : null}
    </div>
  );
}
