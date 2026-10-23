export type DataErrorCode = 'invalid' | 'not-found' | 'conflict' | 'integrity';

/** Error raised by repositories. `detail` is technical; the UI maps `code` to a text in i18n/es.ts. */
export class DataError extends Error {
  readonly code: DataErrorCode;
  readonly detail: string;

  constructor(code: DataErrorCode, detail: string) {
    super(`${code}: ${detail}`);
    this.name = 'DataError';
    this.code = code;
    this.detail = detail;
  }
}

/** Raised by the record parsers in schema.ts. */
export class ValidationError extends Error {
  readonly path: string;
  readonly reason: string;

  constructor(path: string, reason: string) {
    super(`${path}: ${reason}`);
    this.name = 'ValidationError';
    this.path = path;
    this.reason = reason;
  }
}

/** Runs a parser and turns a ValidationError into a DataError('invalid'). */
export function toData<T>(fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof ValidationError) throw new DataError('invalid', e.message);
    throw e;
  }
}
