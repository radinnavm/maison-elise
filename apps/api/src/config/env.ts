import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const envFilePath = path.resolve(currentDirectory, '../../.env');

dotenv.config({ path: envFilePath, quiet: true });

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readPort(name: string, fallback: string): number {
  const raw = readEnv(name, fallback);
  const port = Number.parseInt(raw, 10);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer.`);
  }

  return port;
}

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];

  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);

  if (Number.isNaN(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer.`);
  }

  return value;
}

function readBoolean(name: string, fallback: boolean): boolean {
  const raw = process.env[name];

  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

type TrustProxy = boolean | number | string;

/**
 * Express `trust proxy` setting. A bare `true` trusts every hop, which is unsafe
 * behind an untrusted network, so it is normalised to a single trusted hop. Use a
 * hop count (`TRUST_PROXY=1`) or a subnet/name list (`TRUST_PROXY=loopback`) for
 * deployments behind a load balancer.
 */
function readTrustProxy(): TrustProxy {
  const raw = process.env.TRUST_PROXY?.trim();

  if (!raw) {
    return false;
  }

  if (raw.toLowerCase() === 'true') {
    return 1;
  }

  if (raw.toLowerCase() === 'false') {
    return false;
  }

  const numeric = Number.parseInt(raw, 10);

  if (!Number.isNaN(numeric) && String(numeric) === raw) {
    return numeric;
  }

  return raw;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const port = readPort('PORT', '4000');
const databaseUrl = readEnv('DATABASE_URL');
const jwtSecret = readEnv('JWT_SECRET');
const clientUrl = readEnv('CLIENT_URL', 'http://localhost:5173');
const appUrl = readEnv('APP_URL', 'http://localhost:5173');
const cookieMaxAgeMs = readPositiveInt('COOKIE_MAX_AGE_DAYS', 7) * 24 * 60 * 60 * 1000;

const WEAK_JWT_SECRETS = new Set([
  'secret',
  'test-secret',
  'changeme',
  'change-me',
  'password',
  'replace-with-a-long-random-string',
]);

function isLocalhostUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname === '::1' ||
      hostname.endsWith('.localhost')
    );
  } catch {
    // Not a parseable URL — fall back to a permissive hostname check.
    return /(^|\/\/|@)(localhost|127\.0\.0\.1|\[?::1\]?)([:/]|$)/i.test(value);
  }
}

const configProblems: string[] = [];
const configWarnings: string[] = [];

if (isProduction) {
  if (jwtSecret.length < 32 || WEAK_JWT_SECRETS.has(jwtSecret)) {
    configProblems.push('JWT_SECRET must be a strong, unique secret of at least 32 characters.');
  }

  if (!process.env.CLIENT_URL) {
    configProblems.push('CLIENT_URL is required in production (used for CORS).');
  }

  if (process.env.ADMIN_URL && isLocalhostUrl(process.env.ADMIN_URL)) {
    configProblems.push('ADMIN_URL must not point to localhost in production.');
  }

  if (!process.env.APP_URL) {
    configProblems.push('APP_URL is required in production (used to build email links).');
  }

  if (isLocalhostUrl(databaseUrl)) {
    configProblems.push('DATABASE_URL must not point to localhost in production.');
  }

  if (isLocalhostUrl(clientUrl)) {
    configProblems.push('CLIENT_URL must not point to localhost in production.');
  }

  if (isLocalhostUrl(appUrl)) {
    configProblems.push('APP_URL must not point to localhost in production.');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    configWarnings.push('STRIPE_SECRET_KEY is not set; payment endpoints will return 503.');
  }

  if (!process.env.EMAIL_PROVIDER_API_KEY) {
    configWarnings.push(
      'EMAIL_PROVIDER_API_KEY is not set; transactional email will be logged only.',
    );
  }
}

if (configProblems.length > 0) {
  throw new Error(`Invalid production configuration:\n- ${configProblems.join('\n- ')}`);
}

const rateLimitEnabled = readBoolean('RATE_LIMIT_ENABLED', !isTest);

// Origin/Referer validation for cookie-authenticated state-changing requests.
// Enabled by default; disabled in the test environment unless explicitly enabled.
const csrfProtectionEnabled = readBoolean('CSRF_PROTECTION_ENABLED', !isTest);

export const env = {
  nodeEnv,
  isProduction,
  isTest,
  port,
  databaseUrl,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientUrl,
  adminUrl: process.env.ADMIN_URL,
  apiPublicUrl: readEnv('API_PUBLIC_URL', 'http://localhost:4000'),
  appUrl,
  cookieName: process.env.COOKIE_NAME ?? 'maison_elise_token',
  cookieMaxAgeMs,
  cookieSameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as 'lax' | 'strict' | 'none',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  emailApiKey: process.env.EMAIL_PROVIDER_API_KEY,
  emailFrom: process.env.EMAIL_FROM ?? 'Maison Élise <no-reply@maisonelise.com>',
  emailReplyTo: process.env.EMAIL_REPLY_TO,
  logLevel: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
  trustProxy: readTrustProxy(),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT ?? '1mb',
  rateLimitEnabled,
  csrfProtectionEnabled,
  emailPendingRecoveryMs: readPositiveInt('EMAIL_PENDING_RECOVERY_MS', 15 * 60 * 1000),
  rateLimits: {
    authMax: readPositiveInt('AUTH_RATE_LIMIT_MAX', 10),
    authWindowMs: readPositiveInt('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    paymentMax: readPositiveInt('PAYMENT_RATE_LIMIT_MAX', 30),
    paymentWindowMs: readPositiveInt('PAYMENT_RATE_LIMIT_WINDOW_MS', 60 * 1000),
    webhookMax: readPositiveInt('WEBHOOK_RATE_LIMIT_MAX', 120),
    webhookWindowMs: readPositiveInt('WEBHOOK_RATE_LIMIT_WINDOW_MS', 60 * 1000),
    adminMax: readPositiveInt('ADMIN_RATE_LIMIT_MAX', 300),
    adminWindowMs: readPositiveInt('ADMIN_RATE_LIMIT_WINDOW_MS', 60 * 1000),
  },
  configWarnings,
} as const;
