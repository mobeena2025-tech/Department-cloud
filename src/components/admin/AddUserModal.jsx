import React, { useState } from 'react';
import { X, UserPlus, Shield, GraduationCap, Briefcase } from 'lucide-react';
import { api } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';

export default function AddUserModal({ isOpen, onClose, onUserAdded }) {
  const { addToast } = useNotification();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
    department: 'AI & DS',
    rollNo: '',
    empId: '',
    semester: 6,
    section: 'A',
    designation: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      addToast('Name and email are required', 'error');
      return;
    }
    if (formData.password.length < 8) {
      addToast('Initial password must be at least 8 characters', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createUser(formData);
      addToast(`Provisioned ${formData.role} account for ${formData.name}!`, 'success', 'User Management');
      if (onUserAdded) onUserAdded(res.user);
      setFormData((f) => ({ ...f, name: '', email: '', password: '', rollNo: '', empId: '' }));
      onClose();
    } catch (err) {
      addToast(err.message, 'error', 'Creation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cloud-200 bg-cloud-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-cloud-900">
              Provision Department User
            </h3>
          </div>
          <button onClick={onClose} className="text-cloud-400 hover:text-cloud-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-cloud-700 mb-1">Select Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'student' })}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  formData.role === 'student'
                    ? 'border-brand-500 bg-brand-50 text-brand-900 font-semibold'
                    : 'border-cloud-200 hover:bg-cloud-50 text-cloud-700'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-brand-600" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'faculty' })}
                className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  formData.role === 'faculty'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold'
                    : 'border-cloud-200 hover:bg-cloud-50 text-cloud-700'
                }`}
              >
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Faculty</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-cloud-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Demo User Nambiar"
              className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-cloud-700 mb-1">Institutional Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. demo.user@example.edu"
              className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-cloud-700 mb-1">Initial Password</label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
            />
            <p className="text-[11px] text-cloud-400 mt-1">Share it with the user privately.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {formData.role === 'student' ? (
              <>
                <div>
                  <label className="block font-semibold text-cloud-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-cloud-700 mb-1">Semester / Section</label>
                  <input
                    type="text"
                    value={`Sem ${formData.semester} - Sec ${formData.section}`}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-cloud-200 bg-cloud-50 text-cloud-600"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-semibold text-cloud-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.empId}
                    onChange={(e) => setFormData({ ...formData, empId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-cloud-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-3 border-t border-cloud-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-cloud-200 text-cloud-700 hover:bg-cloud-100 font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Provisioning...' : 'Provision User'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
