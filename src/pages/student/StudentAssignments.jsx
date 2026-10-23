import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  UploadCloud,
  FileText,
  AlertCircle,
  Calendar,
  X,
  Send
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export default function StudentAssignments() {
  const { currentUser } = useAuth();
  const { addToast } = useNotification();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'submitted'
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('ANN_Assignment2_DEMO-ROLL.pdf');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        api.getAssignments(),
        api.getSubmissions({ studentId: currentUser?.id }),
      ]);
      if (aRes?.assignments) setAssignments(aRes.assignments);
      if (sRes?.submissions) setSubmissions(sRes.submissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!submittingAssignment) return;

    setIsSubmitting(true);
    try {
      await api.submitAssignment({
        assignmentId: submittingAssignment.id,
        studentId: currentUser?.id,
        fileName: uploadFileName,
        fileSize: '3.4 MB',
        submissionText: submissionNotes || 'Completed implementation and test suite verification.',
      });

      addToast(`Work submitted for "${submittingAssignment.title}"!`, 'success', 'Assignment Submitted');
      setSubmittingAssignment(null);
      await loadData();
      setActiveTab('submitted');
    } catch (err) {
      addToast(err.message, 'error', 'Submission Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submittedAssignmentIds = submissions
    .filter((s) => s.status === 'Submitted' || s.status === 'Graded')
    .map((s) => s.assignmentId);

  const pendingList = assignments.filter((a) => !submittedAssignmentIds.includes(a.id));
  const submittedList = submissions.filter((s) => s.status === 'Submitted' || s.status === 'Graded');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cloud-900">Assignments & Assessments</h1>
        <p className="text-xs text-cloud-500">
          Coursework problem sets, lab deliverables, and grading rubrics
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-cloud-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs'
              : 'text-cloud-600 hover:bg-cloud-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending Submissions ({pendingList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submitted')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'submitted'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
              : 'text-cloud-600 hover:bg-cloud-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Submitted & Graded ({submittedList.length})</span>
        </button>
      </div>

      {/* Tab: Pending */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingList.length === 0 ? (
            <div className="cloud-card p-12 text-center text-cloud-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-bold text-cloud-900 text-sm">All Caught Up!</div>
              <p className="text-cloud-500 mt-1">No pending assignment deadlines across your enrolled courses.</p>
            </div>
          ) : (
            pendingList.map((asg) => (
              <div key={asg.id} className="cloud-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 font-mono text-xs font-bold">
                      {asg.courseCode}
                    </span>
                    <span className="badge-pill bg-amber-50 text-amber-800 text-xs font-semibold">
                      Due: {new Date(asg.dueDate).toLocaleString()}
                    </span>
                    <span className="text-xs text-cloud-500 font-medium">
                      Max: {asg.maxMarks} Marks
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-cloud-900">{asg.title}</h3>
                  <p className="text-xs text-cloud-600 mt-1 leading-relaxed max-w-2xl">{asg.description}</p>

                  <div className="mt-3 flex items-center gap-3 text-xs text-cloud-500">
                    <span>Faculty: <strong className="text-cloud-800">{asg.facultyName}</strong></span>
                    {asg.attachmentName && (
                      <span className="text-brand-600 font-mono bg-brand-50 px-2 py-0.5 rounded">
                        Attachment: {asg.attachmentName}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSubmittingAssignment(asg)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex-shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  Submit Solution
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Submitted */}
      {activeTab === 'submitted' && (
        <div className="space-y-4">
          {submittedList.map((sub) => {
            const asg = assignments.find((a) => a.id === sub.assignmentId) || {};
            return (
              <div key={sub.id} className="cloud-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="badge-pill bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {sub.status}
                      </span>
                      <span className="text-xs font-mono text-cloud-500">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-cloud-900">
                      {asg.title || 'Course Assignment'}
                    </h3>

                    <p className="text-xs text-cloud-600 mt-1 font-mono">
                      Uploaded File: <strong className="text-cloud-800">{sub.fileName}</strong> ({sub.fileSize || '3.4 MB'})
                    </p>

                    {sub.submissionText && (
                      <div className="mt-2 text-xs text-cloud-700 bg-cloud-50 p-2.5 rounded-lg border border-cloud-100 italic">
                        "{sub.submissionText}"
                      </div>
                    )}
                  </div>

                  {/* Evaluation Score Badge */}
                  <div className="p-4 rounded-xl border border-cloud-200 bg-cloud-50 text-center min-w-[120px]">
                    <span className="text-[10px] uppercase font-bold text-cloud-500 block mb-1">
                      Awarded Grade
                    </span>
                    {sub.grade !== null && sub.grade !== undefined ? (
                      <div>
                        <span className="text-2xl font-black text-emerald-700 font-mono">
                          {sub.grade}
                        </span>
                        <span className="text-xs text-cloud-400 font-mono"> / {sub.maxMarks || 25}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        Evaluation Pending
                      </span>
                    )}
                  </div>
                </div>

                {sub.feedback && (
                  <div className="mt-4 pt-3 border-t border-cloud-100 text-xs text-cloud-700 bg-brand-50/50 p-3 rounded-xl border border-brand-100">
                    <span className="font-bold text-brand-900 block mb-1">Faculty Feedback:</span>
                    {sub.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Assignment Modal */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cloud-200 bg-cloud-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-cloud-900">
                    Submit Assignment Solution
                  </h3>
                  <p className="text-[11px] text-cloud-500 truncate max-w-xs">
                    {submittingAssignment.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSubmittingAssignment(null)}
                className="text-cloud-400 hover:text-cloud-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSolution} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-cloud-700 mb-1">Attach Solution File</label>
                <input
                  type="text"
                  required
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 font-mono focus:outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-cloud-400 mt-1">
                  Format: [CourseCode]_Submission_[RollNo].pdf (Max size: 50MB)
                </p>
              </div>

              <div>
                <label className="block font-semibold text-cloud-700 mb-1">Summary / Implementation Notes</label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Describe your solution architecture, dataset results, or special notes for Dr. Demo Faculty A..."
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-cloud-50 border border-cloud-200 text-[11px] text-cloud-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Your submission is timestamped and locked in the departmental audit trail.</span>
              </div>

              <div className="pt-3 border-t border-cloud-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 rounded-xl border border-cloud-200 text-cloud-700 hover:bg-cloud-100 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : 'Upload Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
