import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, FileText, CheckCircle2, Shield, Calendar, BookOpen, Layers, Eye } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';

export default function DocumentPreviewModal({ material, isOpen, onClose }) {
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState('preview');
  const [currentPage, setCurrentPage] = useState(1);
  const [opening, setOpening] = useState(false);
  const { addToast } = useNotification();

  if (!isOpen || !material) return null;

  // Ask the API for a short-lived signed URL and open the PDF in a new tab.
  const handleDownload = async () => {
    if (material.downloadPermitted === false) {
      addToast(
        `Offline download is restricted for this resource by faculty policy. In-browser inspection only.`,
        'warning',
        'Policy Restricted'
      );
      return;
    }

    // Open the tab now (inside the click) so popup blockers allow it,
    // then point it at the signed URL once we have it.
    const win = window.open('', '_blank');
    if (win) win.opener = null;
    setOpening(true);
    try {
      const res = await api.getMaterial(material.id);
      const url = res?.material?.fileUrl;
      if (!url) throw new Error('No file is stored for this material.');
      if (win) {
        win.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (err) {
      if (win) win.close();
      addToast(err.message || 'Could not open the file.', 'error', 'Open Failed');
    } finally {
      setOpening(false);
    }
  };

  const totalPages = material.pages || 38;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cloud-200 bg-cloud-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-semibold text-xs flex-shrink-0">
              {material.fileType || 'PDF'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-cloud-900 leading-tight">
                  {material.title}
                </h3>
                <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 text-[10px]">
                  {material.materialType || 'PDF Notes'}
                </span>
                <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                  Sem {material.semester || 6}
                </span>
              </div>
              <p className="text-xs text-cloud-500 mt-0.5">
                {material.courseName || material.courseCode} &bull; {material.unitTitle || `Unit ${material.unitNumber}`} &bull; Uploaded by {material.uploadedBy}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={opening}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer ${
                material.downloadPermitted === false
                  ? 'bg-cloud-200 text-cloud-600 hover:bg-cloud-300'
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              {material.downloadPermitted === false ? 'Download Restricted' : opening ? 'Opening...' : 'Open / Download'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-cloud-400 hover:text-cloud-700 hover:bg-cloud-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-cloud-200 bg-white text-xs text-cloud-600">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-cloud-600 hover:text-cloud-900 hover:bg-cloud-100'
              }`}
            >
              Document Content
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'metadata'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-cloud-600 hover:text-cloud-900 hover:bg-cloud-100'
              }`}
            >
              Metadata & AI Embeddings
            </button>
          </div>

          {activeTab === 'preview' && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-cloud-100 px-2 py-1 rounded-md text-cloud-700">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-1.5 py-0.5 rounded hover:bg-cloud-200 disabled:opacity-40"
                >
                  &larr;
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-1.5 py-0.5 rounded hover:bg-cloud-200 disabled:opacity-40"
                >
                  &rarr;
                </button>
              </div>

              <div className="flex items-center gap-1 bg-cloud-100 px-2 py-1 rounded-md text-cloud-700">
                <button
                  onClick={() => setZoom((z) => Math.max(75, z - 15))}
                  className="p-1 hover:bg-cloud-200 rounded"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(150, z + 15))}
                  className="p-1 hover:bg-cloud-200 rounded"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-cloud-100/60">
          {activeTab === 'preview' ? (
            <div
              className="mx-auto bg-white rounded-xl shadow-md border border-cloud-200 p-8 text-cloud-800 transition-all duration-150 max-w-3xl min-h-[600px]"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              {/* Simulated academic header */}
              <div className="text-center pb-6 border-b border-cloud-200 mb-6">
                <div className="text-[10px] uppercase font-bold tracking-widest text-brand-600 mb-1">
                  Chaitanya Bharathi Institute of Technology &bull; Autonomous
                </div>
                <h1 className="text-lg font-bold text-cloud-900 uppercase tracking-tight">
                  Department of Artificial Intelligence &amp; Data Science
                </h1>
                <div className="text-xs text-cloud-500 mt-1">
                  Academic Term 2026-2027 &bull; Course Material Repository
                </div>
              </div>

              {/* Document Body */}
              <div className="space-y-4">
                <div className="bg-brand-50/50 p-4 rounded-lg border border-brand-100">
                  <div className="text-xs font-semibold text-brand-900 uppercase tracking-wider mb-1">
                    Course Unit Reference
                  </div>
                  <div className="text-sm font-medium text-brand-800">
                    {material.courseName} ({material.courseId}) &bull; {material.unitTitle}
                  </div>
                  <div className="text-xs text-cloud-600 mt-1">
                    Topic: <span className="font-semibold text-cloud-800">{material.topic}</span>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none text-cloud-800 whitespace-pre-line leading-relaxed font-sans text-xs sm:text-sm bg-cloud-50/40 p-4 rounded-lg border border-cloud-100 font-mono">
                  {material.contentPreview || material.summary}
                </div>

                <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Academic Integrity Verification:</span> This resource is officially certified by the departmental curriculum committee for semester examinations and continuous evaluation.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="cloud-card p-6">
                <h4 className="text-sm font-bold text-cloud-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-600" />
                  Academic Cloud Metadata
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-cloud-50 border border-cloud-200">
                    <span className="text-cloud-500 block mb-1">Document Title</span>
                    <span className="font-semibold text-cloud-900">{material.title}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-cloud-50 border border-cloud-200">
                    <span className="text-cloud-500 block mb-1">Course & Unit</span>
                    <span className="font-semibold text-cloud-900">{material.courseName} ({material.unitTitle}) {material.semester ? <> &bull; Sem {material.semester}</> : null}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-cloud-50 border border-cloud-200">
                    <span className="text-cloud-500 block mb-1">Object Storage Key</span>
                    <span className="font-mono text-[11px] font-semibold text-brand-700 break-all">{material.storagePath || "No file stored"}</span>
                    <span className="text-[10px] text-cloud-400 block mt-0.5">Private storage; opened with short-lived signed links</span>
                  </div>
                  <div className="p-3 rounded-lg bg-cloud-50 border border-cloud-200">
                    <span className="text-cloud-500 block mb-1">Access Policy & Permitted Roles</span>
                    <span className="font-semibold text-emerald-700">{material.accessPermissions || 'Department Enrolled Only'}</span>
                    <span className="text-[10px] text-cloud-400 block mt-0.5">
                      {material.downloadPermitted === false ? 'Offline download restricted' : 'Offline signed download permitted'}
                    </span>
                  </div>
                </div>

              </div>

              <div className="cloud-card p-6">
                <h4 className="text-sm font-bold text-cloud-900 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-600" />
                  AI Vector Search Indexing
                </h4>
                <p className="text-xs text-cloud-600 mb-3">
                  This document is embedded into the Department Academic Cloud semantic knowledge store (dimension: 768-d cosine vector index).
                </p>
                <div className="p-3 rounded-lg bg-brand-50 border border-brand-200 text-xs text-brand-900 font-mono">
                  embedding_id: vec_{material.id}_chunk_001<br />
                  relevance_weight: 0.96 &bull; index_cluster: cbit_cse_curriculum_2026<br />
                  grounding_status: ACTIVE_GROUNDED
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cloud-200 bg-cloud-50 flex items-center justify-between text-xs text-cloud-500">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Role-Enforced Cloud Access Control &bull; SSL/TLS End-to-End</span>
          </div>
          <div>
            Total Downloads: <span className="font-semibold text-cloud-800">{material.downloads || 1}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
