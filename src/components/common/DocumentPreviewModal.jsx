import React, { useState } from 'react';
import { X, Download, ExternalLink, FileText, Shield, Sparkles } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { api } from '../../services/api';

// What the Academic Assistant can do with this file.
function assistantStatus(material) {
  if ((material.fileType || 'PDF') !== 'PDF') {
    return { tone: 'cloud', text: 'PowerPoint and Word files are download-only; the Assistant reads PDFs.' };
  }
  switch (material.indexStatus) {
    case 'indexed':
      return { tone: 'emerald', text: `The Assistant can answer questions from this PDF${material.pageCount ? ` (${material.pageCount} pages)` : ''}.` };
    case 'pending':
    case 'indexing':
      return { tone: 'amber', text: 'The Assistant is still reading this PDF.' };
    case 'no_text':
      return { tone: 'amber', text: 'No text was found in this PDF (it may be scanned images), so the Assistant cannot search it.' };
    case 'failed':
      return { tone: 'rose', text: 'The Assistant could not read this PDF. Faculty can retry from My Materials.' };
    default:
      return null;
  }
}

const TONES = {
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  rose: 'bg-rose-50 border-rose-200 text-rose-900',
  cloud: 'bg-cloud-50 border-cloud-200 text-cloud-700',
};

export default function DocumentPreviewModal({ material, isOpen, onClose }) {
  const [opening, setOpening] = useState(false);
  const { addToast } = useNotification();

  if (!isOpen || !material) return null;

  const isPdf = (material.fileType || 'PDF') === 'PDF';
  const status = assistantStatus(material);

  // Ask the API for a short-lived signed link. PDFs open in a new tab;
  // PowerPoint/Word files download (the link is marked as a download).
  const handleOpen = async () => {
    // Open the tab inside the click so popup blockers allow it.
    const win = isPdf ? window.open('', '_blank') : null;
    if (win) win.opener = null;
    setOpening(true);
    try {
      const res = await api.getMaterial(material.id);
      const url = res?.material?.fileUrl;
      if (!url) throw new Error('No file is stored for this material.');
      if (win) win.location.href = url;
      else window.location.href = url;
    } catch (err) {
      if (win) win.close();
      addToast(err.message || 'Could not open the file.', 'error', 'Open Failed');
    } finally {
      setOpening(false);
    }
  };

  const detail = (label, value) =>
    value ? (
      <div className="p-3 rounded-lg bg-cloud-50 border border-cloud-200">
        <span className="text-cloud-500 block mb-1">{label}</span>
        <span className="font-semibold text-cloud-900 break-words">{value}</span>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-cloud-200 bg-cloud-50/80">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-semibold text-[11px] flex-shrink-0">
              {material.fileType || 'PDF'}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-cloud-900 leading-tight break-words">{material.title}</h3>
              <p className="text-xs text-cloud-500 mt-0.5">
                {material.courseCode} &bull; {material.unitTitle}
                {material.uploadedBy ? <> &bull; Uploaded by {material.uploadedBy}</> : null}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-cloud-400 hover:text-cloud-700 hover:bg-cloud-100 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <button
            onClick={handleOpen}
            disabled={opening}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {isPdf ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            {opening ? 'Opening...' : isPdf ? 'Open PDF' : `Download ${material.fileType}`}
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detail('Course', [material.courseCode, material.courseName].filter(Boolean).join(' – '))}
            {detail('Unit / Week', material.unitTitle)}
            {detail('File', [material.fileType, material.size].filter(Boolean).join(' • '))}
            {detail('Uploaded', [material.uploadDate, material.uploadedBy].filter(Boolean).join(' by '))}
            {detail('Topic', material.topic)}
          </div>

          {material.summary && (
            <div className="p-3 rounded-lg bg-cloud-50 border border-cloud-200">
              <span className="text-cloud-500 block mb-1">Description</span>
              <p className="text-cloud-800 leading-relaxed whitespace-pre-line">{material.summary}</p>
            </div>
          )}

          {status && (
            <div className={`p-3 rounded-lg border flex items-start gap-2 ${TONES[status.tone]}`}>
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{status.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cloud-200 bg-cloud-50 flex items-center gap-1.5 text-[11px] text-cloud-500">
          <Shield className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>
            <FileText className="w-3 h-3 inline -mt-0.5 mr-1" />
            Stored privately; only people in this course can open it, through a link that expires after an hour.
          </span>
        </div>
      </div>
    </div>
  );
}
