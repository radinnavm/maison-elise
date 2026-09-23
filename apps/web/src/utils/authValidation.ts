import { isValidEmail } from '@/utils/validation';
import type { LoginRequest } from '@/types/auth';

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const MIN_PASSWORD_LENGTH = 8;

export function validateLogin(values: LoginRequest): FormErrors<LoginRequest> {
  const errors: FormErrors<LoginRequest> = {};

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

export function validateRegister(values: RegisterFormValues): FormErrors<RegisterFormValues> {
  const errors: FormErrors<RegisterFormValues> = {};

  if (!values.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }

  if (!values.lastName.trim()) {
    errors.lastName = 'Last name is required.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(values.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}
