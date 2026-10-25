import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Filter, KeyRound, Copy, X } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import AddUserModal from '../../components/admin/AddUserModal';

export default function AdminUsers({ defaultRoleFilter = 'ALL' }) {
  const { currentUser } = useAuth();
  const { addToast } = useNotification();
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(defaultRoleFilter);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  // Password reset: the user to confirm, then the result shown once.
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  const confirmReset = async () => {
    setResetting(true);
    try {
      const res = await api.resetUserPassword(resetTarget.id);
      setResetResult({ name: res.user.name, email: res.user.email, password: res.temporaryPassword });
      setResetTarget(null);
    } catch (err) {
      addToast(err.message || 'Could not reset the password', 'error', 'Reset Failed');
    } finally {
      setResetting(false);
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(resetResult.password);
      addToast('Temporary password copied.', 'success', 'Copied');
    } catch {
      addToast('Copy failed. Select the password and copy it by hand.', 'error', 'Copy Failed');
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res?.users) setUsers(res.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.rollNo && u.rollNo.toLowerCase().includes(q)) ||
        (u.empId && u.empId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cloud-900">Department Directory & User Management</h1>
          <p className="text-xs text-cloud-500">
            Institutional identities, role-based security clearances, and academic enrollment status
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start"
        >
          <UserPlus className="w-4 h-4" />
          Provision New User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="cloud-card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, institutional email, roll number, or employee ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-900 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-cloud-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-cloud-200 text-xs text-cloud-700 bg-white font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* User Table (as requested in prompt: Name | Role | Department | Status) */}
      <div className="cloud-card overflow-hidden">
        <div className="px-6 py-3 border-b border-cloud-200 bg-cloud-50/70 flex items-center justify-between text-xs font-semibold text-cloud-500">
          <span>{filtered.length} Registered Accounts</span>
          <span>Access Boundaries: Enforced</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cloud-50/50 text-cloud-500 font-semibold border-b border-cloud-200">
              <tr>
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Identifier</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Password</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud-100 text-cloud-800">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-brand-50/20 transition-colors">
                  
                  {/* Name */}
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-cloud-900">{user.name}</div>
                    <div className="text-[11px] text-cloud-500">{user.email}</div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-6">
                    <span className={`badge-pill text-xs uppercase font-mono font-bold ${
                      user.role === 'admin'
                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                        : user.role === 'faculty'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-brand-50 text-brand-800 border border-brand-200'
                    }`}>
                      {user.role}
                    </span>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-6 text-cloud-700">
                    {user.department || '—'}
                  </td>

                  {/* Identifier */}
                  <td className="py-3.5 px-6 font-mono text-cloud-700">
                    {user.rollNo || user.empId || '—'}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-6">
                    <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {user.status || 'Active'}
                    </span>
                  </td>

                  {/* Password reset (not for your own account) */}
                  <td className="py-3.5 px-6 text-right">
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => setResetTarget(user)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cloud-200 text-cloud-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 font-medium cursor-pointer whitespace-nowrap"
                      >
                        <KeyRound className="w-3 h-3" />
                        Reset password
                      </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onUserAdded={(newUser) => {
          setUsers((prev) => [newUser, ...prev]);
        }}
      />

      {/* Step 1: confirm the reset */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-sm p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-cloud-900">Reset password?</h3>
            <p className="text-cloud-700">
              <span className="font-semibold">{resetTarget.name}</span> ({resetTarget.email}) will get a new
              temporary password. Their old password stops working, and they are asked to choose their own after
              signing in.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResetTarget(null)}
                disabled={resetting}
                className="px-4 py-2 rounded-xl border border-cloud-200 text-cloud-700 hover:bg-cloud-100 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                disabled={resetting}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold disabled:opacity-50 cursor-pointer"
              >
                {resetting ? 'Resetting...' : 'Reset password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: show the temporary password once */}
      {resetResult && (
        <div className="fixed inset-0 z-50 bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-sm p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-cloud-900">New temporary password</h3>
              <button onClick={() => setResetResult(null)} className="text-cloud-400 hover:text-cloud-600 p-1 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-cloud-700">
              For <span className="font-semibold">{resetResult.name}</span> ({resetResult.email})
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-xl bg-cloud-50 border border-cloud-200 font-mono text-sm text-cloud-900 select-all break-all">
                {resetResult.password}
              </code>
              <button
                onClick={copyPassword}
                className="p-2 rounded-xl border border-cloud-200 text-cloud-700 hover:bg-cloud-100 cursor-pointer"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              This is shown only once. Send it to them privately (not in a group chat).
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setResetResult(null)}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
