import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('does not render when closed', () => {
    render(
      <ConfirmDialog open={false} title="Cancel order?" onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('invokes onConfirm and onCancel', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Cancel order?"
        description="This restores stock."
        confirmLabel="Cancel order"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Cancel order?' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
