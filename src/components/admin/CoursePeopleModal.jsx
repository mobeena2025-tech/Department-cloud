import React, { useState, useEffect, useCallback } from 'react';
import { X, Users, Briefcase, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

// Admin window for one course: assign/remove faculty, enroll/remove students.
export default function CoursePeopleModal({ course, onClose, onChanged }) {
  const { addToast } = useNotification();
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [facultyToAdd, setFacultyToAdd] = useState('');
  const [studentsToAdd, setStudentsToAdd] = useState([]);
  const [studentFilter, setStudentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [people, f, s] = await Promise.all([
        api.getCoursePeople(course.id),
        api.getUsers({ role: 'faculty' }),
        api.getUsers({ role: 'student' }),
      ]);
      setFaculty(people.faculty || []);
      setStudents(people.students || []);
      setAllFaculty(f.users || []);
      setAllStudents(s.users || []);
    } catch (err) {
      addToast(err.message || 'Could not load people for this course', 'error', 'Course People');
    } finally {
      setLoading(false);
    }
  }, [course.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Run a change, then reload the lists and tell the parent page.
  const run = async (action, successMessage) => {
    setBusy(true);
    try {
      await action();
      addToast(successMessage, 'success', course.code);
      await load();
      if (onChanged) onChanged();
    } catch (err) {
      addToast(err.message, 'error', course.code);
    } finally {
      setBusy(false);
    }
  };

  const teachingIds = new Set(faculty.map((p) => p.id));
  const enrolledIds = new Set(students.map((p) => p.id));
  const facultyOptions = allFaculty.filter((p) => !teachingIds.has(p.id));
  const q = studentFilter.trim().toLowerCase();
  const studentOptions = allStudents
    .filter((p) => !enrolledIds.has(p.id))
    .filter((p) => !q || [p.name, p.email, p.rollNo].some((v) => v && v.toLowerCase().includes(q)));

  const toggleStudent = (id) =>
    setStudentsToAdd((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const personRow = (p, onRemove, removeLabel) => (
    <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-cloud-200 bg-white">
      <div className="min-w-0">
        <div className="font-semibold text-cloud-900 truncate">{p.name}</div>
        <div className="text-[11px] text-cloud-500 truncate">
          {p.email}
          {p.rollNo ? ` • ${p.rollNo}` : ''}
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onRemove}
        title={removeLabel}
        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cloud-200 bg-cloud-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-cloud-900">
                {course.code} — Manage People
              </h3>
              <p className="text-[11px] text-cloud-500">{course.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-cloud-400 hover:text-cloud-600 p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-cloud-500">Loading...</div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs overflow-y-auto">
            {/* Faculty */}
            <section className="space-y-3">
              <h4 className="font-bold text-cloud-900 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                Teaching Faculty ({faculty.length})
              </h4>
              <p className="text-[11px] text-cloud-500">
                Faculty listed here can upload materials, post notices, create assignments and grade in this course.
              </p>
              <div className="space-y-2">
                {faculty.length === 0 && <p className="text-cloud-400">No faculty assigned yet.</p>}
                {faculty.map((p) =>
                  personRow(
                    p,
                    () => run(() => api.removeFaculty(course.id, p.id), `${p.name} no longer teaches ${course.code}`),
                    'Remove from this course'
                  )
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={facultyToAdd}
                  onChange={(e) => setFacultyToAdd(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-cloud-200 bg-white text-cloud-900"
                >
                  <option value="">Choose faculty...</option>
                  {facultyOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!facultyToAdd || busy}
                  onClick={() => {
                    const p = allFaculty.find((x) => x.id === facultyToAdd);
                    run(() => api.assignFaculty(course.id, facultyToAdd), `${p?.name} now teaches ${course.code}`);
                    setFacultyToAdd('');
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign
                </button>
              </div>
            </section>

            {/* Students */}
            <section className="space-y-3">
              <h4 className="font-bold text-cloud-900 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-brand-600" />
                Enrolled Students ({students.length})
              </h4>
              <p className="text-[11px] text-cloud-500">
                Only enrolled students can see this course and open its files.
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {students.length === 0 && <p className="text-cloud-400">No students enrolled yet.</p>}
                {students.map((p) =>
                  personRow(
                    p,
                    () => run(() => api.unenrollStudent(course.id, p.id), `${p.name} removed from ${course.code}`),
                    'Remove from this course'
                  )
                )}
              </div>

              <div className="p-3 rounded-xl border border-cloud-200 bg-cloud-50 space-y-2">
                <div className="font-semibold text-cloud-800">Enroll students</div>
                <input
                  type="text"
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  placeholder="Search name, email or roll number"
                  className="w-full px-3 py-1.5 rounded-lg border border-cloud-200 bg-white text-cloud-900"
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {studentOptions.length === 0 && (
                    <p className="text-cloud-400">
                      {allStudents.length ? 'Everyone matching is already enrolled.' : 'No student accounts yet.'}
                    </p>
                  )}
                  {studentOptions.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={studentsToAdd.includes(p.id)}
                        onChange={() => toggleStudent(p.id)}
                      />
                      <span className="text-cloud-800">{p.name}</span>
                      <span className="text-cloud-400 truncate">{p.rollNo || p.email}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={!studentsToAdd.length || busy}
                  onClick={() => {
                    const ids = studentsToAdd;
                    run(() => api.enrollStudents(course.id, ids), `Enrolled ${ids.length} student(s) in ${course.code}`);
                    setStudentsToAdd([]);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Enroll {studentsToAdd.length || ''} selected
                </button>
              </div>
            </section>
          </div>
        )}

        <div className="px-6 py-3 border-t border-cloud-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-cloud-200 text-cloud-700 hover:bg-cloud-100 text-xs font-medium cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
