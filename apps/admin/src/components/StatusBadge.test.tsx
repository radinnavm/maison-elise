import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusBadge } from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('renders the label with a tone modifier', () => {
    render(<StatusBadge label="Paid" tone="positive" />);

    const badge = screen.getByText('Paid');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('badge-positive');
  });

  it('renders a neutral badge by default', () => {
    render(<StatusBadge label="Customer" />);

    expect(screen.getByText('Customer').className).not.toContain('badge-positive');
  });
});
