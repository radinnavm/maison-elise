import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProductImagePlaceholder } from './ProductImagePlaceholder';

describe('ProductImagePlaceholder', () => {
  it('renders initials from every meaningful word', () => {
    const { rerender } = render(<ProductImagePlaceholder name="Satin Midi Dress" />);
    expect(screen.getByText('SMD')).toBeInTheDocument();

    rerender(<ProductImagePlaceholder name="Classic Linen Shirt" />);
    expect(screen.getByText('CLS')).toBeInTheDocument();

    rerender(<ProductImagePlaceholder name="Tailored Wool Blazer" />);
    expect(screen.getByText('TWB')).toBeInTheDocument();
  });

  it('renders no product photography', () => {
    const { container } = render(<ProductImagePlaceholder name="Margot Evening Column Dress" />);

    expect(screen.getByText('MECD')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('handles single-word names', () => {
    render(<ProductImagePlaceholder name="Aurelia" />);

    expect(screen.getByText('AU')).toBeInTheDocument();
  });
});
