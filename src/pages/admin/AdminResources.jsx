import React, { useState, useEffect } from 'react';
import { FolderArchive, HardDrive, FileText, Download, ShieldCheck, Search, Filter } from 'lucide-react';
import { api } from '../../services/api';
import DocumentPreviewModal from '../../components/common/DocumentPreviewModal';

export default function AdminResources() {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getMaterials();
        if (res?.materials) setMaterials(res.materials);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = materials.filter((m) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      return m.title.toLowerCase().includes(q) || m.courseName.toLowerCase().includes(q) || m.uploadedBy.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cloud-900">Academic Cloud Storage & Resources</h1>
        <p className="text-xs text-cloud-500">
          Department-wide repository governance, cryptographic integrity verification, and bucket quotas
        </p>
      </div>

      {/* Cloud Quota Overview */}
      <div className="cloud-card p-6 bg-cloud-900 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-brand-300 font-semibold mb-1">
              Primary Academic Store &bull; S3 / GCS Compatible Object Layer
            </div>
            <div className="text-2xl font-bold">184.2 GB Used of 500.0 GB</div>
            <p className="text-xs text-cloud-300 mt-1">
              846 indexed documents &bull; 768-d Vector embeddings live &bull; 99.99% Availability
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="badge-pill bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs">
              Storage Tier: Tier 1 Fast SSD
            </span>
          </div>
        </div>

        <div className="w-full bg-cloud-800 h-2 rounded-full overflow-hidden mt-4">
          <div className="bg-brand-500 h-full rounded-full w-[36.8%]" />
        </div>
      </div>

      {/* Search */}
      <div className="cloud-card p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all departmental academic files..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Resources Table */}
      <div className="cloud-card overflow-hidden">
        <div className="px-6 py-3 border-b border-cloud-200 bg-cloud-50/70 flex items-center justify-between text-xs font-semibold text-cloud-500">
          <span>{filtered.length} Stored Documents</span>
          <span>Security Clearance: Department HOD Level</span>
        </div>

        <div className="divide-y divide-cloud-100">
          {filtered.map((mat) => (
            <div key={mat.id} className="p-4 hover:bg-brand-50/20 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
                  {mat.fileType}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-cloud-900 truncate">{mat.title}</h3>
                  <p className="text-[11px] text-cloud-500 truncate">
                    {mat.courseName} &bull; {mat.unitTitle} &bull; Instructor: {mat.uploadedBy}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs font-mono text-cloud-500 hidden sm:inline">{mat.size}</span>
                <button
                  onClick={() => setSelectedMaterial(mat)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-cloud-200 hover:bg-brand-50 text-cloud-700 text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  Inspect Object
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DocumentPreviewModal
        material={selectedMaterial}
        isOpen={Boolean(selectedMaterial)}
        onClose={() => setSelectedMaterial(null)}
      />

    </div>
  );
}
