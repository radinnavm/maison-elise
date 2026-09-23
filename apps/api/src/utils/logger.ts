import { env } from '../config/env.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export type LogContext = Record<string, unknown>;

function shouldLog(level: LogLevel): boolean {
  // Keep automated test output clean unless logging is explicitly requested.
  if (env.isTest && !process.env.LOG_LEVEL) {
    return false;
  }

  const configured = LEVEL_PRIORITY[env.logLevel as LogLevel] ?? LEVEL_PRIORITY.info;
  return LEVEL_PRIORITY[level] >= configured;
}

/**
 * Converts an unknown thrown value into a serialisable, log-only shape. Stack
 * traces are written to the server log (never to API responses).
 */
export function serializeError(error: unknown): LogContext {
  if (error instanceof Error) {
    return { errorName: error.name, errorMessage: error.message, stack: error.stack };
  }

  return { errorMessage: String(error) };
}

function write(level: LogLevel, message: string, context: LogContext): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry = { time: new Date().toISOString(), level, message, ...context };
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;

  if (env.isProduction) {
    sink(JSON.stringify(entry));
    return;
  }

  const { time, level: _level, message: _message, ...rest } = entry;
  const suffix = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
  sink(`${time} ${level.toUpperCase()} ${message}${suffix}`);
}

export const logger = {
  debug: (message: string, context: LogContext = {}) => write('debug', message, context),
  info: (message: string, context: LogContext = {}) => write('info', message, context),
  warn: (message: string, context: LogContext = {}) => write('warn', message, context),
  error: (message: string, context: LogContext = {}) => write('error', message, context),
};
