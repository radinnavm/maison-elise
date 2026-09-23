import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from '@/components/EmptyState/EmptyState';

describe('EmptyState', () => {
  it('renders a title, description and action', () => {
    render(
      <EmptyState title="Nothing here" description="Try again" action={<button>Go</button>} />,
    );

    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });
});
