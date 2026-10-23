import React, { useState } from 'react';
import { Settings, Shield, Sparkles, HardDrive, Key, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export default function AdminSettings() {
  const { addToast } = useNotification();
  const [provider, setProvider] = useState('local');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    addToast('Department Cloud Configuration updated successfully!', 'success', 'Settings Saved');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-cloud-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          Department Cloud Settings & Integrations
        </h1>
        <p className="text-xs text-cloud-500">
          Configure academic term parameters, cloud object storage keys, and future AI service connectors
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Academic Term Configuration */}
        <div className="cloud-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-cloud-900 pb-2 border-b border-cloud-100">
            Current Academic Term Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-cloud-700 mb-1">Academic Year</label>
              <input
                type="text"
                defaultValue="2026-2027"
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-cloud-700 mb-1">Active Term</label>
              <input
                type="text"
                defaultValue="B.E. 6th Semester (Autonomous)"
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* AI Model Connector (Demonstrating future integration as requested) */}
        <div className="cloud-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-cloud-100">
            <h2 className="text-sm font-bold text-cloud-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              AI Semantic Engine Configuration
            </h2>
            <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">
              Zero External Key Required For Prototype
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="block font-semibold text-cloud-700">Semantic Model Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setProvider('local')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  provider === 'local'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold'
                    : 'border-cloud-200 hover:bg-cloud-50 text-cloud-700'
                }`}
              >
                <div className="font-bold mb-1">Local / In-Memory (Active)</div>
                <div className="text-[11px] text-cloud-500">Autonomous mock embeddings & grounded syllabus matching</div>
              </div>

              <div
                onClick={() => setProvider('gemini')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  provider === 'gemini'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold'
                    : 'border-cloud-200 hover:bg-cloud-50 text-cloud-700'
                }`}
              >
                <div className="font-bold mb-1">Google Gemini API</div>
                <div className="text-[11px] text-cloud-500">Ready to plug in Google Gemini Embeddings & 1.5 Flash</div>
              </div>

              <div
                onClick={() => setProvider('openai')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  provider === 'openai'
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900 font-semibold'
                    : 'border-cloud-200 hover:bg-cloud-50 text-cloud-700'
                }`}
              >
                <div className="font-bold mb-1">OpenAI API</div>
                <div className="text-[11px] text-cloud-500">Ready to plug in text-embedding-3 & GPT-4o</div>
              </div>
            </div>

            {provider !== 'local' && (
              <div className="pt-2 animate-in fade-in">
                <label className="block font-semibold text-cloud-700 mb-1">
                  {provider.toUpperCase()} API Key (Optional)
                </label>
                <input
                  type="password"
                  placeholder={`Enter ${provider} key to enable live cloud LLM inference...`}
                  className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 font-mono focus:outline-none focus:border-brand-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Database & Cloud Storage Binding */}
        <div className="cloud-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-cloud-900 pb-2 border-b border-cloud-100 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-brand-600" />
            Database & Cloud Storage Architecture
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-cloud-700 mb-1">MongoDB Atlas URI</label>
              <input
                type="text"
                defaultValue="mongodb+srv://cbit_dept_cluster.mongodb.net/academic_cloud"
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 font-mono bg-cloud-50"
              />
            </div>
            <div>
              <label className="block font-semibold text-cloud-700 mb-1">S3 / GCS Storage Bucket</label>
              <input
                type="text"
                defaultValue="cbit-dept-academic-cloud-primary-store"
                className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 font-mono bg-cloud-50"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save Cloud Parameters
          </button>
        </div>

      </form>
    </div>
  );
}
