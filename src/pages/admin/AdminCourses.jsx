import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import CoursePeopleModal from '../../components/admin/CoursePeopleModal';

const EMPTY_COURSE = {
  code: '',
  title: '',
  department: 'AI & DS',
  semester: 6,
  credits: 3,
  facultyId: '',
  description: '',
};

export default function AdminCourses({ onNavigate }) {
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourse, setNewCourse] = useState(EMPTY_COURSE);
  const [facultyList, setFacultyList] = useState([]);
  const [managingCourse, setManagingCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useNotification();

  const loadCourses = async () => {
    try {
      const res = await api.getCourses();
      if (res?.courses) setCourses(res.courses);
    } catch {}
  };

  useEffect(() => {
    loadCourses();
    api.getUsers({ role: 'faculty' })
      .then((res) => setFacultyList(res?.users || []))
      .catch(() => {});
  }, []);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCourse({ ...newCourse, facultyId: newCourse.facultyId || undefined });
      addToast(`Course "${newCourse.code.toUpperCase()}: ${newCourse.title}" created.`, 'success', 'Course Created');
      setShowAddModal(false);
      setNewCourse(EMPTY_COURSE);
      await loadCourses();
    } catch (err) {
      addToast(err.message, 'error', 'Creation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = courses.filter((c) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.facultyName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cloud-900">Department Course Catalog</h1>
          <p className="text-xs text-cloud-500">
            Autonomous curriculum specifications, credit structures, and faculty appointments
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          Add Department Course
        </button>
      </div>

      {/* Search */}
      <div className="cloud-card p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by course code, title, or instructor..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((course) => (
          <div key={course.id} className="cloud-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 font-mono text-xs font-bold">
                  {course.code}
                </span>
                <span className="text-xs font-semibold text-cloud-700 bg-cloud-100 px-2 py-0.5 rounded-md">
                  {course.credits} Credits &bull; Sem {course.semester}
                </span>
              </div>

              <h3 className="text-base font-bold text-cloud-900">{course.title}</h3>
              <p className="text-xs text-cloud-600 mt-2 line-clamp-2 leading-relaxed">{course.description}</p>

              <div className="mt-4 pt-3 border-t border-cloud-100 space-y-1.5 text-xs text-cloud-600">
                <div className="flex justify-between">
                  <span className="text-cloud-400">Course Lead:</span>
                  <span className="font-medium text-cloud-900">{course.facultyName || 'Not assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud-400">Enrolled Students:</span>
                  <span className="font-bold text-cloud-800 font-mono">{course.enrolledCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cloud-400">Published Resources:</span>
                  <span className="font-bold text-brand-700 font-mono">{course.materialsCount} Documents</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-cloud-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setManagingCourse(course)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold border border-brand-200 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                Manage People
              </button>
              <button
                onClick={() => onNavigate(`/courses/${course.id}`)}
                className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>View Repository</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cloud-200 bg-cloud-50">
              <h3 className="text-sm font-bold text-cloud-900">Provision Department Course</h3>
              <button onClick={() => setShowAddModal(false)} className="text-cloud-400 hover:text-cloud-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-cloud-700 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    value={newCourse.code}
                    onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-cloud-700 mb-1">Academic Credits</label>
                  <input
                    type="number"
                    min={0.5}
                    max={10}
                    step={0.5}
                    required
                    value={newCourse.credits}
                    onChange={(e) => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-cloud-700 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-cloud-700 mb-1">Semester</label>
                  <select
                    value={newCourse.semester}
                    onChange={(e) => setNewCourse({ ...newCourse, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>Semester {n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-cloud-700 mb-1">Faculty In-Charge</label>
                  <select
                    value={newCourse.facultyId}
                    onChange={(e) => setNewCourse({ ...newCourse, facultyId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 bg-white"
                  >
                    <option value="">Assign later</option>
                    {facultyList.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-cloud-700 mb-1">Course Description</label>
                <textarea
                  rows={3}
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900"
                />
              </div>

              <div className="pt-3 border-t border-cloud-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-cloud-200 text-cloud-700 hover:bg-cloud-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold"
                >
                  {submitting ? 'Creating...' : 'Provision Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage faculty and enrollments for one course */}
      {managingCourse && (
        <CoursePeopleModal
          course={managingCourse}
          onClose={() => setManagingCourse(null)}
          onChanged={loadCourses}
        />
      )}

    </div>
  );
}
