import React, { useState, useEffect } from 'react';
import { Bell, Plus, Send, Paperclip } from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function FacultyAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('High');
  const [courseId, setCourseId] = useState(''); // '' = department-wide (admin only)
  const [courses, setCourses] = useState([]);
  const { isAdmin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useNotification();

  const loadAnnouncements = async () => {
    try {
      const res = await api.getAnnouncements();
      if (res?.announcements) setAnnouncements(res.announcements);
    } catch {}
  };

  useEffect(() => {
    loadAnnouncements();
    // Faculty only get the courses they teach; admin gets all.
    api.getCourses()
      .then((res) => {
        const list = res?.courses || [];
        setCourses(list);
        if (!isAdmin && list.length) setCourseId(list[0].id);
      })
      .catch(() => {});
  }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createAnnouncement({
        title,
        content,
        priority,
        courseId: courseId || undefined,
        category: courseId ? 'Course Notice' : 'Department Notice',
      });
      addToast('Course notice published to student portal!', 'success', 'Announcement Live');
      setShowForm(false);
      setTitle('');
      setContent('');
      await loadAnnouncements();
    } catch (err) {
      addToast(err.message, 'error', 'Publish Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cloud-900">Faculty Announcements</h1>
          <p className="text-xs text-cloud-500">
            Publish academic circulars, seminar notices, and assignment guidance
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Close Form' : 'Publish Announcement'}
        </button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="cloud-card p-6 border-brand-200 bg-brand-50/20 animate-in fade-in duration-150">
          <h2 className="text-sm font-bold text-cloud-900 mb-4">
            Draft New Course Announcement
          </h2>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-cloud-700 mb-1">Headline / Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI204: Lab 3 Rescheduled to Thursday 2:00 PM"
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 bg-white text-cloud-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-cloud-700 mb-1">Target Course</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 bg-white text-cloud-900"
                >
                  {isAdmin && <option value="">Whole department</option>}
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-cloud-700 mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 bg-white text-cloud-900"
                >
                  <option value="Normal">Normal Notice</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent / Exam Notice</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-cloud-700 mb-1">Notice Content</label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Detailed announcement text visible to all enrolled students..."
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 bg-white text-cloud-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-cloud-200 text-cloud-700 hover:bg-white text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? 'Publishing...' : 'Post Notice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((anc) => (
          <div key={anc.id} className="cloud-card p-6">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className={`badge-pill text-xs font-bold ${
                  anc.priority === 'Urgent'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-brand-50 text-brand-700 border border-brand-200'
                }`}>
                  {anc.priority}
                </span>
                <span className="text-xs font-medium text-cloud-500 bg-cloud-100 px-2 py-0.5 rounded-md">
                  {anc.category}
                </span>
              </div>
              <span className="text-xs text-cloud-400">
                {new Date(anc.date).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-base font-bold text-cloud-900 mt-1">{anc.title}</h3>
            <p className="text-xs text-cloud-700 mt-2 leading-relaxed whitespace-pre-line">{anc.content}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
