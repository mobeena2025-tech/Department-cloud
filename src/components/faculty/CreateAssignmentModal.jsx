import React, { useState } from 'react';
import { X, Calendar, ClipboardList, Paperclip } from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function CreateAssignmentModal({ isOpen, onClose, onCreated, courses = [] }) {
  const { addToast } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    courseId: courses[0]?.id || '',
    unitNumber: 2,
    // Default due date: one week from now, 23:59 local time.
    dueDate: (() => {
      const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`;
    })(),
    maxMarks: 25,
    description: '',
    attachmentName: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Assignment title is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Send the due date as an exact moment (the input has no time zone).
      const res = await api.createAssignment({
        ...formData,
        dueDate: new Date(formData.dueDate).toISOString(),
      });
      addToast(`Assignment "${formData.title}" published!`, 'success', 'Course Assessment');
      if (onCreated) onCreated(res.assignment);
      onClose();
    } catch (err) {
      addToast(err.message, 'error', 'Publish Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cloud-200 bg-cloud-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-cloud-900">
              Create Course Assignment
            </h3>
          </div>
          <button onClick={onClose} className="text-cloud-400 hover:text-cloud-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-cloud-700 mb-1">
              Assignment Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. ANN Assignment 3: Convolutional Operations in NumPy"
              className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-cloud-700 mb-1">Course</label>
              <select
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 bg-white"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-cloud-700 mb-1">Syllabus Unit</label>
              <select
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 bg-white"
              >
                <option value={1}>Unit 1</option>
                <option value={2}>Unit 2</option>
                <option value={3}>Unit 3</option>
                <option value={4}>Unit 4</option>
                <option value={5}>Unit 5</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-cloud-700 mb-1">Submission Deadline</label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-cloud-700 mb-1">Max Marks</label>
              <input
                type="number"
                min={5}
                max={100}
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-cloud-700 mb-1">Description / Instructions</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide problem requirements, submission guidelines, dataset links, and evaluation rubrics..."
              className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-cloud-700 mb-1">Attached Problem Statement / Specification</label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-cloud-200 bg-cloud-50">
              <Paperclip className="w-4 h-4 text-brand-600" />
              <input
                type="text"
                value={formData.attachmentName}
                onChange={(e) => setFormData({ ...formData, attachmentName: e.target.value })}
                className="flex-1 bg-transparent border-none text-xs font-mono text-cloud-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-cloud-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-cloud-200 text-cloud-700 hover:bg-cloud-100 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Publish Assignment'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
