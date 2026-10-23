import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import CreateAssignmentModal from '../../components/faculty/CreateAssignmentModal';

export default function FacultyAssignments({ onNavigate }) {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [aRes, cRes] = await Promise.all([
        api.getAssignments(),
        api.getCourses({ role: 'faculty' }),
      ]);
      if (aRes?.assignments) setAssignments(aRes.assignments);
      if (cRes?.courses) setCourses(cRes.courses);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cloud-900">Course Assignments</h1>
          <p className="text-xs text-cloud-500">
            Publish assessment deadlines, problem formulations, and manage class submissions
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          Create New Assignment
        </button>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {assignments.map((asg) => (
          <div key={asg.id} className="cloud-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 font-mono text-xs font-bold">
                  {asg.courseCode}
                </span>
                <span className="badge-pill bg-amber-50 text-amber-800 text-xs font-semibold">
                  Due: {new Date(asg.dueDate).toLocaleString()}
                </span>
                <span className="text-xs text-cloud-500 font-medium">
                  Max Marks: {asg.maxMarks}
                </span>
              </div>

              <h3 className="text-base font-bold text-cloud-900">{asg.title}</h3>
              <p className="text-xs text-cloud-600 leading-relaxed">{asg.description}</p>

              <div className="flex items-center gap-4 text-xs text-cloud-500 pt-1">
                <span>Unit: <strong>Unit {asg.unitNumber}</strong></span>
                {asg.attachmentName && (
                  <span className="text-brand-600 font-mono bg-brand-50 px-2 py-0.5 rounded">
                    Attachment: {asg.attachmentName}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <div className="text-xs font-bold text-cloud-900">
                  {asg.submittedCount} / {asg.totalEnrolled} Submitted
                </div>
                <div className="w-32 bg-cloud-100 h-2 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-brand-600 h-full rounded-full"
                    style={{ width: `${asg.totalEnrolled ? (asg.submittedCount / asg.totalEnrolled) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-[10px] text-cloud-400 mt-1">
                  {asg.pendingCount} not yet submitted
                </div>
              </div>

              <button
                onClick={() => onNavigate('/faculty/submissions')}
                className="px-4 py-2 rounded-xl bg-cloud-900 hover:bg-cloud-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                View Submissions &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={showCreateModal}
        courses={courses}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newAsg) => {
          setAssignments((prev) => [newAsg, ...prev]);
        }}
      />

    </div>
  );
}
