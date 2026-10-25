import React, { useState, useEffect } from 'react';
import { Shield, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import Avatar from '../../components/common/Avatar';

export default function FacultyProfile({ onNavigate }) {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([api.getCourses(), api.getUsers(), api.getMaterials()])
      .then(([c, u, m]) =>
        setStats({
          courses: c?.courses || [],
          students: (u?.users || []).length,
          materials: (m?.materials || []).filter((x) => x.uploadedById === currentUser?.id).length,
        })
      )
      .catch(() => setStats({ courses: [], students: 0, materials: 0 }));
  }, [currentUser?.id]);

  const card = (label, value, note, path) => (
    <button
      type="button"
      onClick={() => onNavigate?.(path)}
      className="cloud-card p-4 text-left hover:border-brand-300 hover:shadow-md transition-all cursor-pointer"
    >
      <span className="text-cloud-400 block mb-1">{label}</span>
      <span className="text-xl font-bold text-brand-700 font-mono">{stats ? value : '—'}</span>
      <span className="text-[10px] text-cloud-400 block mt-0.5 line-clamp-1">{stats ? note : ''}</span>
    </button>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-cloud-900">Faculty Profile</h1>
        <p className="text-xs text-cloud-500">Your account details and teaching load</p>
      </div>

      {/* Main Profile Card */}
      <div className="cloud-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Avatar name={currentUser?.name} size="lg" />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-cloud-900">{currentUser?.name}</h2>
            {currentUser?.designation && (
              <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold">
                {currentUser.designation}
              </span>
            )}
          </div>

          <p className="text-xs text-cloud-500 flex flex-wrap items-center gap-2">
            {currentUser?.empId && (
              <>
                <span>Employee ID: <strong className="text-cloud-800 font-mono">{currentUser.empId}</strong></span>
                &bull;
              </>
            )}
            <span>{currentUser?.department}</span>
          </p>

          <p className="text-xs text-cloud-500 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cloud-400" />
            <span>{currentUser?.email}</span>
          </p>
        </div>
      </div>

      {/* Teaching load (real counts; click to open) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {card('Assigned Courses', stats?.courses.length, stats?.courses.map((c) => c.code).join(', ') || 'None yet', '/faculty/courses')}
        {card('My Students', stats?.students, 'Enrolled in your courses', '/faculty/students')}
        {card('Materials I Uploaded', stats?.materials, 'PDF notes in your courses', '/faculty/materials')}
      </div>

      {/* What faculty can do */}
      <div className="cloud-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-cloud-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-600" />
          Your access
        </h3>
        <ul className="space-y-1.5 text-xs text-cloud-700 list-disc list-inside">
          <li>You can upload, edit and remove materials only for the courses assigned to you.</li>
          <li>You see submissions and students only for those courses.</li>
          <li>Uploaded PDFs are indexed so the Academic Assistant can answer from them.</li>
          <li>Course assignments are managed by the department admin.</li>
        </ul>
      </div>
    </div>
  );
}
