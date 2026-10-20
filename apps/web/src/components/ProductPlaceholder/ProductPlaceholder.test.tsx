import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProductPlaceholder } from './ProductPlaceholder';

describe('ProductPlaceholder', () => {
  it('renders elegant initials and the brand mark without product photography', () => {
    const { container } = render(<ProductPlaceholder name="Margot Evening Dress" />);

    expect(screen.getByText('MD')).toBeInTheDocument();
    expect(screen.getByText('Maison Élise')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('uses the first and last meaningful words for the initials', () => {
    render(<ProductPlaceholder name="Clara Wool Coat" />);

    expect(screen.getByText('CC')).toBeInTheDocument();
  });

  it('handles single-word names', () => {
    render(<ProductPlaceholder name="Aurelia" />);

    expect(screen.getByText('AU')).toBeInTheDocument();
  });
});
