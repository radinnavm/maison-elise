import { Link, Navigate, useSearchParams } from 'react-router';

import { getErrorMessage } from '@/api/apiError';
import { useRegisterMutation } from '@/api/authApi';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/Button/Button';
import { FormField } from '@/components/FormField/FormField';
import { Seo } from '@/components/Seo/Seo';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { useForm } from '@/hooks/useForm';
import { validateRegister } from '@/utils/authValidation';
import { getSafeRedirect } from '@/utils/redirect';

import styles from './Auth.module.css';

export function RegisterPage() {
  const [register, { isLoading, error }] = useRegisterMutation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get('redirect'));

  const { values, errors, handleChange, handleSubmit } = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: validateRegister,
    onSubmit: async (formValues) => {
      try {
        await register({
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          email: formValues.email,
          password: formValues.password,
        }).unwrap();
      } catch {
        // The mutation error is rendered below.
      }
    },
  });

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <section className={styles.page}>
      <Seo
        title="Create Account"
        description="Create your Maison Élise account."
        canonicalPath="/register"
        robots="noindex"
      />
      <div className={`container ${styles.inner}`}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Account</p>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>
            Join Maison Élise for a considered, personal experience.
          </p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error ? (
            <p className={styles.formError} role="alert">
              {getErrorMessage(error)}
            </p>
          ) : null}

          <FormField
            label="First name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            value={values.firstName}
            onChange={handleChange}
            error={errors.firstName}
          />
          <FormField
            label="Last name"
            name="lastName"
            type="text"
            autoComplete="family-name"
            value={values.lastName}
            onChange={handleChange}
            error={errors.lastName}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            hint="At least 8 characters."
          />
          <FormField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading}>
            {isLoading ? 'Creating Account…' : 'Create Account'}
          </Button>
        </form>

        <div className={styles.footer}>
          <p className={styles.footerText}>Already have an account?</p>
          <Link to="/login" className={styles.footerLink}>
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
