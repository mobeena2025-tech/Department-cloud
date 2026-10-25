import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  HardDrive,
  ShieldCheck,
  Sparkles,
  Lock,
  Building,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { api } from '../../services/api';
import { courseOptions, semesterOptions } from '../../services/filterOptions';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import { useNotification } from '../../context/NotificationContext';

export default function AdminMaterials({ onNavigate }) {
  const { addToast } = useNotification();
  const [materials, setMaterials] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMaterials = async () => {
    try {
      const res = await api.getMaterials();
      if (res?.materials) setMaterials(res.materials);
    } catch (err) {
      console.warn('Failed to load materials for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleArchive = async (id, title) => {
    if (!window.confirm(`HOD/Admin action: Archive "${title}" from the department repository?`)) {
      return;
    }

    try {
      const res = await api.deleteMaterial(id);
      if (res?.success) {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
        addToast(`Archived resource "${title}" with administrative audit entry.`, 'info', 'Resource Archived');
      }
    } catch (err) {
      addToast(err.message || 'Failed to archive resource', 'error', 'Error');
    }
  };

  const filtered = materials.filter((m) => {
    if (selectedCourse !== 'ALL' && m.courseId !== selectedCourse) return false;
    if (selectedSemester !== 'ALL' && m.semester !== Number(selectedSemester)) return false;
    if (selectedType !== 'ALL' && m.materialType?.toLowerCase() !== selectedType.toLowerCase()) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        (m.topic && m.topic.toLowerCase().includes(q)) ||
        (m.courseName && m.courseName.toLowerCase().includes(q)) ||
        (m.uploadedBy && m.uploadedBy.toLowerCase().includes(q))
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
            <h1 className="text-xl font-bold text-cloud-900">Department Materials Oversight</h1>
            <span className="badge-pill bg-purple-50 text-purple-700 border border-purple-200 text-[10px]">
              HOD / Admin Authority
            </span>
          </div>
          <p className="text-xs text-cloud-500 mt-0.5">
            Audit and govern all academic resources uploaded across all courses, semesters, and faculty members
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-cloud-50 border border-cloud-200 flex items-center gap-2 text-xs">
            <HardDrive className="w-4 h-4 text-brand-600" />
            <span className="text-cloud-700">Storage Used: <strong className="text-cloud-900">184.2 GB / 500 GB</strong></span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="cloud-card p-4 space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all departmental materials by title, faculty author, course, or topic..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-cloud-400 block mb-1">Filter by Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 text-xs text-cloud-700 bg-white"
            >
              <option value="ALL">All Assigned Courses</option>
              {courseOptions(materials).map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-cloud-400 block mb-1">Filter by Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 text-xs text-cloud-700 bg-white"
            >
              <option value="ALL">All Semesters</option>
              {semesterOptions(materials).map((n) => (
                <option key={n} value={n}>Semester {n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-cloud-400 block mb-1">Material Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 text-xs text-cloud-700 bg-white"
            >
              <option value="ALL">All Resource Types</option>
              <option value="PDF Notes">PDF Notes</option>
              <option value="PPT Presentation">PPT Presentation</option>
              <option value="Question Paper">Question Paper</option>
              <option value="Lab Material">Lab Material</option>
              <option value="Reference Document">Reference Document</option>
            </select>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="cloud-card overflow-hidden">
        <div className="px-6 py-3 border-b border-cloud-200 bg-cloud-50/70 flex items-center justify-between text-xs font-semibold text-cloud-500">
          <span>{filtered.length} Total Department Files Tracked</span>
          <span>Access Boundary: Institutional Read/Archive</span>
        </div>

        <div className="divide-y divide-cloud-100">
          {filtered.map((mat) => (
            <div
              key={mat.id}
              className="p-4 hover:bg-brand-50/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0 mt-0.5">
                  {mat.fileType || 'PDF'}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-xs text-cloud-900 truncate">
                      {mat.title}
                    </h3>
                    <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 text-[10px]">
                      {mat.materialType || 'PDF Notes'}
                    </span>
                    <span className="badge-pill bg-purple-50 text-purple-700 border border-purple-200 text-[10px]">
                      Sem {mat.semester ?? '—'}
                    </span>
                  </div>

                  <p className="text-[11px] text-cloud-500 mt-1">
                    <strong className="text-cloud-800">{mat.courseName}</strong> &bull; {mat.unitTitle} &bull; Uploaded by {mat.uploadedBy}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-cloud-400 mt-1 truncate">
                    <span className="text-brand-600">{mat.storagePath}</span>
                    <span>&bull;</span>
                    <span>{mat.size}</span>
                    <span>&bull;</span>
                    <span>{mat.downloads || 0} Downloads</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end lg:self-center flex-shrink-0">
                <button
                  onClick={() => setSelectedMaterial(mat)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-cloud-200 hover:bg-brand-50 hover:text-brand-700 text-cloud-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
                <button
                  onClick={() => handleArchive(mat.id, mat.title)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-cloud-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-cloud-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Archive</span>
                </button>
              </div>
            </div>
          ))}
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
