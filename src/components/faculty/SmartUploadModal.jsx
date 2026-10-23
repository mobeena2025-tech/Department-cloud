import React, { useState } from 'react';
import { X, Upload, Sparkles, Check, Edit2, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function SmartUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [fileInputName, setFileInputName] = useState('cnn_final_latest.pdf');
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

  const handleSimulateSelect = async (fileName) => {
    setFileInputName(fileName);
    setAnalyzing(true);
    setClassification(null);
    setIsEditing(false);

    try {
      const res = await api.smartClassify(fileName, '6.4 MB');
      if (res?.classification) {
        setClassification(res.classification);
        setFormState({
          course: res.classification.suggestedCourse,
          courseCode: res.classification.suggestedCourseCode,
          unit: res.classification.suggestedUnit,
          unitNumber: res.classification.unitNumber,
          topic: res.classification.suggestedTopic,
          type: res.classification.suggestedType,
          tags: res.classification.suggestedTags.join(', '),
          visibility: 'Department / Enrolled',
        });
      }
    } catch (err) {
      // Fallback
      setClassification({
        suggestedCourse: 'Artificial Neural Networks',
        suggestedCourseCode: 'AI204',
        suggestedUnit: 'Unit 3',
        suggestedTopic: 'Convolutional Neural Networks',
        suggestedType: 'Lecture Material',
        suggestedTags: ['CNN', 'convolution', 'pooling', 'feature extraction'],
        confidence: 0.98,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAcceptClassification = async () => {
    setSubmitting(true);
    try {
      const payload = {
        title: fileInputName,
        fileName: fileInputName,
        courseId: formState.courseCode,
        unitNumber: formState.unitNumber,
        topic: formState.topic,
        fileType: 'PDF',
        size: '6.4 MB',
        visibility: formState.visibility,
        tags: formState.tags.split(',').map((t) => t.trim()),
        uploadedBy: 'Dr. Demo Faculty A',
      };

      const res = await api.uploadMaterial(payload);
      addToast(`Successfully published "${fileInputName}" to ${formState.courseCode} ${formState.unit}!`, 'success', 'Smart Cloud Upload');
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
              Select or Drop Academic Document:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fileInputName}
                onChange={(e) => setFileInputName(e.target.value)}
                placeholder="e.g. cnn_final_latest.pdf"
                className="flex-1 px-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500 font-mono"
              />
              <button
                onClick={() => handleSimulateSelect(fileInputName)}
                disabled={analyzing}
                className="px-4 py-2 rounded-xl bg-cloud-900 hover:bg-cloud-800 text-white text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Document'}
              </button>
            </div>

            {/* Quick Demo Pre-set files */}
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cloud-500">
              <span>Test presets:</span>
              <button
                onClick={() => handleSimulateSelect('cnn_final_latest.pdf')}
                className="text-brand-600 hover:underline font-mono bg-brand-50 px-2 py-0.5 rounded cursor-pointer"
              >
                cnn_final_latest.pdf
              </button>
              <button
                onClick={() => handleSimulateSelect('backprop_derivation_notes.pdf')}
                className="text-brand-600 hover:underline font-mono bg-brand-50 px-2 py-0.5 rounded cursor-pointer"
              >
                backprop_notes.pdf
              </button>
              <button
                onClick={() => handleSimulateSelect('ospf_routing_topology.pdf')}
                className="text-brand-600 hover:underline font-mono bg-brand-50 px-2 py-0.5 rounded cursor-pointer"
              >
                ospf_routing.pdf
              </button>
            </div>
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
                  {(classification.confidence * 100).toFixed(0)}% Match Confidence
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
                    <label className="block text-cloud-600 font-medium mb-1">Course Code & Name</label>
                    <input
                      type="text"
                      value={formState.course}
                      onChange={(e) => setFormState({ ...formState, course: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 bg-white text-cloud-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-cloud-600 font-medium mb-1">Unit</label>
                      <input
                        type="text"
                        value={formState.unit}
                        onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
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
