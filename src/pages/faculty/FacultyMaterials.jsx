import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Upload,
  Search,
  Filter,
  FileText,
  Trash2,
  Download,
  Eye,
  Plus,
  Edit2,
  HardDrive,
  CheckCircle2,
  X,
  Lock,
  Tag
} from 'lucide-react';
import { api } from '../../services/api';
import { courseOptions, semesterOptions } from '../../services/filterOptions';
import { periodLabelOptions, periodChoices, periodWord, toApiPeriod } from '../../services/periods';
import UploadMaterialModal from '../../components/faculty/UploadMaterialModal';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function FacultyMaterials({ onNavigate }) {
  const { currentUser } = useAuth();
  const { addToast } = useNotification();

  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]); // for each course's units / weeks
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    topic: '',
    unitNumber: 1,
    summary: '',
  });

  const loadMaterials = async () => {
    try {
      const res = await api.getMaterials();
      if (res?.materials) setMaterials(res.materials);
    } catch (err) {
      console.warn('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
    api.getCourses().then((res) => setCourses(res?.courses || [])).catch(() => {});
  }, []);

  const openEditModal = (mat) => {
    setEditingMaterial(mat);
    setEditForm({
      title: mat.title || '',
      topic: mat.topic || '',
      unitNumber: mat.unitNumber === null ? 'other' : String(mat.unitNumber || 1),
      summary: mat.summary || '',
    });
  };

  const editCourse = courses.find((c) => c.id === editingMaterial?.courseId);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMaterial) return;

    try {
      const payload = {
        title: editForm.title,
        topic: editForm.topic,
        summary: editForm.summary,
        unitNumber: toApiPeriod(editForm.unitNumber),
      };

      const res = await api.updateMaterial(editingMaterial.id, payload);
      if (res?.success) {
        setMaterials((prev) =>
          prev.map((m) => (m.id === editingMaterial.id ? res.material : m))
        );
        addToast(`Updated metadata for "${res.material.title}"`, 'success', 'Metadata Saved');
        setEditingMaterial(null);
      }
    } catch (err) {
      addToast(err.message || 'Failed to update material metadata', 'error', 'Error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to archive / remove "${title}" from the department repository?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await api.deleteMaterial(id);
      if (res?.success) {
        setMaterials((prev) => prev.filter((m) => m.id !== id));
        addToast(`Archived "${title}" from department cloud repository.`, 'info', 'Resource Archived');
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete material', 'error', 'Error');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = materials.filter((m) => {
    if (selectedCourse !== 'ALL' && m.courseId !== selectedCourse) return false;
    if (selectedUnit !== 'ALL' && m.unitTitle !== selectedUnit) return false;
    if (selectedSemester !== 'ALL' && m.semester !== Number(selectedSemester)) return false;
    if (selectedType !== 'ALL' && m.materialType?.toLowerCase() !== selectedType.toLowerCase()) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        (m.topic && m.topic.toLowerCase().includes(q)) ||
        (m.courseName && m.courseName.toLowerCase().includes(q)) ||
        (m.courseCode && m.courseCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-cloud-900">Academic Material Management</h1>
            <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 text-[10px]">
              Faculty Repository Control
            </span>
          </div>
          <p className="text-xs text-cloud-500 mt-0.5">
            Publish, edit metadata, and manage course notes, PPTs, question papers, and lab manuals
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload New Material
          </button>
        </div>
      </div>

      {/* 4-Axis Filter and Search Bar */}
      <div className="cloud-card p-4 space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search uploaded materials by title, topic, or course..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* 4-Axis Selectors */}
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
              {courseOptions(materials).map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="text-[10px] uppercase font-bold text-cloud-400 block mb-1">Unit / Week</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 text-xs text-cloud-700 bg-white"
            >
              <option value="ALL">All Units &amp; Weeks</option>
              {periodLabelOptions(materials).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
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
              {semesterOptions(materials).map((n) => (
                <option key={n} value={n}>Semester {n}</option>
              ))}
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

      {/* Materials Table */}
      <div className="cloud-card overflow-hidden">
        <div className="px-6 py-3 border-b border-cloud-200 bg-cloud-50/70 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-cloud-500">
          <div className="flex items-center gap-2">
            <span>{filtered.length} Academic Resources Cataloged</span>
            <span className="text-cloud-300">&bull;</span>
            <span className="text-emerald-700 font-normal">Private S3 Key Assigned</span>
          </div>
          <span className="text-[11px] text-cloud-400">Indexed for Semantic Assistant</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-cloud-500 text-xs">
            No materials found matching current filters.
          </div>
        ) : (
          <div className="divide-y divide-cloud-100">
            {filtered.map((mat) => (
              <div
                key={mat.id}
                className="p-4 hover:bg-brand-50/20 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0 mt-0.5">
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
                      <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                        {mat.accessPermissions || 'Enrolled Only'}
                      </span>
                    </div>

                    <p className="text-[11px] text-cloud-500 mt-1">
                      <strong className="text-cloud-800">{mat.courseName}</strong> &bull; {mat.unitTitle} &bull; Semester {mat.semester ?? '—'}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-cloud-400 mt-1 truncate">
                      <span className="text-brand-600 font-medium">{mat.storagePath}</span>
                      <span>&bull;</span>
                      <span>{mat.size}</span>
                      {mat.indexStatus && mat.fileType === 'PDF' && (
                        <>
                          <span>&bull;</span>
                          <span
                            className={
                              mat.indexStatus === 'indexed'
                                ? 'text-emerald-700'
                                : mat.indexStatus === 'failed' || mat.indexStatus === 'no_text'
                                  ? 'text-amber-700'
                                  : 'text-cloud-500'
                            }
                            title="Whether the Assistant can search inside this PDF"
                          >
                            {{
                              indexed: 'Searchable by Assistant',
                              pending: 'Waiting to be indexed',
                              indexing: 'Indexing…',
                              no_text: 'Scanned PDF: no searchable text',
                              failed: 'Indexing failed',
                            }[mat.indexStatus] || mat.indexStatus}
                          </span>
                        </>
                      )}
                    </div>

                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end lg:self-center flex-shrink-0">
                  <button
                    onClick={() => setSelectedMaterial(mat)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-cloud-200 hover:bg-brand-50 hover:text-brand-700 text-cloud-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="View preview and metadata"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>

                  <button
                    onClick={() => openEditModal(mat)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-cloud-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-cloud-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Edit resource metadata"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Edit Metadata</span>
                  </button>

                  <button
                    onClick={() => handleDelete(mat.id, mat.title)}
                    disabled={deletingId === mat.id}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-cloud-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-cloud-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="Archive / Remove resource"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>{deletingId === mat.id ? 'Archiving...' : 'Archive'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Metadata Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 bg-cloud-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-cloud-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-cloud-200 bg-cloud-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-cloud-900">Edit Resource Metadata</h3>
                <p className="text-[11px] text-cloud-500">Change the title, unit or topic.</p>
              </div>
              <button
                onClick={() => setEditingMaterial(null)}
                className="p-1 rounded-lg hover:bg-cloud-200 text-cloud-400 hover:text-cloud-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-cloud-700 block mb-1">Resource Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-cloud-200 text-cloud-900"
                  required
                />
              </div>

              <div>
                <div>
                  <label className="font-semibold text-cloud-700 block mb-1">{periodWord(editCourse)}</label>
                  <select
                    value={editForm.unitNumber}
                    onChange={(e) => setEditForm({ ...editForm, unitNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-cloud-200 text-cloud-900 bg-white"
                  >
                    {periodChoices(editCourse).map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-cloud-700 block mb-1">Syllabus Topic</label>
                <input
                  type="text"
                  value={editForm.topic}
                  onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-cloud-200 text-cloud-900"
                />
              </div>

              <div className="pt-3 border-t border-cloud-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-3 py-1.5 rounded-lg border border-cloud-200 text-cloud-700 hover:bg-cloud-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadMaterialModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={(newMat) => {
          setMaterials((prev) => [newMat, ...prev]);
        }}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        material={selectedMaterial}
        isOpen={Boolean(selectedMaterial)}
        onClose={() => setSelectedMaterial(null)}
      />

    </div>
  );
}
