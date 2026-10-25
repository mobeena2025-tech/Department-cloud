import React from 'react';
import { X, UploadCloud } from 'lucide-react';
import UploadMaterialForm from './UploadMaterialForm';

export default function UploadMaterialModal({ isOpen, onClose, onUploadSuccess }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cloud-200 bg-cloud-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-cloud-900">Upload Material</h3>
          </div>
          <button onClick={onClose} className="text-cloud-400 hover:text-cloud-600 p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <UploadMaterialForm
            onCancel={onClose}
            onUploaded={(material) => {
              onUploadSuccess?.(material);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
