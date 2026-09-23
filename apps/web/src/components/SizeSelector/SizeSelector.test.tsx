import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SizeSelector } from '@/components/SizeSelector/SizeSelector';

describe('SizeSelector', () => {
  it('disables unavailable sizes', () => {
    render(
      <SizeSelector
        sizes={['S', 'M', 'L']}
        unavailableSizes={['M']}
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: /M/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'S' })).toBeEnabled();
  });

  it('reports the selected size', async () => {
    const onChange = vi.fn();
    render(<SizeSelector sizes={['S', 'M', 'L']} value={null} onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: 'S' }));

    expect(onChange).toHaveBeenCalledWith('S');
  });
});
