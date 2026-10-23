import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  Download,
  FileText,
  ExternalLink,
  BookOpen,
  Sparkles,
  Lock,
  HardDrive
} from 'lucide-react';
import { api } from '../../services/api';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';

export default function StudentMaterials({ onNavigate }) {
  const [materials, setMaterials] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMaterials() {
      try {
        const res = await api.getMaterials();
        if (res?.materials) setMaterials(res.materials);
      } finally {
        setLoading(false);
      }
    }
    loadMaterials();
  }, []);

  const filtered = materials.filter((m) => {
    if (selectedCourse !== 'ALL' && m.courseId !== selectedCourse) return false;
    if (selectedUnit !== 'ALL' && m.unitNumber !== Number(selectedUnit)) return false;
    if (selectedSemester !== 'ALL' && m.semester !== Number(selectedSemester)) return false;
    if (selectedType !== 'ALL' && m.materialType?.toLowerCase() !== selectedType.toLowerCase()) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        (m.topic && m.topic.toLowerCase().includes(q)) ||
        (m.courseName && m.courseName.toLowerCase().includes(q)) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(q)))
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
            <h1 className="text-xl font-bold text-cloud-900">Academic Cloud Materials</h1>
            <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 text-[10px]">
              Student Access Tier
            </span>
          </div>
          <p className="text-xs text-cloud-500 mt-0.5">
            Verified course notes, slides, lab manuals, and syllabus resources from department faculty
          </p>
        </div>

        <button
          onClick={() => onNavigate ? onNavigate('/assistant') : null}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ask Assistant for Notes
        </button>
      </div>

      {/* 4-Axis Filter Toolbar */}
      <div className="cloud-card p-4 space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, topic, keyword or tag (e.g. DBMS Unit 3, Normalization, Backpropagation)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* 4 Axis Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Subject */}
          <div>
            <label className="text-[10px] uppercase font-bold text-cloud-400 block mb-1">Subject / Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 text-xs text-cloud-700 bg-white"
            >
              <option value="ALL">All Subjects</option>
              <option value="CS202">CS202 - DBMS</option>
              <option value="AI204">AI204 - Neural Networks</option>
              <option value="CS301">CS301 - Computer Networks</option>
              <option value="AI302">AI302 - Data Science</option>
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="text-[10px] uppercase font-bold text-cloud-400 block mb-1">Curriculum Unit</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 text-xs text-cloud-700 bg-white"
            >
              <option value="ALL">All Units</option>
              <option value="1">Unit 1</option>
              <option value="2">Unit 2</option>
              <option value="3">Unit 3</option>
              <option value="4">Unit 4</option>
              <option value="5">Unit 5</option>
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="text-[10px] uppercase font-bold text-cloud-400 block mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 text-xs text-cloud-700 bg-white"
            >
              <option value="ALL">All Semesters</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
            </select>
          </div>

          {/* Material Type */}
          <div>
            <label className="text-[10px] uppercase font-bold text-cloud-400 block mb-1">Resource Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 text-xs text-cloud-700 bg-white"
            >
              <option value="ALL">All File Types</option>
              <option value="PDF Notes">PDF Notes</option>
              <option value="PPT Presentation">PPT Presentation</option>
              <option value="Question Paper">Question Paper</option>
              <option value="Lab Material">Lab Material</option>
              <option value="Reference Document">Reference Document</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Table / List */}
      <div className="cloud-card overflow-hidden">
        <div className="px-6 py-3 border-b border-cloud-200 bg-cloud-50/70 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-cloud-500">
          <div className="flex items-center gap-2">
            <span>Displaying {filtered.length} Resources</span>
            <span className="text-cloud-300">&bull;</span>
            <span className="text-emerald-700 font-normal">Pre-signed Download Ready</span>
          </div>
          <span className="text-[11px] text-cloud-400">Access Clearance: Enrolled Student</span>
        </div>

        <div className="divide-y divide-cloud-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-cloud-500">
              No matching departmental materials found for selected filters.
            </div>
          ) : (
            filtered.map((mat) => (
              <div
                key={mat.id}
                onClick={() => setSelectedMaterial(mat)}
                className="p-4 hover:bg-brand-50/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0 mt-0.5">
                    {mat.fileType || 'PDF'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-xs text-cloud-900 group-hover:text-brand-600 transition-colors truncate">
                        {mat.title}
                      </h3>
                      <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 text-[10px]">
                        {mat.materialType || 'PDF Notes'}
                      </span>
                      <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                        Sem {mat.semester || 6}
                      </span>
                    </div>

                    <p className="text-[11px] text-cloud-500 mt-0.5 truncate">
                      <strong className="text-cloud-800">{mat.courseName}</strong> &bull; {mat.unitTitle} &bull; Topic: {mat.topic}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-cloud-400 mt-1 truncate">
                      <span className="text-brand-600">{mat.storageKey}</span>
                      <span>&bull;</span>
                      <span>{mat.size}</span>
                      <span>&bull;</span>
                      <span>Uploaded by {mat.uploadedBy}</span>
                    </div>

                    {mat.tags && mat.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {mat.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="badge-pill bg-cloud-100 text-cloud-600 text-[10px]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-center">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-mono text-cloud-500">{mat.size}</div>
                    <div className="text-[10px] text-cloud-400">{mat.uploadDate}</div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-white group-hover:bg-brand-600 group-hover:text-white border border-cloud-200 text-cloud-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer">
                    Inspect Notes
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        material={selectedMaterial}
        isOpen={Boolean(selectedMaterial)}
        onClose={() => setSelectedMaterial(null)}
      />

    </div>
  );
}
