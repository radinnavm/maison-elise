import type { ApiErrorBody } from '@maison-elise/shared';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

export interface NormalizedApiError {
  message: string;
  code?: string;
  status?: number;
}

const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function firstValidationMessage(details: unknown): string | undefined {
  if (!Array.isArray(details)) {
    return undefined;
  }

  for (const issue of details) {
    if (
      typeof issue === 'object' &&
      issue !== null &&
      'message' in issue &&
      typeof (issue as { message?: unknown }).message === 'string'
    ) {
      return (issue as { message: string }).message;
    }
  }

  return undefined;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }

  const { error } = value as { error?: unknown };

  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

export function normalizeApiError(error: unknown): NormalizedApiError {
  if (isFetchBaseQueryError(error)) {
    const status = typeof error.status === 'number' ? error.status : undefined;

    if (isApiErrorBody(error.data)) {
      const detailMessage =
        error.data.error.code === 'VALIDATION_ERROR'
          ? firstValidationMessage(error.data.error.details)
          : undefined;

      return {
        message: detailMessage ?? error.data.error.message,
        code: error.data.error.code,
        status,
      };
    }

    if (error.status === 'FETCH_ERROR') {
      return { message: 'We could not reach the server. Please try again.', status };
    }

    if (status === 401) {
      return { message: 'Your session has expired. Please sign in again.', status };
    }

    return { message: FALLBACK_MESSAGE, status };
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return { message: (error as { message: string }).message };
  }

  return { message: FALLBACK_MESSAGE };
}

export function getErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
