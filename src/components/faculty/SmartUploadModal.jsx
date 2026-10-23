import React, { useState } from 'react';
import { X, Upload, Sparkles, Check, Edit2, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { api, validatePdfFile, formatFileSize } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function SmartUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [classification, setClassification] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useNotification();

  // Form state after AI classification or manual edit
  const [formState, setFormState] = useState({
    course: 'Artificial Neural Networks',
    courseCode: 'AI204',
    unit: 'Unit 3',
    unitNumber: 3,
    topic: 'Convolutional Neural Networks',
    type: 'Lecture Material',
    tags: 'CNN, convolution, pooling, feature extraction',
    visibility: 'Department / Enrolled',
  });

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const problem = validatePdfFile(file);
    if (problem) {
      addToast(problem, 'warning', 'File Rejected');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setAnalyzing(true);
    setClassification(null);
    setIsEditing(false);

    try {
      // The classifier only looks at the file name and size.
      const res = await api.smartClassify(file.name, formatFileSize(file.size));
      const c = res?.classification;
      if (!c || c.method === 'none') throw new Error('no suggestion');
      setClassification(c);
      setFormState({
        course: c.suggestedCourse || '',
        courseCode: c.suggestedCourseCode || '',
        unit: c.suggestedUnit || 'Unit 1',
        unitNumber: c.unitNumber || 1,
        topic: c.suggestedTopic || '',
        type: c.suggestedType || 'Lecture Material',
        tags: (c.suggestedTags || []).join(', '),
        visibility: 'Department / Enrolled',
      });
    } catch (err) {
      // No suggestion available: let the user fill the fields in by hand.
      addToast('No suggestion for this file name. Please fill in the details.', 'info', 'Manual Entry');
      setClassification({ method: 'manual' });
      setFormState({
        course: '', courseCode: '', unit: 'Unit 1', unitNumber: 1,
        topic: '', type: 'Lecture Material', tags: '', visibility: 'Department / Enrolled',
      });
      setIsEditing(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptClassification = async () => {
    if (!selectedFile) {
      addToast('Please choose a PDF file first.', 'warning', 'No File');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', selectedFile.name.replace(/\.pdf$/i, ''));
      formData.append('courseId', formState.courseCode);
      formData.append('unitNumber', String(formState.unitNumber || parseInt(String(formState.unit).replace(/\D/g, ''), 10) || 1));
      formData.append('materialType', formState.type);
      formData.append('topic', formState.topic);
      formData.append('tags', formState.tags);

      const res = await api.uploadMaterial(formData);
      addToast(`Successfully published "${selectedFile.name}" to ${formState.courseCode} ${formState.unit}!`, 'success', 'Smart Cloud Upload');
      if (onUploadSuccess) onUploadSuccess(res.material);
      onClose();
    } catch (err) {
      addToast(err.message, 'error', 'Upload Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cloud-200 bg-cloud-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-cloud-900 leading-none">
                Smart Upload & AI Classification
              </h3>
              <p className="text-[11px] text-cloud-500 mt-0.5">
                Automatic course mapping, unit taxonomy, and tag extraction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-cloud-400 hover:text-cloud-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* File Picker / Test buttons */}
          <div>
            <label className="block text-xs font-semibold text-cloud-700 mb-1.5">
              Select Academic Document (PDF, max 10 MB):
            </label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={analyzing || submitting}
              className="block w-full text-xs text-cloud-700 file:mr-3 file:px-4 file:py-2 file:rounded-xl file:border-0 file:bg-cloud-900 file:text-white file:text-xs file:font-medium file:cursor-pointer"
            />
            {selectedFile && (
              <div className="mt-2 text-[11px] text-cloud-500 font-mono">
                {selectedFile.name} &bull; {formatFileSize(selectedFile.size)}
              </div>
            )}
          </div>

          {/* AI Analyzing State */}
          {analyzing && (
            <div className="p-8 rounded-xl border border-dashed border-brand-300 bg-brand-50/40 text-center space-y-3 animate-pulse">
              <Sparkles className="w-8 h-8 text-brand-600 mx-auto animate-spin" />
              <div className="text-xs font-semibold text-brand-900">
                Department AI Scanning Document Metadata & Vectorizing...
              </div>
              <div className="text-[11px] text-brand-600">
                Matching syllabus keywords against semester curriculum graph
              </div>
            </div>
          )}

          {/* AI-Generated Classification Suggestion Card (as requested in prompt) */}
          {classification && !analyzing && (
            <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-5 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-brand-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-brand-900">
                    AI-Generated Classification Suggestion
                  </span>
                </div>
                <span className="badge-pill bg-brand-100 text-brand-800 text-[10px] font-bold">
                  {classification.method === 'filename-keywords' ? 'Suggested from file name — please check' : 'Manual Entry'}
                </span>
              </div>

              {!isEditing ? (
                /* Readonly Suggestion View */
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-brand-100/60">
                    <span className="text-cloud-500 font-medium">Course:</span>
                    <span className="col-span-2 font-bold text-cloud-900">
                      {formState.course} ({formState.courseCode})
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-brand-100/60">
                    <span className="text-cloud-500 font-medium">Unit:</span>
                    <span className="col-span-2 font-semibold text-cloud-900">
                      {formState.unit}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-brand-100/60">
                    <span className="text-cloud-500 font-medium">Topic:</span>
                    <span className="col-span-2 font-semibold text-cloud-900">
                      {formState.topic}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1 border-b border-brand-100/60">
                    <span className="text-cloud-500 font-medium">Type:</span>
                    <span className="col-span-2 font-semibold text-cloud-900">
                      {formState.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-1">
                    <span className="text-cloud-500 font-medium">Tags:</span>
                    <span className="col-span-2 font-mono text-[11px] text-cloud-800">
                      {formState.tags}
                    </span>
                  </div>
                </div>
              ) : (
                /* Editable View */
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-cloud-600 font-medium mb-1">Course Code</label>
                    <input
                      type="text"
                      value={formState.courseCode}
                      onChange={(e) => setFormState({ ...formState, courseCode: e.target.value.trim().toUpperCase() })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 bg-white text-cloud-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-cloud-600 font-medium mb-1">Unit</label>
                      <input
                        type="text"
                        value={formState.unit}
                        onChange={(e) => setFormState({ ...formState, unit: e.target.value, unitNumber: null })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 bg-white text-cloud-900"
                      />
                    </div>
                    <div>
                      <label className="block text-cloud-600 font-medium mb-1">Type</label>
                      <input
                        type="text"
                        value={formState.type}
                        onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 bg-white text-cloud-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-cloud-600 font-medium mb-1">Topic</label>
                    <input
                      type="text"
                      value={formState.topic}
                      onChange={(e) => setFormState({ ...formState, topic: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 bg-white text-cloud-900"
                    />
                  </div>
                  <div>
                    <label className="block text-cloud-600 font-medium mb-1">Tags (comma separated)</label>
                    <input
                      type="text"
                      value={formState.tags}
                      onChange={(e) => setFormState({ ...formState, tags: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 bg-white text-cloud-900 font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons: [Accept Classification] [Edit] (as requested in prompt) */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-3 py-1.5 rounded-xl border border-cloud-300 hover:bg-white text-cloud-700 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel Editing' : 'Edit'}
                </button>

                <button
                  type="button"
                  onClick={handleAcceptClassification}
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  {submitting ? 'Indexing...' : 'Accept Classification'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
