import fs from 'node:fs';
import { HttpError } from './validate.js';

// Official Semester 5 syllabus (from the department syllabus PDF), by course code.
// Theory courses are organised in units, labs and the mini project in weeks.
const SYLLABUS = JSON.parse(fs.readFileSync(new URL('../data/syllabus-sem5.json', import.meta.url), 'utf8'));

export const OTHER = 'other'; // stored in materials.unit for "Other"
const MAX_PERIOD = 20;

export function syllabusFor(code) {
  return SYLLABUS[code] || null;
}

// 'week' for labs / the mini project, otherwise 'unit'.
export function periodKind(code) {
  const s = syllabusFor(code);
  if (s) return s.kind === 'theory' ? 'unit' : 'week';
  return /-LAB$|LAB$/i.test(code || '') ? 'week' : 'unit';
}

// The choices for upload / assignment forms: [{ number, title }].
export function periodsFor(code) {
  const s = syllabusFor(code);
  const list = s ? (s.units || s.weeks || []) : [];
  if (list.length) return list.map((p) => ({ number: p.number, title: p.title || '' }));
  const count = periodKind(code) === 'week' ? 10 : 5;
  return Array.from({ length: count }, (_, i) => ({ number: i + 1, title: '' }));
}

// "Unit 3", "Week 3" or "Other" (null = Other).
export function periodLabel(code, number) {
  if (number === null || number === undefined || number === OTHER) return 'Other';
  return `${periodKind(code) === 'week' ? 'Week' : 'Unit'} ${number}`;
}

/**
 * Reads a unit/week value from a request: 'other' (or 0) -> null,
 * otherwise a whole number 1-20. Returns undefined when not given.
 */
export function parsePeriod(value, field = 'unitNumber') {
  if (value === undefined || value === '') return undefined;
  if (value === null || String(value).toLowerCase() === OTHER || String(value) === '0') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > MAX_PERIOD) {
    throw new HttpError(400, `${field} must be a number from 1 to ${MAX_PERIOD}, or "other"`);
  }
  return n;
}

// materials.unit is text: '1'..'20' or 'other'.
export function materialUnitFromRow(unit) {
  if (unit === OTHER) return null;
  return Number(unit) || 1;
}
