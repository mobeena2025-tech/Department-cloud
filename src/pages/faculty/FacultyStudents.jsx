import React, { useState, useEffect } from 'react';
import { Users, Search, GraduationCap, Mail, CheckCircle2, Award } from 'lucide-react';
import { api } from '../../services/api';

export default function FacultyStudents() {
  const [students, setStudents] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getUsers({ role: 'student' });
        if (res?.users) setStudents(res.users);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = students.filter((s) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cloud-900">Enrolled Student Cohort</h1>
        <p className="text-xs text-cloud-500">
          Roster of students registered under Artificial Neural Networks & Deep Learning courses
        </p>
      </div>

      {/* Search Filter */}
      <div className="cloud-card p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name or roll number..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="cloud-card overflow-hidden">
        <div className="px-6 py-3 border-b border-cloud-200 bg-cloud-50/70 flex items-center justify-between text-xs font-semibold text-cloud-500">
          <span>{filtered.length} Active Students</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cloud-50/50 text-cloud-500 font-semibold border-b border-cloud-200">
              <tr>
                <th className="py-3.5 px-6">Student Name</th>
                <th className="py-3.5 px-6">Roll Number</th>
                <th className="py-3.5 px-6">Semester &amp; Section</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud-100 text-cloud-800">
              {filtered.map((stu) => (
                <tr key={stu.id} className="hover:bg-brand-50/20 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-cloud-900">{stu.name}</div>
                    <div className="text-[11px] text-cloud-500">{stu.email}</div>
                  </td>
                  <td className="py-3.5 px-6 font-mono font-semibold text-brand-700">
                    {stu.rollNo || '—'}
                  </td>
                  <td className="py-3.5 px-6 font-mono">
                    {stu.semester ? `Sem ${stu.semester}` : '—'}{stu.section ? ` - ${stu.section}` : ''}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {stu.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
