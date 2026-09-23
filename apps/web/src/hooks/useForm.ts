import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import type { FormErrors } from '@/utils/authValidation';

interface UseFormOptions<T extends Record<string, string>> {
  initialValues: T;
  validate?: (values: T) => FormErrors<T>;
  onSubmit: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, string>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    const key = name as keyof T;

    setValues((current) => ({ ...current, [key]: value }) as T);
    setErrors((current) => {
      if (!(key in current)) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate ? validate(values) : {};

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  return { values, errors, isSubmitting, handleChange, handleSubmit };
}
