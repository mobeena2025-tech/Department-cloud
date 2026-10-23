import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Filter, Shield, GraduationCap, Briefcase } from 'lucide-react';
import { api } from '../../services/api';
import AddUserModal from '../../components/admin/AddUserModal';

export default function AdminUsers({ defaultRoleFilter = 'ALL' }) {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(defaultRoleFilter);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

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
                <th className="py-3.5 px-6 text-right">Status</th>
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
                  <td className="py-3.5 px-6 text-right">
                    <span className="badge-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {user.status || 'Active'}
                    </span>
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

    </div>
  );
}
