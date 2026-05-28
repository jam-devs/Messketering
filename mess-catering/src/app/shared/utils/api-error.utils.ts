import { HttpErrorResponse } from '@angular/common/http';

type ValidationErrors = Record<string, string[]>;

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  const body = error.error;

  if (body?.errors) {
    const validationErrors = body.errors as ValidationErrors;
    const messages = Object.values(validationErrors).flat();

    if (messages.length) {
      return messages.join(' ');
    }
  }

  if (body?.message) {
    return body.message;
  }

  return fallback;
}
