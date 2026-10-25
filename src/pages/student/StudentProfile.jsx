import React, { useState, useEffect } from 'react';
import { Shield, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { markElectives, courseMixLabel } from '../../services/courseKinds';
import Avatar from '../../components/common/Avatar';

export default function StudentProfile() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState(null);

  useEffect(() => {
    api.getCourses()
      .then((res) => setCourses(markElectives(res?.courses || [])))
      .catch(() => setCourses([]));
  }, [currentUser?.id]);

  const credits = (courses || []).reduce((sum, c) => sum + (c.credits || 0), 0);
  const electives = (courses || []).filter((c) => c.isElective);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-cloud-900">Academic Profile</h1>
        <p className="text-xs text-cloud-500">Your account details and enrolled courses</p>
      </div>

      {/* Main Profile Card */}
      <div className="cloud-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Avatar name={currentUser?.name} size="lg" />

        <div className="flex-1 min-w-0 space-y-1">
          <h2 className="text-lg font-bold text-cloud-900">{currentUser?.name}</h2>

          <p className="text-xs text-cloud-500 flex flex-wrap items-center gap-2">
            <span>Roll: <strong className="text-cloud-800 font-mono">{currentUser?.rollNo || '—'}</strong></span>
            {currentUser?.department && (
              <>
                &bull;
                <span>{currentUser.department}</span>
              </>
            )}
          </p>

          <p className="text-xs text-cloud-500 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cloud-400" />
            <span>{currentUser?.email}</span>
          </p>
        </div>
      </div>

      {/* Academic details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Semester & Section</span>
          <span className="text-xl font-bold text-cloud-900 font-mono">
            {currentUser?.semester ? `Sem ${currentUser.semester}` : '—'}
            {currentUser?.section ? ` - ${currentUser.section}` : ''}
          </span>
        </div>
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Enrolled Courses</span>
          <span className="text-xl font-bold text-brand-700 font-mono">{courses ? courses.length : '—'}</span>
          <span className="text-[10px] text-cloud-400 block mt-0.5">{courses ? courseMixLabel(courses) : ''}</span>
        </div>
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Credits This Semester</span>
          <span className="text-xl font-bold text-cloud-900 font-mono">{courses ? credits : '—'}</span>
        </div>
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Elective</span>
          <span className="text-sm font-bold text-amber-700 block mt-1">
            {courses ? (electives.map((c) => c.code).join(', ') || 'None') : '—'}
          </span>
          <span className="text-[10px] text-cloud-400 block mt-0.5 line-clamp-1">
            {electives.map((c) => c.title).join(', ')}
          </span>
        </div>
      </div>

      {/* What students can see */}
      <div className="cloud-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-cloud-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-600" />
          Your access
        </h3>
        <ul className="space-y-1.5 text-xs text-cloud-700 list-disc list-inside">
          <li>You can open materials and assignments only for the courses you are enrolled in.</li>
          <li>Only you and your course faculty can see your submissions.</li>
          <li>Course enrollments are managed by the department admin.</li>
        </ul>
      </div>
    </div>
  );
}
