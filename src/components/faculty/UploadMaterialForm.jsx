import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileText } from 'lucide-react';
import { api, validateMaterialFile, MATERIAL_ACCEPT, formatFileSize } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { periodChoices, periodWord, toApiPeriod } from '../../services/periods';

// Plain upload: choose a PDF, a course you teach, the unit and a title.
export default function UploadMaterialForm({ onUploaded, onCancel }) {
  const { addToast } = useNotification();
  const fileInputRef = useRef(null);

  const [courses, setCourses] = useState(null); // null = loading
  const [file, setFile] = useState(null);
  const [courseId, setCourseId] = useState('');
  const [unitNumber, setUnitNumber] = useState('1'); // '1'..'n' or 'other'
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getCourses()
      .then((res) => {
        const list = res?.courses || [];
        setCourses(list);
        if (list.length === 1) setCourseId(list[0].id);
      })
      .catch((err) => {
        setCourses([]);
        addToast(err.message || 'Could not load your courses', 'error', 'Courses Unavailable');
      });
  }, []);

  const handleFile = (e) => {
    const chosen = e.target.files?.[0];
    if (!chosen) return;
    const problem = validateMaterialFile(chosen);
    if (problem) {
      addToast(problem, 'warning', 'File Rejected');
      e.target.value = '';
      setFile(null);
      return;
    }
    setFile(chosen);
    // Start the title from the file name; faculty can change it.
    if (!title.trim()) setTitle(chosen.name.replace(/\.(pdf|pptx?|docx?)$/i, '').replace(/[_-]+/g, ' ').trim());
  };

  const reset = () => {
    setFile(null);
    setTitle('');
    setTopic('');
    setSummary('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return addToast('Please choose a file.', 'warning', 'Missing File');
    if (!courseId) return addToast('Please choose a course.', 'warning', 'Missing Course');
    if (!title.trim()) return addToast('Please enter a title.', 'warning', 'Missing Title');

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', title.trim());
      form.append('courseId', courseId);
      form.append('unitNumber', String(toApiPeriod(unitNumber)));
      if (topic.trim()) form.append('topic', topic.trim());
      if (summary.trim()) form.append('summary', summary.trim());

      const res = await api.uploadMaterial(form);
      addToast(`"${res.material.title}" uploaded to ${res.material.courseCode}.`, 'success', 'Upload Complete');
      reset();
      onUploaded?.(res.material);
    } catch (err) {
      addToast(err.message || 'Upload failed', 'error', 'Upload Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCourse = (courses || []).find((c) => c.id === courseId);
  const field = 'w-full px-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 bg-white focus:outline-none focus:border-brand-500';
  const label = 'block text-xs font-semibold text-cloud-700 mb-1';

  if (courses && courses.length === 0) {
    return (
      <p className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
        You are not assigned to any course yet, so there is nowhere to upload. Ask the department admin to assign you.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File */}
      <label className="block border-2 border-dashed border-cloud-300 hover:border-brand-400 bg-cloud-50/50 hover:bg-brand-50/20 rounded-xl p-5 text-center transition-colors cursor-pointer">
        <input ref={fileInputRef} type="file" accept={MATERIAL_ACCEPT} onChange={handleFile} className="sr-only" />
        <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center mx-auto mb-2">
          <FileText className="w-5 h-5" />
        </div>
        <div className="text-xs font-semibold text-cloud-800">
          {file ? file.name : 'Click to choose a file'}
        </div>
        <div className="text-[11px] text-cloud-500 mt-0.5">
          {file ? formatFileSize(file.size) : 'PDF, PowerPoint or Word, up to 20 MB'}
        </div>
      </label>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className={label}>Course <span className="text-rose-500">*</span></label>
          <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setUnitNumber('1'); }} className={field} disabled={!courses}>
            <option value="">{courses ? 'Choose a course' : 'Loading...'}</option>
            {(courses || []).map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>{periodWord(selectedCourse)}</label>
          <select value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className={field}>
            {periodChoices(selectedCourse).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>Title <span className="text-rose-500">*</span></label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={field} placeholder="e.g. Unit 2 - Process Scheduling notes" />
      </div>

      <div>
        <label className={label}>Topic <span className="text-cloud-400 font-normal">(optional)</span></label>
        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} className={field} />
      </div>

      <div>
        <label className={label}>Short description <span className="text-cloud-400 font-normal">(optional)</span></label>
        <textarea rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={2000} className={field} />
      </div>

      <p className="text-[11px] text-cloud-500">
        Only students enrolled in the course can open it. The Academic Assistant reads PDFs so students can ask questions about them; PowerPoint and Word files are download-only.
      </p>

      <div className="pt-3 border-t border-cloud-200 flex items-center justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-cloud-200 text-cloud-700 text-xs font-medium hover:bg-cloud-100 cursor-pointer">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !courses}
          className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4" />
          {submitting ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </form>
  );
}
