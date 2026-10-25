import React, { useState, useEffect } from 'react';
import {
  Users,
  FolderArchive,
  ClipboardList,
  Clock,
  Upload,
  Plus,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import UploadMaterialModal from '../../components/faculty/UploadMaterialModal';
import CreateAssignmentModal from '../../components/faculty/CreateAssignmentModal';

export default function FacultyDashboard({ onNavigate }) {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, mRes, aRes, sRes, uRes] = await Promise.all([
          api.getCourses(),
          api.getMaterials(),
          api.getAssignments(),
          api.getSubmissions(),
          api.getUsers(), // for faculty: the students in courses they teach
        ]);
        if (uRes?.users) setStudentCount(uRes.users.length);
        if (cRes?.courses) setCourses(cRes.courses);
        if (mRes?.materials) setMaterials(mRes.materials);
        if (aRes?.assignments) setAssignments(aRes.assignments);
        if (sRes?.submissions) setSubmissions(sRes.submissions);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'Submitted').length;
  const show = (n) => (loading ? '—' : n);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="cloud-card p-6 bg-gradient-to-r from-cloud-900 via-brand-950 to-cloud-900 text-white border-none shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold mb-1">
              <span className="badge-pill bg-brand-500/30 border border-brand-400/40 text-brand-100">
                Course Lead & Faculty Portal
              </span>
              <span>{currentUser?.department}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome, {currentUser?.name}
            </h1>
            <p className="text-xs text-cloud-300 mt-1">
              Upload course notes, set assignments, and grade student submissions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload Material
            </button>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>
          </div>
        </div>
      </div>

      {/* Faculty Metric Stats (as requested in prompt) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Courses"
          value={show(courses.length)}
          subtitle={courses.map((c) => c.code).join(', ') || 'None assigned yet'}
          color="blue"
          icon={BookOpen}
          onClick={() => onNavigate('/faculty/courses')}
        />
        <StatCard
          title="My Students"
          value={show(studentCount)}
          subtitle="Enrolled in your courses"
          color="brand"
          icon={Users}
          onClick={() => onNavigate('/faculty/students')}
        />
        <StatCard
          title="Course Materials"
          value={show(materials.length)}
          subtitle="Uploaded to your courses"
          color="emerald"
          icon={FolderArchive}
          onClick={() => onNavigate('/faculty/materials')}
        />
        <StatCard
          title="Pending Submissions"
          value={show(pendingSubmissionsCount)}
          subtitle={pendingSubmissionsCount ? 'Waiting for grading' : 'All graded'}
          color="amber"
          icon={ClipboardList}
          onClick={() => onNavigate('/faculty/submissions')}
        />
      </div>

      {/* Main Grid: My Courses & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: My Courses */}
        <div className="lg:col-span-2 space-y-6">
          <div className="cloud-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-cloud-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-cloud-900">My Assigned Courses</h2>
                <p className="text-xs text-cloud-500">Curriculum teaching load for current term</p>
              </div>
              <button
                onClick={() => onNavigate('/faculty/courses')}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
              >
                Manage Courses &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => onNavigate(`/courses/${course.id}`)}
                  className="p-5 rounded-xl border border-cloud-200 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer bg-white group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 font-mono text-xs font-bold">
                        {course.code}
                      </span>
                      <span className="text-xs font-medium text-cloud-500">
                        {course.credits} Credits
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-cloud-900 group-hover:text-brand-600 transition-colors">
                      {course.title}
                    </h3>

                    <p className="text-xs text-cloud-500 mt-1 line-clamp-2">
                      {course.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cloud-100 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-cloud-400 block text-[10px]">Students</span>
                      <span className="font-bold text-cloud-800">{course.enrolledCount}</span>
                    </div>
                    <div>
                      <span className="text-cloud-400 block text-[10px]">Materials</span>
                      <span className="font-bold text-cloud-800">{course.materialsCount}</span>
                    </div>
                    <div>
                      <span className="text-cloud-400 block text-[10px]">Assignments</span>
                      <span className="font-bold text-cloud-800">{course.activeAssignmentsCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Submissions Queue */}
          <div className="cloud-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-cloud-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-cloud-900">Recent Student Submissions</h2>
                <p className="text-xs text-cloud-500">Submissions awaiting evaluation and feedback</p>
              </div>
              <button
                onClick={() => onNavigate('/faculty/submissions')}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
              >
                View Gradebook &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {submissions.slice(0, 3).map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => onNavigate('/faculty/submissions')}
                  className="flex items-center justify-between p-3 rounded-xl border border-cloud-200 hover:border-brand-200 hover:bg-brand-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cloud-100 flex items-center justify-center text-cloud-700 font-mono text-xs font-bold">
                      {sub.rollNo?.slice(-3) || '—'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-cloud-900 group-hover:text-brand-600 transition-colors">
                        {sub.studentName}
                      </h4>
                      <p className="text-[11px] text-cloud-500">
                        Roll: {sub.rollNo || '—'} &bull; {sub.fileName || 'Written answer'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`badge-pill text-xs font-medium ${
                      sub.status === 'Graded'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {sub.status === 'Graded' ? `Graded (${sub.grade}/${sub.maxMarks ?? "?"})` : 'Needs Grading'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Activity */}
        <div className="space-y-6">
          
          {/* Quick Management Shortcuts */}
          <div className="cloud-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-cloud-900">Faculty Actions</h3>
            
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full text-left p-3 rounded-xl border border-cloud-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <Upload className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-cloud-900">Upload Material</div>
                <div className="text-[11px] text-cloud-500 truncate">Add PDF notes to a course</div>
              </div>
            </button>

            <button
              onClick={() => setShowAssignmentModal(true)}
              className="w-full text-left p-3 rounded-xl border border-cloud-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-cloud-900">Create Assignment</div>
                <div className="text-[11px] text-cloud-500 truncate">Publish deadline & attachments</div>
              </div>
            </button>

            <button
              onClick={() => onNavigate('/faculty/announcements')}
              className="w-full text-left p-3 rounded-xl border border-cloud-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-cloud-900">Course Notice Board</div>
                <div className="text-[11px] text-cloud-500 truncate">Post announcements to students</div>
              </div>
            </button>
          </div>

        </div>

      </div>

      {/* Modals */}
      <UploadMaterialModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={(newMat) => {
          setMaterials((prev) => [newMat, ...prev]);
        }}
      />

      <CreateAssignmentModal
        isOpen={showAssignmentModal}
        courses={courses}
        onClose={() => setShowAssignmentModal(false)}
        onCreated={(newAsg) => {
          setAssignments((prev) => [newAsg, ...prev]);
        }}
      />

    </div>
  );
}
