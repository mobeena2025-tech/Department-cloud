import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'brand' }) {
  let iconBg = 'bg-brand-50 text-brand-600 border-brand-200';
  if (color === 'emerald') iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-200';
  if (color === 'amber') iconBg = 'bg-amber-50 text-amber-600 border-amber-200';
  if (color === 'purple') iconBg = 'bg-purple-50 text-purple-600 border-purple-200';
  if (color === 'blue') iconBg = 'bg-blue-50 text-blue-600 border-blue-200';

  return (
    <div className="cloud-card p-5 relative overflow-hidden group hover:border-brand-200">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-cloud-500 uppercase tracking-wider block mb-1">
            {title}
          </span>
          <div className="text-2xl font-bold text-cloud-900 tracking-tight">
            {value}
          </div>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-cloud-100">
          {subtitle && <span className="text-cloud-500">{subtitle}</span>}
          {trend && (
            <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
