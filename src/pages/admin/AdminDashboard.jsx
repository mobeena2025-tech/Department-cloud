import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  BookOpen,
  FolderArchive,
  HardDrive,
  BarChart3,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import AddUserModal from '../../components/admin/AddUserModal';

export default function AdminDashboard({ onNavigate }) {
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [anRes, logRes] = await Promise.all([
          api.getAnalytics(),
          api.getAuditLogs(),
        ]);
        if (anRes?.analytics) setAnalytics(anRes.analytics);
        if (logRes?.auditLogs) setAuditLogs(logRes.auditLogs.slice(0, 5));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Every number below comes from the database (see GET /api/analytics).
  const overview = analytics?.overview || {};
  const resourceUsage = analytics?.resourceUsageByCourse || [];
  const weeklyActivity = analytics?.weeklyActivity || [];
  const maxDownloads = Math.max(1, ...resourceUsage.map((c) => c.downloads + c.uploads));
  const maxLogins = Math.max(1, ...weeklyActivity.map((d) => d.activeLogins));
  const fmt = (n) => (loading || n === undefined || n === null ? '—' : String(n));

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="cloud-card p-6 bg-gradient-to-r from-cloud-950 via-cloud-900 to-brand-950 text-white border-none shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-300 text-xs font-semibold mb-1">
              <span className="badge-pill bg-purple-500/30 border border-purple-400/40 text-purple-100">
                HOD Executive Secretariat
              </span>
              <span>Dept. of AI &amp; DS &bull; Central Cloud Console</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Department Academic Cloud Overview
            </h1>
            <p className="text-xs text-cloud-300 mt-1">
              Live counts from the department database and audit log.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              Provision User
            </button>
            <button
              onClick={() => onNavigate('/admin/audit-logs')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Audit Stream
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Department Metrics (as explicitly requested in prompt) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Students"
          value={fmt(overview.totalStudents)}
          subtitle={`${fmt(overview.totalEnrollments)} course enrollments`}
          color="brand"
          icon={Users}
          onClick={() => onNavigate('/admin/students')}
        />
        <StatCard
          title="Faculty"
          value={fmt(overview.totalFaculty)}
          subtitle="Teaching accounts"
          color="emerald"
          icon={Briefcase}
          onClick={() => onNavigate('/admin/faculty')}
        />
        <StatCard
          title="Courses"
          value={fmt(overview.totalCourses)}
          subtitle={`${fmt(overview.activeAssignments)} active assignments`}
          color="blue"
          icon={BookOpen}
          onClick={() => onNavigate('/admin/courses')}
        />
        <StatCard
          title="Academic Resources"
          value={fmt(overview.academicResources)}
          subtitle={`${fmt(overview.storageUsedMb)} MB stored`}
          color="purple"
          icon={FolderArchive}
          onClick={() => onNavigate('/admin/materials')}
        />
      </div>

      {/* Department Charts (as requested in prompt) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Resource Usage & Course Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Resource Usage Chart */}
          <div className="cloud-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-cloud-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-cloud-900">Resource Usage by Course</h3>
                <p className="text-xs text-cloud-500">Files uploaded and opened per course (opens: last 30 days)</p>
              </div>
            </div>

            <div className="space-y-4">
              {!loading && resourceUsage.length === 0 && (
                <p className="text-xs text-cloud-500">No courses yet.</p>
              )}
              {resourceUsage.map((course) => {
                const percentage = Math.round(((course.downloads + course.uploads) / maxDownloads) * 100);
                return (
                  <div key={course.courseCode} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cloud-900">{course.courseCode}</span>
                        <span className="text-cloud-600 hidden sm:inline">{course.courseName}</span>
                      </div>
                      <span className="font-mono font-semibold text-brand-700">
                        {course.downloads} Opens &bull; {course.uploads} Files
                      </span>
                    </div>

                    <div className="w-full bg-cloud-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Activity / Active Users Chart */}
          <div className="cloud-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-cloud-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-cloud-900">Active Users, Last 7 Days</h3>
                <p className="text-xs text-cloud-500">Distinct users who signed in each day</p>
              </div>
            </div>

            {/* Custom Bar Chart Visualizer */}
            <div className="grid grid-cols-7 gap-2 items-end h-40 pt-4 pb-2 border-b border-cloud-100 text-center">
              {weeklyActivity.map((day) => {
                const heightPercent = Math.round((day.activeLogins / maxLogins) * 100);
                return (
                  <div key={day.date} className="flex flex-col items-center justify-end h-full group">
                    <span className="text-[10px] font-mono text-cloud-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                      {day.activeLogins}
                    </span>
                    <div
                      className="w-full max-w-[32px] bg-brand-500 hover:bg-brand-600 rounded-t-lg transition-all duration-200"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[11px] font-semibold text-cloud-700 mt-2">
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-cloud-500">
              <span>Counted from sign-in events in the audit log</span>
              <span>{weeklyActivity.reduce((s, d) => s + d.downloads, 0)} file opens this week</span>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Submission Rate & Audit Stream */}
        <div className="space-y-6">
          
          {/* Assignment Submission Rate */}
          <div className="cloud-card p-6">
            <h3 className="text-sm font-bold text-cloud-900 mb-1">Assignment Submission Rate</h3>
            <p className="text-xs text-cloud-500 mb-4">Department-wide completion ratio</p>

            <div className="text-center py-4 bg-cloud-50 rounded-xl border border-cloud-100 mb-4">
              <div className="text-3xl font-extrabold text-emerald-700 font-mono">
                {overview.assignmentSubmissionRate === null || overview.assignmentSubmissionRate === undefined
                  ? '—'
                  : `${overview.assignmentSubmissionRate}%`}
              </div>
              <span className="text-xs text-cloud-600 mt-1 block">
                Submissions received / expected across {fmt(overview.totalAssignments)} assignments
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-cloud-600">
                <span>Submissions received:</span>
                <span className="font-bold text-cloud-900">{fmt(overview.totalSubmissions)}</span>
              </div>
              <div className="flex justify-between text-cloud-600">
                <span>Graded:</span>
                <span className="font-bold text-cloud-900">{fmt(overview.gradedSubmissions)}</span>
              </div>
              <div className="flex justify-between text-cloud-600">
                <span>Denied access attempts (30 days):</span>
                <span className="font-bold text-rose-700">{fmt(overview.deniedAccessLast30Days)}</span>
              </div>
            </div>
          </div>

          {/* Audit Logs Quick Feed */}
          <div className="cloud-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-cloud-100 mb-4">
              <h3 className="text-sm font-bold text-cloud-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Recent Audit Events
              </h3>
              <button
                onClick={() => onNavigate('/admin/audit-logs')}
                className="text-[11px] text-brand-600 hover:underline"
              >
                Full Logs &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {!loading && auditLogs.length === 0 && <p className="text-xs text-cloud-500">No events yet.</p>}
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-cloud-50/60 border border-cloud-100 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-cloud-500 mb-1">
                    <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className={`badge-pill text-[9px] font-bold ${
                      log.status === 'DENIED'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="font-semibold text-cloud-900 leading-snug truncate">
                    {log.actorName} &bull; {log.action}
                  </div>
                  <div className="text-[11px] text-cloud-600 truncate mt-0.5 font-mono">
                    {log.resource}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onUserAdded={() => {
          // reload analytics if needed
        }}
      />

    </div>
  );
}
