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
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      if (res?.auditLogs) setLogs(res.auditLogs);
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
        log.actorName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q) ||
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
          <h1 className="text-xl font-bold text-cloud-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            Department Security & Access Audit Logs
          </h1>
          <p className="text-xs text-cloud-500">
            Immutable chronological record of academic uploads, student document requests, and security policy checks
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-cloud-200 hover:bg-cloud-50 text-cloud-700 text-xs font-semibold transition-colors cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Audit Trail
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
            placeholder="Search by actor, action keyword, or resource (e.g. CNN Architecture, ANN Unit 3)..."
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

      {/* Audit Log Stream (As specifically formatted in prompt) */}
      <div className="cloud-card overflow-hidden">
        <div className="px-6 py-3 border-b border-cloud-200 bg-cloud-50/70 flex items-center justify-between text-xs font-semibold text-cloud-500">
          <span>{filtered.length} Audit Events Logged</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <Lock className="w-3 h-3 text-emerald-600" />
            Tamper-Proof Audit Hashing Active
          </span>
        </div>

        <div className="divide-y divide-cloud-100">
          {filtered.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const isDenied = log.status === 'DENIED';

            return (
              <div
                key={log.id}
                className={`p-4 transition-colors ${
                  isDenied ? 'bg-rose-50/40 hover:bg-rose-50/60' : 'hover:bg-brand-50/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Timestamp badge */}
                    <div className="px-2.5 py-1 rounded-lg bg-cloud-100 text-cloud-700 font-mono text-xs font-bold whitespace-nowrap flex-shrink-0">
                      {timeStr}
                    </div>

                    <div className="min-w-0">
                      {/* Main human-readable event title as requested */}
                      <div className="font-bold text-xs text-cloud-900 flex flex-wrap items-center gap-2">
                        <span className="capitalize">{log.actorRole}</span>
                        <span className="text-cloud-400 font-normal">&mdash;</span>
                        <span className="text-cloud-900 font-medium">
                          {log.actorName} {log.action.toLowerCase().replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded text-[11px]">
                          {log.resource}
                        </span>
                      </div>

                      {/* Details row */}
                      {log.details && (
                        <p className="text-[11px] text-cloud-500 mt-1">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                    <span className="text-[10px] font-mono text-cloud-400 hidden md:inline">
                      IP: {log.ipAddress || '—'}
                    </span>
                    <span className={`badge-pill text-xs font-mono font-bold ${
                      isDenied
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
