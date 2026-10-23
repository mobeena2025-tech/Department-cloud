import React from 'react';
import { User, Shield, GraduationCap, Mail, Building, BookOpen, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentProfile() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-cloud-900">Academic Profile & Cloud Credentials</h1>
        <p className="text-xs text-cloud-500">
          Official institutional identity and cryptographic enrollment clearance
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="cloud-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <img
          src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
          alt={currentUser?.name}
          className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-200 shadow-sm"
        />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-cloud-900">{currentUser?.name}</h2>
            <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              Active Matriculation
            </span>
          </div>

          <p className="text-xs text-cloud-500 flex items-center gap-2">
            <span>Roll: <strong className="text-cloud-800 font-mono">{currentUser?.rollNo || 'DEMO-ROLL'}</strong></span>
            &bull;
            <span>{currentUser?.department}</span>
          </p>

          <p className="text-xs text-cloud-500 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cloud-400" />
            <span>{currentUser?.email}</span>
          </p>
        </div>
      </div>

      {/* Academic Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Cumulative GPA</span>
          <span className="text-xl font-bold text-emerald-700 font-mono">{currentUser?.cgpa || 8.92}</span>
          <span className="text-[10px] text-cloud-400 block mt-0.5">Scale 10.0</span>
        </div>
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Semester & Section</span>
          <span className="text-xl font-bold text-cloud-900 font-mono">Sem {currentUser?.semester || 6} - {currentUser?.section || 'A'}</span>
          <span className="text-[10px] text-cloud-400 block mt-0.5">Autonomous Stream</span>
        </div>
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Earned Credits</span>
          <span className="text-xl font-bold text-brand-700 font-mono">{currentUser?.creditsCompleted || 114} / 160</span>
          <span className="text-[10px] text-cloud-400 block mt-0.5">Degree Compliant</span>
        </div>
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Cloud Token Clearance</span>
          <span className="text-xs font-bold text-emerald-700 block mt-2">ENROLLED_STUDENT</span>
          <span className="text-[10px] text-cloud-400 block mt-0.5">SHA-256 Validated</span>
        </div>
      </div>

      {/* Security & Access Boundary Policy */}
      <div className="cloud-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-cloud-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-600" />
          Cloud Security & Data Boundaries
        </h3>
        <p className="text-xs text-cloud-600 leading-relaxed">
          Department Academic Cloud strictly compartmentalizes data visibility. As an enrolled student:
        </p>
        <ul className="space-y-1.5 text-xs text-cloud-700 list-disc list-inside">
          <li>You are cryptographically authorized to view curriculum materials for registered courses.</li>
          <li>Your assignment submissions are verified against tamper-proof timestamp records.</li>
          <li>Attempting to query faculty gradebooks or administrative records is blocked and audited.</li>
        </ul>
      </div>
    </div>
  );
}
