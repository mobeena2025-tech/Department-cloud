import React from 'react';
import UploadMaterialForm from '../../components/faculty/UploadMaterialForm';

export default function UploadMaterial({ onNavigate }) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="pb-2 border-b border-cloud-200">
        <h1 className="text-xl font-bold text-cloud-900">Upload Material</h1>
        <p className="text-xs text-cloud-500 mt-0.5">
          Add PDF notes to one of your courses. Students enrolled in that course will see it.
        </p>
      </div>

      <div className="cloud-card p-6">
        <UploadMaterialForm
          onCancel={() => onNavigate?.('/faculty/materials')}
          onUploaded={() => onNavigate?.('/faculty/materials')}
        />
      </div>
    </div>
  );
}
