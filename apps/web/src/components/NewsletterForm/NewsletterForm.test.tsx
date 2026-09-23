import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { NewsletterForm } from '@/components/NewsletterForm/NewsletterForm';

describe('NewsletterForm', () => {
  it('shows a validation error for an invalid email', async () => {
    render(<NewsletterForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/valid email/i);
  });

  it('shows a success message for a valid email', async () => {
    render(<NewsletterForm />);

    await userEvent.type(screen.getByLabelText(/email address/i), 'camille@example.com');
    await userEvent.click(screen.getByRole('button', { name: /subscribe/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(/thank you/i);
  });
});
