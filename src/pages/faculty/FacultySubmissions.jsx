import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  FileText,
  Award,
  Filter,
  Eye,
  Search,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import GradeSubmissionModal from '../../components/faculty/GradeSubmissionModal';

export default function FacultySubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  // Start on the assignment chosen on another page (if any), else the first one.
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(() => {
    try { return sessionStorage.getItem('dac_grade_assignment') || ''; } catch { return ''; }
  });
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        api.getAssignments(),
        api.getSubmissions(),
      ]);
      if (aRes?.assignments) {
        setAssignments(aRes.assignments);
        setSelectedAssignmentId((id) => (aRes.assignments.some((a) => a.id === id) ? id : aRes.assignments[0]?.id || ''));
      }
      if (sRes?.submissions) setSubmissions(sRes.submissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentAssignment = assignments.find((a) => a.id === selectedAssignmentId);
  const forAssignment = submissions.filter((s) => s.assignmentId === selectedAssignmentId);
  const gradedCount = forAssignment.filter((s) => s.status === 'Graded').length;

  const filteredSubmissions = forAssignment.filter((s) => {
    if (statusFilter !== 'ALL' && s.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cloud-900">Student Submissions & Grading</h1>
          <p className="text-xs text-cloud-500">
            Continuous internal assessment evaluation for departmental coursework
          </p>
        </div>

        {/* Assignment Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-cloud-500 font-medium">Assignment:</label>
          <select
            value={selectedAssignmentId}
            onChange={(e) => {
              setSelectedAssignmentId(e.target.value);
              try { sessionStorage.setItem('dac_grade_assignment', e.target.value); } catch { /* optional */ }
            }}
            className="px-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 font-semibold bg-white"
          >
            {assignments.map((asg) => (
              <option key={asg.id} value={asg.id}>
                {asg.courseCode} — {asg.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignment Overview Card */}
      {currentAssignment && (
        <div className="cloud-card p-5 bg-brand-50/40 border-brand-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-pill bg-brand-600 text-white font-mono text-[10px] font-bold">
                {currentAssignment.courseCode}
              </span>
              <span className="text-xs text-cloud-500">Max Marks: {currentAssignment.maxMarks}</span>
            </div>
            <h2 className="text-sm font-bold text-cloud-900">{currentAssignment.title}</h2>
            <p className="text-xs text-cloud-600 mt-1 max-w-2xl">{currentAssignment.description}</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-center p-2.5 rounded-lg bg-white border border-brand-200">
              <span className="text-cloud-400 block text-[10px] uppercase font-bold">Enrolled</span>
              <span className="font-bold text-cloud-900 text-sm">{currentAssignment.totalEnrolled}</span>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-white border border-brand-200">
              <span className="text-cloud-400 block text-[10px] uppercase font-bold">Turned In</span>
              <span className="font-bold text-emerald-700 text-sm">
                {forAssignment.length}
              </span>
            </div>
            <div className="text-center p-2.5 rounded-lg bg-white border border-brand-200">
              <span className="text-cloud-400 block text-[10px] uppercase font-bold">Graded</span>
              <span className="font-bold text-purple-700 text-sm">{gradedCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Table (strictly matching the prompt's layout specifications) */}
      <div className="cloud-card overflow-hidden">
        <div className="px-6 py-3 border-b border-cloud-200 bg-cloud-50/70 flex items-center justify-between text-xs font-semibold text-cloud-600">
          <span>Roster of Submissions ({filteredSubmissions.length} Students)</span>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-cloud-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-cloud-700 font-medium focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="submitted">Waiting for grade</option>
              <option value="graded">Graded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cloud-50/50 text-cloud-500 font-semibold border-b border-cloud-200">
              <tr>
                <th className="py-3.5 px-6">Student</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Submitted</th>
                <th className="py-3.5 px-6 text-center">Score</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud-100 text-cloud-800">
              {filteredSubmissions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 px-6 text-center text-cloud-500">
                    {loading
                      ? 'Loading...'
                      : !assignments.length
                        ? 'You have not published any assignments yet.'
                        : forAssignment.length
                          ? 'No submissions match this filter.'
                          : 'No student has submitted this assignment yet.'}
                  </td>
                </tr>
              )}
              {filteredSubmissions.map((sub, idx) => {
                const isSubmitted = sub.status === 'Submitted' || sub.status === 'Graded';
                const dateStr = sub.submittedAt
                  ? new Date(sub.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : '—';

                return (
                  <tr key={sub.id || idx} className="hover:bg-brand-50/20 transition-colors">
                    
                    {/* Student */}
                    <td className="py-3.5 px-6">
                      <div className="font-bold text-cloud-900">
                        {sub.studentName || 'Unknown student'}
                      </div>
                      <div className="text-[11px] text-cloud-500 font-mono">
                        {sub.rollNo || '—'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6">
                      <span className={`badge-pill text-xs font-medium ${
                        sub.status === 'Graded'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : sub.status === 'Submitted'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-cloud-100 text-cloud-600 border border-cloud-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>

                    {/* Submitted */}
                    <td className="py-3.5 px-6 font-mono text-cloud-700">
                      {dateStr}
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-6 text-center font-mono">
                      {sub.grade !== null && sub.grade !== undefined ? (
                        <span className="font-bold text-emerald-700">
                          {sub.grade} / {sub.maxMarks}
                        </span>
                      ) : (
                        <span className="text-cloud-400">—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-6 text-right">
                      {isSubmitted ? (
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          {sub.status === 'Graded' ? 'View / Re-grade' : 'View & Grade'}
                        </button>
                      ) : (
                        <span className="text-cloud-400 font-mono">—</span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Submission Modal */}
      <GradeSubmissionModal
        submission={selectedSubmission}
        isOpen={Boolean(selectedSubmission)}
        onClose={() => setSelectedSubmission(null)}
        onGraded={(updatedSub) => {
          setSubmissions((prev) =>
            prev.map((s) => (s.id === updatedSub.id ? updatedSub : s))
          );
        }}
      />

    </div>
  );
}
