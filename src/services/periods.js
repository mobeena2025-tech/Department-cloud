// Unit / Week choices for a course, from the syllabus the API sends with each
// course (course.periodType = 'unit' | 'week', course.periods = [{ number, title }]).

export const OTHER = 'other';

export function periodWord(course) {
  return course?.periodType === 'week' ? 'Week' : 'Unit';
}

// [{ value, label }] ending with "Other" (e.g. a case study that fits no unit).
export function periodChoices(course) {
  const word = periodWord(course);
  const periods = course?.periods?.length
    ? course.periods
    : Array.from({ length: 5 }, (_, i) => ({ number: i + 1, title: '' }));
  return [
    ...periods.map((p) => ({
      value: String(p.number),
      label: `${word} ${p.number}${p.title ? ` – ${p.title.length > 60 ? p.title.slice(0, 57) + '…' : p.title}` : ''}`,
    })),
    { value: OTHER, label: 'Other (not tied to a unit or week)' },
  ];
}

// Form value ('3' or 'other') -> what the API expects (3 or 'other').
export function toApiPeriod(value) {
  return value === OTHER ? OTHER : Number(value);
}

// Filter choices built from loaded items' labels ("Unit 2", "Week 4", "Other").
export function periodLabelOptions(items) {
  const labels = [...new Set(items.map((i) => i.unitTitle).filter(Boolean))];
  const rank = (l) => (l === 'Other' ? [2, 0] : [l.startsWith('Week') ? 1 : 0, Number(l.split(' ')[1]) || 0]);
  return labels.sort((a, b) => {
    const [ka, na] = rank(a);
    const [kb, nb] = rank(b);
    return ka - kb || na - nb;
  });
}
