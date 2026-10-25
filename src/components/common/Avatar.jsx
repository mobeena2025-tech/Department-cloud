import React from 'react';

// Initials in a coloured square (no stock photos).
export default function Avatar({ name, size = 'md' }) {
  const initials = String(name || '?')
    .replace(/^(dr|prof|mr|mrs|ms)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const sizes = {
    sm: 'w-7 h-7 rounded-lg text-[11px]',
    lg: 'w-20 h-20 rounded-2xl text-2xl border-2 border-brand-200 shadow-sm',
    md: 'w-10 h-10 rounded-xl text-sm',
  };
  return (
    <div
      className={`${sizes[size] || sizes.md} bg-brand-100 text-brand-700 font-bold flex items-center justify-center flex-shrink-0`}
      aria-hidden="true"
    >
      {initials || '?'}
    </div>
  );
}
