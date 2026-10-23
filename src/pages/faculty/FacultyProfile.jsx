import React from 'react';
import { User, Shield, Briefcase, Mail, Building, BookOpen, Key, HardDrive, CheckCircle2, Award, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function FacultyProfile() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-cloud-900">Faculty Academic Profile & Cloud Credentials</h1>
        <p className="text-xs text-cloud-500">
          Official departmental instructional credentials and object storage authorization tokens
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="cloud-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <img
          src={currentUser?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'}
          alt={currentUser?.name || 'Dr. Demo Faculty A'}
          className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-200 shadow-sm"
        />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-cloud-900">{currentUser?.name || 'Dr. Demo Faculty A'}</h2>
            <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 text-xs font-semibold">
              Associate Professor & Mentor
            </span>
          </div>

          <p className="text-xs text-cloud-500 flex items-center gap-2">
            <span>Faculty ID: <strong className="text-cloud-800 font-mono">FAC-CSE-2016-042</strong></span>
            &bull;
            <span>{currentUser?.department || 'Department of Computer Science & Engineering'}</span>
          </p>

          <p className="text-xs text-cloud-500 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-cloud-400" />
            <span>{currentUser?.email || 'demo.user@example.edu'}</span>
          </p>
        </div>
      </div>

      {/* Instructional Credentials Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Assigned Courses</span>
          <span className="text-xl font-bold text-brand-700 font-mono">3 Active</span>
          <span className="text-[10px] text-cloud-400 block mt-0.5">AI204, CS301, CS202</span>
        </div>
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Mentees / Students</span>
          <span className="text-xl font-bold text-emerald-700 font-mono">248 Enrolled</span>
          <span className="text-[10px] text-cloud-400 block mt-0.5">Semester 6 Batches</span>
        </div>
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Published Resources</span>
          <span className="text-xl font-bold text-cloud-900 font-mono">18 Stored</span>
          <span className="text-[10px] text-cloud-400 block mt-0.5">Notes, PPTs, Question Papers</span>
        </div>
        <div className="cloud-card p-4">
          <span className="text-cloud-400 block mb-1">Cloud Authorization</span>
          <span className="text-xs font-bold text-emerald-700 block mt-2">WRITE_PUBLISH_PERMIT</span>
          <span className="text-[10px] text-cloud-400 block mt-0.5">Pre-Signed Token Minting</span>
        </div>
      </div>

      {/* Cloud Object Storage Capabilities */}
      <div className="cloud-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-cloud-900 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-brand-600" />
          Department Cloud Storage Permissions & Key Bindings
        </h3>
        
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-cloud-50 border border-cloud-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-cloud-900">S3/GCS Object Prefix Authority</div>
              <div className="text-[11px] font-mono text-brand-700">s3://dept-academic-cloud-cse/sem6/*</div>
            </div>
            <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
              Full Write Access
            </span>
          </div>

          <div className="p-3 rounded-xl bg-cloud-50 border border-cloud-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-cloud-900">Digital Evaluation Sign-Off Key</div>
              <div className="text-[11px] font-mono text-cloud-500">RSA-2048 Faculty Signer &bull; Token Expires 2027</div>
            </div>
            <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
              Active & Valid
            </span>
          </div>
        </div>
      </div>

      {/* Security & Access Boundary Policy */}
      <div className="cloud-card p-6 space-y-3">
        <h3 className="text-sm font-bold text-cloud-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-600" />
          Faculty Governance Boundaries
        </h3>
        <p className="text-xs text-cloud-600 leading-relaxed">
          As a designated faculty instructor in the Department Academic Cloud:
        </p>
        <ul className="space-y-1.5 text-xs text-cloud-700 list-disc list-inside">
          <li>You have exclusive authority to publish, update, and archive resources for assigned course codes.</li>
          <li>Student submissions are delivered directly to your grading queue with anti-tamper hashes.</li>
          <li>All uploaded files are automatically indexed for the department semantic assistant.</li>
          <li>Administrative and syllabus restructuring modifications are subject to HOD sign-off.</li>
        </ul>
      </div>
    </div>
  );
}
