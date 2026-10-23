import React from 'react';
import { ShieldAlert, ArrowLeft, UserCheck, Key, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccessBoundary({ allowedRoles = [], children, pageTitle = 'Restricted Department Resource' }) {
  const { currentUser, switchRole } = useAuth();

  const userRole = currentUser?.role || 'student';
  const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  if (hasAccess) {
    return children;
  }

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-2xl shadow-lg animate-in fade-in duration-200">
      <div className="flex items-center gap-3 pb-6 border-b border-rose-100">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-rose-600">
            Access Policy Enforcement
          </div>
          <h2 className="text-xl font-bold text-cloud-900">
            Cryptographic Access Boundary Reached
          </h2>
        </div>
      </div>

      <div className="mt-6 space-y-4 text-sm text-cloud-700">
        <p className="leading-relaxed">
          You are currently signed in as <strong className="text-cloud-900">{currentUser?.name}</strong> with role{' '}
          <span className="badge-pill bg-rose-100 text-rose-800 font-mono text-xs uppercase font-bold">
            {userRole}
          </span>
          .
        </p>

        <div className="p-4 rounded-xl bg-cloud-50 border border-cloud-200 space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-cloud-500">Attempted Resource:</span>
            <span className="font-semibold text-cloud-900">{pageTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cloud-500">Required Clearance:</span>
            <span className="font-semibold text-rose-700">{allowedRoles.map(r => r.toUpperCase()).join(' or ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cloud-500">Security Audit Log:</span>
            <span className="text-emerald-700">Intercepted & Recorded #SEC-LOG-{Date.now().toString().slice(-4)}</span>
          </div>
        </div>

        <p className="text-xs text-cloud-500 leading-normal">
          In production, this access violation triggers a security audit event and denies route execution. As an evaluator of this prototype, you can immediately switch to an authorized role below:
        </p>
      </div>

      {/* Switch role actions */}
      <div className="mt-8 pt-6 border-t border-cloud-100 flex flex-wrap items-center gap-3">
        {allowedRoles.includes('faculty') && (
          <button
            onClick={() => switchRole('faculty')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            Switch to Faculty (Dr. Demo Faculty A)
          </button>
        )}

        {allowedRoles.includes('admin') && (
          <button
            onClick={() => switchRole('admin')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cloud-900 hover:bg-cloud-800 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Key className="w-4 h-4" />
            Switch to HOD/Admin (Prof. Demo Head)
          </button>
        )}

        <button
          onClick={() => switchRole('student')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cloud-100 hover:bg-cloud-200 text-cloud-700 text-xs font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student Dashboard
        </button>
      </div>
    </div>
  );
}
