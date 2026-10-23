import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Download, Paperclip, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotification();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAnnouncements();
        if (res?.announcements) setAnnouncements(res.announcements);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = announcements.filter((a) => {
    if (selectedPriority !== 'ALL' && a.priority.toLowerCase() !== selectedPriority.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cloud-900">Department Announcements</h1>
          <p className="text-xs text-cloud-500">
            Official department administrative notices, examination guidelines, and seminars
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-cloud-400" />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-cloud-200 text-xs text-cloud-700 bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="urgent">Urgent Notices</option>
            <option value="high">High Priority</option>
            <option value="normal">Standard Notices</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((anc) => (
          <div key={anc.id} className="cloud-card p-6">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className={`badge-pill text-xs font-bold ${
                  anc.priority === 'Urgent'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : anc.priority === 'High'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}>
                  {anc.priority}
                </span>
                <span className="text-xs font-semibold text-cloud-500 bg-cloud-100 px-2 py-0.5 rounded-md">
                  {anc.category}
                </span>
              </div>
              <span className="text-xs text-cloud-400">
                {new Date(anc.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <h3 className="text-base font-bold text-cloud-900 mt-2">
              {anc.title}
            </h3>

            <p className="text-xs text-cloud-700 mt-2 leading-relaxed whitespace-pre-line">
              {anc.content}
            </p>

            <div className="mt-4 pt-3 border-t border-cloud-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-cloud-500">
                Published by: <strong className="text-cloud-800">{anc.author}</strong> ({anc.department})
              </span>

              {anc.attachments?.map((att, idx) => (
                <button
                  key={idx}
                  onClick={() => addToast(`Downloaded "${att.name}"`, 'success')}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-cloud-100 hover:bg-brand-50 hover:text-brand-700 text-cloud-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{att.name} ({att.size})</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
