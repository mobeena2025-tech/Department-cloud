import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  FileText,
  Bell,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Download,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';

export default function StudentDashboard({ onNavigate }) {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, mRes, aRes, ancRes] = await Promise.all([
          api.getCourses({ role: 'student', userId: currentUser?.id }),
          api.getMaterials(),
          api.getAssignments(),
          api.getAnnouncements(),
        ]);
        if (cRes?.courses) setCourses(cRes.courses);
        if (mRes?.materials) setMaterials(mRes.materials);
        if (aRes?.assignments) setAssignments(aRes.assignments);
        if (ancRes?.announcements) setAnnouncements(ancRes.announcements);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  const recentMaterials = materials.slice(0, 3);
  const upcomingAssignments = assignments.slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="cloud-card p-6 bg-gradient-to-r from-brand-900 via-brand-800 to-cloud-900 text-white border-none shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-brand-200 text-xs font-semibold mb-2">
            <span className="badge-pill bg-brand-500/30 border border-brand-400/40 text-brand-100">
              Semester 6 &bull; Section A
            </span>
            <span>CBIT Autonomous Department Cloud</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {currentUser?.name}
          </h1>
          <p className="text-xs text-brand-100/90 mt-1 leading-relaxed">
            All registered courses, courseware notes, assignments, and curriculum updates are synchronized with your academic cloud identity.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('/ai-search')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-brand-900 text-xs font-bold hover:bg-brand-50 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Ask Department AI
            </button>
            <button
              onClick={() => onNavigate('/student/materials')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-700/60 hover:bg-brand-700 text-white text-xs font-medium border border-brand-500/40 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Browse Courseware
            </button>
          </div>
        </div>

        {/* Subtle decorative motif */}
        <div className="absolute -right-10 -bottom-10 opacity-10 text-white pointer-events-none">
          <GraduationCap className="w-64 h-64" />
        </div>
      </div>

      {/* Academic Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current CGPA"
          value="8.92"
          subtitle="Top 5% of B.E. Cohort"
          trend="+0.14"
          color="emerald"
        />
        <StatCard
          title="Earned Credits"
          value="114 / 160"
          subtitle="71.2% Degree Completion"
          color="brand"
        />
        <StatCard
          title="Enrolled Courses"
          value="4 Courses"
          subtitle="14 Active Credits"
          color="blue"
        />
        <StatCard
          title="Attendance Metric"
          value="94.2%"
          subtitle="All Courses in Compliance"
          trend="Eligible"
          color="emerald"
        />
      </div>

      {/* Main Grid: My Courses & Upcoming Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: My Courses */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Courses Header & Cards */}
          <div className="cloud-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-cloud-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-cloud-900">My Courses</h2>
                <p className="text-xs text-cloud-500">Currently enrolled curriculum subjects</p>
              </div>
              <button
                onClick={() => onNavigate('/student/courses')}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => onNavigate(`/courses/${course.id}`)}
                  className="p-4 rounded-xl border border-cloud-200 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer bg-white group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 font-mono text-[10px] font-bold">
                        {course.code}
                      </span>
                      <span className="text-[11px] text-cloud-500 font-medium">
                        {course.credits} Credits
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-cloud-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                      {course.title}
                    </h3>

                    <p className="text-xs text-cloud-500 mt-1">
                      Faculty: <span className="font-medium text-cloud-700">{course.facultyName || 'Not assigned'}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-cloud-100 flex items-center justify-between text-xs text-cloud-500">
                    <span>{course.materialsCount} Materials</span>
                    <span className="text-brand-600 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                      <span>Open Course</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Materials Section (as specified in prompt) */}
          <div className="cloud-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-cloud-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-cloud-900">Recent Materials</h2>
                <p className="text-xs text-cloud-500">Latest notes and slide decks uploaded by faculty</p>
              </div>
              <button
                onClick={() => onNavigate('/student/materials')}
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Browse All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentMaterials.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => setSelectedMaterial(mat)}
                  className="flex items-center justify-between p-3 rounded-xl border border-cloud-200 hover:border-brand-200 hover:bg-brand-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-semibold text-xs flex-shrink-0">
                      {mat.fileType}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-cloud-900 group-hover:text-brand-600 transition-colors truncate">
                        {mat.title}
                      </div>
                      <div className="text-[11px] text-cloud-500 truncate">
                        {mat.courseName || mat.courseId} &bull; {mat.unitTitle || `Unit ${mat.unitNumber}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-cloud-400 font-mono hidden sm:inline">
                      {mat.size}
                    </span>
                    <span className="badge-pill bg-cloud-100 text-cloud-700 text-[10px] group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      Preview
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Upcoming & Announcements */}
        <div className="space-y-6">
          
          {/* Upcoming Section (as specified in prompt) */}
          <div className="cloud-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-cloud-100 mb-4">
              <h2 className="text-sm font-bold text-cloud-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-600" />
                Upcoming Deadlines
              </h2>
              <span className="badge-pill bg-amber-50 text-amber-700 text-[10px] font-bold">
                {upcomingAssignments.length} Pending
              </span>
            </div>

            <div className="space-y-3">
              {upcomingAssignments.map((asg) => (
                <div
                  key={asg.id}
                  onClick={() => onNavigate('/student/assignments')}
                  className="p-3 rounded-xl border border-cloud-200 hover:border-amber-300 hover:bg-amber-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="badge-pill bg-cloud-100 text-cloud-800 text-[10px] font-mono">
                      {asg.courseCode}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
                      Due {new Date(asg.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-cloud-900 group-hover:text-brand-600 transition-colors mt-2 line-clamp-1">
                    {asg.title}
                  </div>

                  <div className="text-[11px] text-cloud-500 mt-1 flex items-center justify-between">
                    <span>Max: {asg.maxMarks} Marks</span>
                    <span className="text-brand-600 font-semibold">Submit &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Announcements (as specified in prompt) */}
          <div className="cloud-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-cloud-100 mb-4">
              <h2 className="text-sm font-bold text-cloud-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-600" />
                Announcements
              </h2>
              <button
                onClick={() => onNavigate('/student/announcements')}
                className="text-[11px] text-brand-600 hover:underline"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map((anc) => (
                <div key={anc.id} className="p-3 rounded-xl bg-cloud-50/60 border border-cloud-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`badge-pill text-[10px] font-bold ${
                      anc.priority === 'Urgent'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-brand-50 text-brand-700 border border-brand-200'
                    }`}>
                      {anc.priority}
                    </span>
                    <span className="text-[10px] text-cloud-400">
                      {new Date(anc.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-cloud-900 leading-snug">
                    {anc.title}
                  </h4>
                  <p className="text-[11px] text-cloud-600 mt-1 line-clamp-2 leading-relaxed">
                    {anc.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        material={selectedMaterial}
        isOpen={Boolean(selectedMaterial)}
        onClose={() => setSelectedMaterial(null)}
      />

    </div>
  );
}
