// Small input-validation helpers. Each one returns the cleaned value or
// throws an HttpError(400) that the global error handler turns into JSON.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true; // safe to show this message to the client
  }
}

export const badRequest = (message) => new HttpError(400, message);

// Wrap async route handlers so rejected promises reach the error handler.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function optionalInt(value, name, { min, max }) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw badRequest(`${name} must be a whole number between ${min} and ${max}`);
  }
  return n;
}

export function requiredInt(value, name, range) {
  const n = optionalInt(value, name, range);
  if (n === undefined) throw badRequest(`${name} is required`);
  return n;
}

export function optionalString(value, name, { max = 200, pattern } = {}) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw badRequest(`${name} must be text`);
  const s = value.trim();
  if (s === '') return undefined;
  if (s.length > max) throw badRequest(`${name} must be at most ${max} characters`);
  if (pattern && !pattern.test(s)) throw badRequest(`${name} has an invalid format`);
  return s;
}

export function requiredString(value, name, opts) {
  const s = optionalString(value, name, opts);
  if (s === undefined) throw badRequest(`${name} is required`);
  return s;
}

export function optionalDate(value, name) {
  const s = optionalString(value, name, { max: 40 });
  if (s === undefined) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw badRequest(`${name} must be a valid date`);
  return d.toISOString();
}

export const COURSE_CODE_PATTERN = /^[A-Za-z0-9_-]{2,20}$/;
export const SECTION_PATTERN = /^[A-Za-z]{1,2}$/;
