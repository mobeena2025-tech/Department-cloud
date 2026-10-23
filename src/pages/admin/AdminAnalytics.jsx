import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Search, ShieldAlert, KeyRound, HardDrive } from 'lucide-react';
import { api } from '../../services/api';
import StatCard from '../../components/common/StatCard';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAnalytics();
        if (res?.analytics) setAnalytics(res.analytics);
      } catch (err) {
        setError(err.message || 'Could not load analytics');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Every number on this page is counted from the database / audit log.
  const overview = analytics?.overview || {};
  const searches = analytics?.aiSearchTelemetry || { totalQueriesThisMonth: 0, topSearchedTopics: [] };
  const topMax = Math.max(1, ...searches.topSearchedTopics.map((t) => t.count));
  const fmt = (n) => (loading || n === undefined || n === null ? '—' : String(n));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cloud-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-600" />
          Academic Cloud Analytics
        </h1>
        <p className="text-xs text-cloud-500">
          Usage counted from the department database and audit log
          {analytics?.generatedAt ? ` • updated ${new Date(analytics.generatedAt).toLocaleString()}` : ''}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">{error}</div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assistant Searches"
          value={fmt(searches.totalQueriesThisMonth)}
          subtitle="Last 30 days"
          color="brand"
          icon={Search}
        />
        <StatCard
          title="Assignment Submission"
          value={
            overview.assignmentSubmissionRate === null || overview.assignmentSubmissionRate === undefined
              ? '—'
              : `${overview.assignmentSubmissionRate}%`
          }
          subtitle="Received / expected"
          color="purple"
          icon={TrendingUp}
        />
        <StatCard
          title="Denied Access Attempts"
          value={fmt(overview.deniedAccessLast30Days)}
          subtitle="Last 30 days"
          color="emerald"
          icon={ShieldAlert}
        />
        <StatCard
          title="Failed Sign-ins"
          value={fmt(overview.failedLoginsLast30Days)}
          subtitle="Last 30 days"
          color="blue"
          icon={KeyRound}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Most repeated assistant searches */}
        <div className="cloud-card p-6">
          <h3 className="text-sm font-bold text-cloud-900 mb-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-brand-600" />
            Most Repeated Assistant Searches
          </h3>
          <p className="text-xs text-cloud-500 mb-4">Exact search text, last 30 days</p>

          {!loading && searches.topSearchedTopics.length === 0 && (
            <p className="text-xs text-cloud-500">No searches yet.</p>
          )}
          <div className="space-y-3">
            {searches.topSearchedTopics.map((item, idx) => (
              <div key={item.topic} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cloud-800">
                    {idx + 1}. {item.topic}
                  </span>
                  <span className="font-mono text-brand-700 font-bold">
                    {item.count} {item.count === 1 ? 'search' : 'searches'}
                  </span>
                </div>
                <div className="w-full bg-cloud-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-600 h-full rounded-full" style={{ width: `${(item.count / topMax) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage and records */}
        <div className="cloud-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-cloud-900 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-brand-600" />
            Storage & Records
          </h3>
          <div className="p-4 rounded-xl bg-cloud-50 border border-cloud-200 space-y-2 text-xs">
            {[
              ['Files stored (materials + submissions)', `${fmt(overview.storageUsedMb)} MB`],
              ['Course materials', fmt(overview.academicResources)],
              ['Assignments (active / total)', `${fmt(overview.activeAssignments)} / ${fmt(overview.totalAssignments)}`],
              ['Submissions (graded / total)', `${fmt(overview.gradedSubmissions)} / ${fmt(overview.totalSubmissions)}`],
              ['Course enrollments', fmt(overview.totalEnrollments)],
              ['Accounts (admin / faculty / student)', `${fmt(overview.totalAdmins)} / ${fmt(overview.totalFaculty)} / ${fmt(overview.totalStudents)}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-cloud-700">
                <span>{label}:</span>
                <span className="font-bold font-mono text-cloud-900">{value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-cloud-500 leading-relaxed">
            PDFs are kept in a private Supabase Storage bucket and are only reachable through
            short-lived signed links that the server issues after checking enrollment.
          </p>
        </div>

      </div>
    </div>
  );
}
