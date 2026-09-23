import { Link, Navigate, useSearchParams } from 'react-router';

import { useLoginMutation } from '@/api/authApi';
import { getErrorMessage } from '@/api/apiError';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/Button/Button';
import { FormField } from '@/components/FormField/FormField';
import { Seo } from '@/components/Seo/Seo';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { useForm } from '@/hooks/useForm';
import { validateLogin } from '@/utils/authValidation';
import { getSafeRedirect } from '@/utils/redirect';

import styles from './Auth.module.css';

export function LoginPage() {
  const [login, { isLoading, error }] = useLoginMutation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get('redirect'));

  const { values, errors, handleChange, handleSubmit } = useForm({
    initialValues: { email: '', password: '' },
    validate: validateLogin,
    onSubmit: async (formValues) => {
      try {
        await login(formValues).unwrap();
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
        title="Sign In"
        description="Sign in to your Maison Élise account."
        canonicalPath="/login"
        robots="noindex"
      />
      <div className={`container ${styles.inner}`}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Account</p>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your Maison Élise account.</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {error ? (
            <p className={styles.formError} role="alert">
              {getErrorMessage(error)}
            </p>
          ) : null}

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
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
          />

          <div className={styles.formMeta}>
            <Link to="/forgot-password" className={styles.link}>
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading}>
            {isLoading ? 'Signing In…' : 'Sign In'}
          </Button>
        </form>

        <p className={styles.demo}>
          Demo account: <span className={styles.demoCode}>customer@maisonelise.com</span> /{' '}
          <span className={styles.demoCode}>password123</span>
        </p>

        <div className={styles.footer}>
          <p className={styles.footerText}>Don&apos;t have an account?</p>
          <Link to="/register" className={styles.footerLink}>
            Create Account
          </Link>
        </div>
      </div>
    </section>
  );
}
