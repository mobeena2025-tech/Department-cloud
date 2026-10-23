import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowDownCircle,
  FileText,
  User,
  RefreshCw,
  HardDrive,
  Activity
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminActivity() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      if (res?.auditLogs) setLogs(res.auditLogs);
    } catch (err) {
      console.warn('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filtered = logs.filter((log) => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        log.actorName?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.resource?.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-cloud-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600" />
              Department Activity & Security Audit Trail
            </h1>
            <span className="badge-pill bg-purple-50 text-purple-700 border border-purple-200 text-[10px]">
              Compliance & Oversight
            </span>
          </div>
          <p className="text-xs text-cloud-500 mt-0.5">
            Immutable chronological record of academic uploads, metadata modifications, downloads, and access boundary evaluations
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-cloud-200 hover:bg-cloud-50 text-cloud-700 text-xs font-semibold transition-colors cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Activity Log
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="cloud-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by actor name, action (e.g. UPLOAD_MATERIAL, UPDATE_METADATA), or resource..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-cloud-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-700 bg-white"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">Authorized (SUCCESS)</option>
            <option value="DENIED">Blocked (DENIED)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="cloud-card overflow-hidden">
        <div className="px-6 py-3 border-b border-cloud-200 bg-cloud-50/70 flex items-center justify-between text-xs font-semibold text-cloud-500">
          <span>{filtered.length} Audit Events Recorded</span>
          <span>Access Boundary Integrity: Verified</span>
        </div>

        <div className="divide-y divide-cloud-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-cloud-500">
              No matching activity events found.
            </div>
          ) : (
            filtered.map((log) => {
              const isSuccess = log.status === 'SUCCESS';
              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-brand-50/15 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSuccess
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                      {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-cloud-900 font-mono text-[11px]">
                          {log.action}
                        </span>
                        <span className={`badge-pill text-[10px] ${
                          isSuccess
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {log.status}
                        </span>
                        <span className="badge-pill bg-cloud-100 text-cloud-600 text-[10px] font-mono">
                          {log.actorRole}
                        </span>
                      </div>

                      <div className="text-cloud-700 truncate font-medium">
                        {log.resource}
                      </div>

                      {log.details && (
                        <div className="text-[11px] text-cloud-500">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-mono text-cloud-500 self-end md:self-center flex-shrink-0">
                    <div className="font-semibold text-cloud-800">{log.actorName}</div>
                    <div className="text-cloud-400">{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
