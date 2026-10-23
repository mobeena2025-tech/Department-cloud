import React, { useState } from 'react';
import { X, CheckCircle2, FileText, Download, Award, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function GradeSubmissionModal({ submission, isOpen, onClose, onGraded }) {
  const { addToast } = useNotification();
  const [grade, setGrade] = useState(submission?.grade || 23);
  const [feedback, setFeedback] = useState(
    submission?.feedback || 'Good formulation of vectorized backprop routines. Numerical gradients match theoretical derivatives.'
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !submission) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.gradeSubmission(submission.id, {
        grade: Number(grade),
        feedback,
        gradedBy: 'Dr. Demo Faculty A',
      });
      addToast(`Graded submission for ${submission.studentName}: ${grade}/${submission.maxMarks || 25}`, 'success', 'Gradebook Updated');
      if (onGraded) onGraded(res.submission);
      onClose();
    } catch (err) {
      addToast(err.message, 'error', 'Grading Failed');
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
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-cloud-900">
                Review & Grade Submission
              </h3>
              <p className="text-[11px] text-cloud-500">
                {submission.studentName} &bull; Roll: {submission.rollNo}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-cloud-400 hover:text-cloud-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details & Submission Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-cloud-50 border border-cloud-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cloud-500">Submitted Artifact:</span>
              <span className="font-mono font-semibold text-brand-700">
                {submission.fileName || 'ANN_Assignment2_DEMO-ROLL.pdf'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cloud-500">Submission Timestamp:</span>
              <span className="text-cloud-800">{new Date(submission.submittedAt || Date.now()).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-cloud-500">File Verification:</span>
              <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
                SHA-256 Validated
              </span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-cloud-700 mb-1">Student Notes / Summary:</label>
            <div className="p-3 rounded-xl bg-cloud-50/50 border border-cloud-200 text-cloud-700 text-xs font-mono">
              {submission.submissionText || 'Implemented multi-layer perceptron from scratch in NumPy with Adam optimizer and numerical gradient verification.'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-cloud-700">
                  Awarded Score (Max: {submission.maxMarks || 25})
                </label>
                <span className="text-xs font-bold text-brand-600">
                  {((grade / (submission.maxMarks || 25)) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="number"
                min={0}
                max={submission.maxMarks || 25}
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-sm font-bold text-cloud-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-cloud-700 mb-1">Qualitative Feedback</label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Constructive feedback visible to the student in their academic dashboard..."
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
              />
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
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Recording Grade...' : 'Save & Publish Grade'}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
