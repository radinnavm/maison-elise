import { useId, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { Button } from '@/components/Button/Button';
import { isValidEmail } from '@/utils/validation';

import styles from './NewsletterForm.module.css';

type FormStatus = 'idle' | 'error' | 'success';

export function NewsletterForm() {
  const inputId = useId();
  const messageId = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    if (status !== 'idle') {
      setStatus('idle');
      setMessage('');
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('success');
    setMessage('Thank you — welcome to Maison Élise.');
    setEmail('');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <label htmlFor={inputId} className="visually-hidden">
        Email address
      </label>
      <div className={styles.controls}>
        <input
          id={inputId}
          name="email"
          type="email"
          className={styles.input}
          placeholder="Email address"
          autoComplete="email"
          value={email}
          onChange={handleChange}
          aria-invalid={status === 'error'}
          aria-describedby={message ? messageId : undefined}
        />
        <Button type="submit" variant="primary" size="md">
          Subscribe
        </Button>
      </div>
      {message ? (
        <p
          id={messageId}
          className={status === 'error' ? styles.error : styles.success}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
