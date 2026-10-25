import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Download,
  FileText,
  User,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ClipboardList,
  Bell,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import { useNotification } from '../../context/NotificationContext';

export default function CourseDetail({ courseId, onNavigate }) {
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'overview' | 'assignments' | 'announcements'
  const [expandedUnits, setExpandedUnits] = useState([]); // expanded unit numbers
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { addToast } = useNotification();

  useEffect(() => {
    async function loadCourse() {
      try {
        const res = await api.getCourse(courseId);
        if (res?.course) {
          setCourse(res.course);
          setExpandedUnits(res.course.units.map((u) => u.unitNumber));
        }
      } catch (err) {
        setLoadError(err.message || 'Could not load this course');
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [courseId]);

  const toggleUnit = (unitNumber) => {
    setExpandedUnits((prev) =>
      prev.includes(unitNumber) ? prev.filter((u) => u !== unitNumber) : [...prev, unitNumber]
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-cloud-500 text-xs">
        Loading departmental course records...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="cloud-card p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-cloud-900">Course unavailable</p>
        <p className="text-xs text-cloud-600">{loadError || 'Course not found.'}</p>
        <button
          onClick={() => onNavigate('/student/courses')}
          className="inline-flex items-center gap-1.5 text-xs text-brand-700 font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Courses
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Back Nav */}
      <button
        onClick={() => onNavigate('/student/courses')}
        className="inline-flex items-center gap-1.5 text-xs text-cloud-600 hover:text-cloud-900 font-medium cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Courses
      </button>

      {/* Course Hero Banner */}
      <div className="cloud-card p-6 bg-white border-cloud-200 shadow-sm relative">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 font-mono text-xs font-bold">
                {course.code}
              </span>
              <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
                {course.credits} Academic Credits
              </span>
              <span className="text-xs text-cloud-500">
                Semester {course.semester}{course.department ? <> &bull; {course.department}</> : null}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-cloud-900 tracking-tight">
              {course.title}
            </h1>

            <div className="flex items-center gap-4 mt-3 text-xs text-cloud-600">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-600" />
                <span>Instructor: <strong className="text-cloud-900">{course.facultyName || 'Not assigned'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-brand-600" />
                <span>{course.units.length} {course.units.length === 1 ? 'Unit' : 'Units'} with content</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-brand-600" />
                <span>{course.materials.length} {course.materials.length === 1 ? 'Material' : 'Materials'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onNavigate('/ai-search')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Ask AI about {course.code}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-4 border-t border-cloud-200 flex items-center gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('materials')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                : 'text-cloud-600 hover:bg-cloud-50'
            }`}
          >
            Unit Courseware ({course.materials?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                : 'text-cloud-600 hover:bg-cloud-50'
            }`}
          >
            Course Syllabus & Units
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                : 'text-cloud-600 hover:bg-cloud-50'
            }`}
          >
            Assignments ({course.assignments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-brand-50 text-brand-700 font-bold border border-brand-200'
                : 'text-cloud-600 hover:bg-cloud-50'
            }`}
          >
            Course Notices ({course.announcements?.length || 0})
          </button>
        </div>
      </div>

      {/* Tab: Unit Courseware Materials (as explicitly required in prompt) */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {course.units.length === 0 && (
            <div className="cloud-card p-8 text-center text-cloud-500 text-xs">
              No materials uploaded for this course yet.
            </div>
          )}
          {course.units.map((unit) => {
            const unitMaterials = course.materials.filter((m) => m.unitNumber === unit.unitNumber);
            const isExpanded = expandedUnits.includes(unit.unitNumber);

            return (
              <div key={unit.unitNumber} className="cloud-card overflow-hidden">
                {/* Unit Header Bar */}
                <div
                  onClick={() => toggleUnit(unit.unitNumber)}
                  className="px-6 py-4 bg-cloud-50/70 border-b border-cloud-200 flex items-center justify-between cursor-pointer hover:bg-cloud-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brand-100 text-brand-800 font-bold text-xs flex items-center justify-center">
                      U{unit.unitNumber}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-cloud-900">
                        Unit {unit.unitNumber}{unit.title ? `: ${unit.title}` : ''}
                      </h3>
                      <p className="text-[11px] text-cloud-500">
                        {unitMaterials.length} materials published
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-cloud-400 font-medium">
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-cloud-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-cloud-500" />
                    )}
                  </div>
                </div>

                {/* Unit Materials List */}
                {isExpanded && (
                  <div className="p-4 divide-y divide-cloud-100">
                    {unitMaterials.length === 0 ? (
                      <div className="p-4 text-center text-xs text-cloud-400">
                        No materials uploaded for this unit yet.
                      </div>
                    ) : (
                      unitMaterials.map((mat) => (
                        <div
                          key={mat.id}
                          onClick={() => setSelectedMaterial(mat)}
                          className="py-3 px-3 rounded-xl hover:bg-brand-50/30 flex items-center justify-between cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-semibold text-xs flex-shrink-0">
                              {mat.fileType}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-xs text-cloud-900 group-hover:text-brand-600 transition-colors truncate">
                                {mat.title}
                              </h4>
                              <p className="text-[11px] text-cloud-500 truncate">
                                Topic: {mat.topic} &bull; Uploaded {mat.uploadDate}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs text-cloud-400 font-mono hidden sm:inline">
                              {mat.size}
                            </span>
                            <button className="px-3 py-1 rounded-lg bg-white group-hover:bg-brand-600 group-hover:text-white border border-cloud-200 text-cloud-700 text-xs font-medium transition-colors shadow-2xs">
                              Open Document
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Course Syllabus & Units Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="cloud-card p-6">
            <h3 className="text-sm font-bold text-cloud-900 mb-2">Course Abstract</h3>
            <p className="text-xs text-cloud-700 leading-relaxed">
              {course.description || 'No course description has been added yet.'}
            </p>
          </div>

          <div className="space-y-3">
            {course.units?.map((u) => (
              <div key={u.unitNumber} className="cloud-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge-pill bg-brand-50 text-brand-700 font-bold text-xs">
                    Unit {u.unitNumber}
                  </span>
                  <h4 className="text-sm font-bold text-cloud-900">{u.title}</h4>
                </div>
                <p className="text-xs text-cloud-600 mt-1 leading-relaxed">
                  {u.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Assignments */}
      {activeTab === 'assignments' && (
        <div className="space-y-3">
          {course.assignments?.length === 0 ? (
            <div className="cloud-card p-8 text-center text-cloud-500 text-xs">
              No active assignments for this course.
            </div>
          ) : (
            course.assignments?.map((asg) => (
              <div key={asg.id} className="cloud-card p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-pill bg-amber-50 text-amber-800 text-[10px] font-semibold">
                      Due {new Date(asg.dueDate).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-cloud-500">Max: {asg.maxMarks} Marks</span>
                  </div>
                  <h4 className="text-sm font-bold text-cloud-900">{asg.title}</h4>
                  <p className="text-xs text-cloud-600 mt-1">{asg.description}</p>
                </div>
                <button
                  onClick={() => onNavigate('/student/assignments')}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex-shrink-0"
                >
                  Submit Solution
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-3">
          {course.announcements?.length === 0 ? (
            <div className="cloud-card p-8 text-center text-cloud-500 text-xs">
              No notices published for this course yet.
            </div>
          ) : (
            course.announcements?.map((anc) => (
              <div key={anc.id} className="cloud-card p-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="badge-pill bg-brand-50 text-brand-700 text-[10px] font-bold">
                    {anc.priority} Notice
                  </span>
                  <span className="text-[11px] text-cloud-400">
                    {new Date(anc.date).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-cloud-900">{anc.title}</h4>
                <p className="text-xs text-cloud-700 mt-2 leading-relaxed">{anc.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        material={selectedMaterial}
        isOpen={Boolean(selectedMaterial)}
        onClose={() => setSelectedMaterial(null)}
      />

    </div>
  );
}
