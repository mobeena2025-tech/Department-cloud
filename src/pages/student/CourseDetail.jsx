import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, User, Layers, ChevronDown, ChevronRight, FileText, Sparkles, Target, Library } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';

// One course: its syllabus unit by unit (weeks for labs), with the notes
// uploaded for each unit inside that unit's card.
export default function CourseDetail({ courseId, onNavigate }) {
  const { currentUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('syllabus'); // 'syllabus' | 'assignments' | 'announcements'
  const [collapsed, setCollapsed] = useState([]); // unit numbers the user closed
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getCourse(courseId)
      .then((res) => setCourse(res?.course || null))
      .catch((err) => setLoadError(err.message || 'Could not load this course'))
      .finally(() => setLoading(false));
  }, [courseId]);

  const backPath = { faculty: '/faculty/courses', admin: '/admin/courses' }[currentUser?.role] || '/student/courses';
  const back = (
    <button
      onClick={() => onNavigate(backPath)}
      className="inline-flex items-center gap-1.5 text-xs text-cloud-600 hover:text-cloud-900 font-medium cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Courses
    </button>
  );

  if (loading) return <div className="p-8 text-center text-cloud-500 text-xs">Loading course...</div>;

  if (!course) {
    return (
      <div className="cloud-card p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-cloud-900">Course unavailable</p>
        <p className="text-xs text-cloud-600">{loadError || 'Course not found.'}</p>
        {back}
      </div>
    );
  }

  const syllabus = course.syllabus;
  const isWeekly = course.periodType === 'week';
  const word = isWeekly ? 'Week' : 'Unit';
  // Units/weeks from the syllabus; courses without one get plain numbers.
  const periods = syllabus?.units || syllabus?.weeks || course.periods || [];
  const otherMaterials = course.materials.filter((m) => m.unitNumber === null);
  const toggle = (n) => setCollapsed((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));

  const materialRow = (mat) => (
    <button
      key={mat.id}
      onClick={() => setSelectedMaterial(mat)}
      className="w-full text-left py-2.5 px-3 rounded-xl hover:bg-brand-50/40 flex items-center justify-between gap-3 cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-semibold text-[10px] flex-shrink-0">
          {mat.fileType}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-xs text-cloud-900 group-hover:text-brand-700 truncate">{mat.title}</div>
          <div className="text-[11px] text-cloud-500 truncate">
            {mat.topic ? <>{mat.topic} &bull; </> : null}{mat.size} &bull; {mat.uploadDate}
          </div>
        </div>
      </div>
      <span className="px-3 py-1 rounded-lg border border-cloud-200 text-cloud-700 text-[11px] font-medium group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 transition-colors flex-shrink-0">
        Open
      </span>
    </button>
  );

  const tabButton = (key, label) => (
    <button
      onClick={() => setActiveTab(key)}
      className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
        activeTab === key ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200' : 'text-cloud-600 hover:bg-cloud-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      {back}

      {/* Course header */}
      <div className="cloud-card p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 font-mono text-xs font-bold">{course.code}</span>
              {course.officialCode && <span className="text-xs text-cloud-500 font-mono">{course.officialCode}</span>}
              <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">{course.credits} Credits</span>
              {syllabus?.elective && (
                <span className="badge-pill bg-amber-50 text-amber-700 border border-amber-200 text-xs">Professional Elective</span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-cloud-900 tracking-tight">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-cloud-600">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-600" />
                Faculty: <strong className="text-cloud-900">{course.facultyName || 'Not assigned'}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" />
                {periods.length} {word.toLowerCase()}s
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-brand-600" />
                {course.materials.length} {course.materials.length === 1 ? 'material' : 'materials'}
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('/assistant')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs cursor-pointer self-start"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask the Assistant
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-cloud-200 flex flex-wrap items-center gap-2 text-xs font-medium">
          {tabButton('syllabus', 'Syllabus & Materials')}
          {tabButton('assignments', `Assignments (${course.assignments?.length || 0})`)}
          {tabButton('announcements', `Notices (${course.announcements?.length || 0})`)}
        </div>
      </div>

      {/* Syllabus, unit by unit, with each unit's materials */}
      {activeTab === 'syllabus' && (
        <div className="space-y-4">
          {syllabus?.description && (
            <div className="cloud-card p-5 text-xs text-cloud-700 leading-relaxed">{syllabus.description}</div>
          )}
          {syllabus?.schedule && (
            <div className="cloud-card p-5">
              <h3 className="text-sm font-bold text-cloud-900 mb-3">Project schedule</h3>
              <ul className="space-y-2">
                {syllabus.schedule.map((step) => (
                  <li key={step.title} className="flex gap-3 text-xs text-cloud-700">
                    <span className="badge-pill bg-brand-50 text-brand-700 font-bold flex-shrink-0">
                      {step.weeks === 'after' ? 'Final weeks' : `Week ${step.weeks}`}
                    </span>
                    <span>{step.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {periods.map((p) => {
            const mats = course.materials.filter((m) => m.unitNumber === p.number);
            const open = !collapsed.includes(p.number);
            return (
              <div key={p.number} className="cloud-card overflow-hidden">
                <button
                  onClick={() => toggle(p.number)}
                  className="w-full text-left px-5 py-4 bg-cloud-50/70 border-b border-cloud-200 flex items-start justify-between gap-3 cursor-pointer hover:bg-cloud-100/60 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-brand-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {word[0]}{p.number}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-brand-700 uppercase tracking-wider">{word} {p.number}</div>
                      <h3 className="text-sm font-bold text-cloud-900">
                        {p.title || (isWeekly ? 'Project work' : `Unit ${p.number}`)}
                      </h3>
                      <p className="text-[11px] text-cloud-500 mt-0.5">
                        {mats.length ? `${mats.length} ${mats.length === 1 ? 'material' : 'materials'}` : 'No materials yet'}
                      </p>
                    </div>
                  </div>
                  {open ? <ChevronDown className="w-4 h-4 text-cloud-500 mt-1 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-cloud-500 mt-1 flex-shrink-0" />}
                </button>

                {open && (
                  <div className="p-5 space-y-3">
                    {p.topics && (
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-cloud-400 mb-1">Topics</div>
                        <p className="text-xs text-cloud-700 leading-relaxed">{p.topics}</p>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-cloud-400 mb-1">Materials</div>
                      {mats.length ? (
                        <div className="divide-y divide-cloud-100 -mx-3">{mats.map(materialRow)}</div>
                      ) : (
                        <p className="text-xs text-cloud-400">Nothing uploaded for this {word.toLowerCase()} yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {otherMaterials.length > 0 && (
            <div className="cloud-card overflow-hidden">
              <div className="px-5 py-4 bg-cloud-50/70 border-b border-cloud-200 flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-cloud-200 text-cloud-700 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-cloud-900">Other materials</h3>
                  <p className="text-[11px] text-cloud-500">Not tied to one {word.toLowerCase()} (question banks, references…)</p>
                </div>
              </div>
              <div className="p-2 divide-y divide-cloud-100">{otherMaterials.map(materialRow)}</div>
            </div>
          )}

          {syllabus?.outcomes?.length > 0 && (
            <div className="cloud-card p-5">
              <h3 className="text-sm font-bold text-cloud-900 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-brand-600" />
                Course outcomes
              </h3>
              <p className="text-[11px] text-cloud-500 mb-2">After this course, students will be able to:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-cloud-700">
                {syllabus.outcomes.map((o) => <li key={o}>{o}</li>)}
              </ol>
            </div>
          )}

          {syllabus?.textbooks?.length > 0 && (
            <div className="cloud-card p-5">
              <h3 className="text-sm font-bold text-cloud-900 mb-2 flex items-center gap-2">
                <Library className="w-4 h-4 text-brand-600" />
                Textbooks
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-xs text-cloud-700">
                {syllabus.textbooks.map((t) => <li key={t}>{t}</li>)}
              </ol>
            </div>
          )}

          {syllabus && (
            <p className="text-[11px] text-cloud-400">From the AI &amp; DS Semester V syllabus (AY 2024-25).</p>
          )}
        </div>
      )}

      {/* Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-3">
          {!course.assignments?.length ? (
            <div className="cloud-card p-8 text-center text-cloud-500 text-xs">No assignments for this course yet.</div>
          ) : (
            course.assignments.map((asg) => (
              <div key={asg.id} className="cloud-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="badge-pill bg-amber-50 text-amber-800 text-[10px] font-semibold">
                      Due {new Date(asg.dueDate).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-cloud-500">{asg.maxMarks} marks &bull; {asg.unitTitle}</span>
                  </div>
                  <h4 className="text-sm font-bold text-cloud-900">{asg.title}</h4>
                  {asg.description && <p className="text-xs text-cloud-600 mt-1">{asg.description}</p>}
                </div>
                <button
                  onClick={() => {
                    if (currentUser?.role === 'student') return onNavigate('/student/assignments');
                    try { sessionStorage.setItem('dac_grade_assignment', asg.id); } catch { /* optional */ }
                    onNavigate('/faculty/submissions');
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs cursor-pointer flex-shrink-0"
                >
                  {currentUser?.role === 'student' ? 'Submit' : 'Grade submissions'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Notices */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          {!course.announcements?.length ? (
            <div className="cloud-card p-8 text-center text-cloud-500 text-xs">No notices for this course yet.</div>
          ) : (
            course.announcements.map((anc) => (
              <div key={anc.id} className="cloud-card p-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="badge-pill bg-brand-50 text-brand-700 text-[10px] font-bold">{anc.priority}</span>
                  <span className="text-[11px] text-cloud-400">{new Date(anc.date).toLocaleDateString()}</span>
                </div>
                <h4 className="text-sm font-bold text-cloud-900">{anc.title}</h4>
                <p className="text-xs text-cloud-700 mt-2 leading-relaxed">{anc.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      <DocumentPreviewModal
        material={selectedMaterial}
        isOpen={Boolean(selectedMaterial)}
        onClose={() => setSelectedMaterial(null)}
      />
    </div>
  );
}
