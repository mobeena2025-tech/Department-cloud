import React, { useState, useEffect } from 'react';
import { BookOpen, User, Layers, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { markElectives, courseMixLabel } from '../../services/courseKinds';

export default function StudentCourses({ onNavigate }) {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await api.getCourses();
        if (res?.courses) setCourses(markElectives(res.courses));
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cloud-900">Enrolled Courses</h1>
          <p className="text-xs text-cloud-500">
            {currentUser?.semester ? `Semester ${currentUser.semester}` : 'Your courses'}
            {currentUser?.section ? `, Section ${currentUser.section}` : ''}
            {!loading && courses.length ? ` • ${courses.length} courses (${courseMixLabel(courses)})` : ''}
          </p>
        </div>
        <button
          onClick={() => onNavigate('/ai-search')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Semantic Course Search
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {courses.map((c) => (
          <div
            key={c.id}
            onClick={() => onNavigate(`/courses/${c.id}`)}
            className="cloud-card p-6 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5">
                  <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 font-mono text-xs font-bold">
                    {c.code}
                  </span>
                  {c.isElective && (
                    <span className="badge-pill bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                      Elective
                    </span>
                  )}
                </span>
                <span className="text-xs font-semibold text-cloud-700 bg-cloud-100 px-2.5 py-1 rounded-full">
                  {c.credits} Credits
                </span>
              </div>

              <h3 className="text-base font-bold text-cloud-900 group-hover:text-brand-600 transition-colors">
                {c.title}
              </h3>

              <p className="text-xs text-cloud-600 mt-2 line-clamp-2 leading-relaxed">
                {c.description}
              </p>

              <div className="mt-4 pt-3 border-t border-cloud-100 space-y-2 text-xs text-cloud-600">
                <div className="flex items-center justify-between">
                  <span className="text-cloud-400">Faculty In-charge:</span>
                  <span className="font-medium text-cloud-900">{c.facultyName || 'Not assigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cloud-400">Syllabus Breakdown:</span>
                  <span className="font-medium text-cloud-900">{c.units.length} Units &bull; {c.materialsCount} Documents</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-cloud-400">Academic Standing:</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Good Standing
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-cloud-100 flex items-center justify-between text-xs">
              <span className="text-cloud-500 font-medium">Click to view unit notes & assignments</span>
              <span className="text-brand-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Open Repository</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
