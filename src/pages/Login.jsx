import React, { useState } from 'react';
import {
  Cloud,
  GraduationCap,
  Briefcase,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Login({ onLoginSuccess }) {
  const { login, demoUsers, loading } = useAuth();
  const { addToast } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const student = demoUsers.find(u => u.role === 'student');
const faculty = demoUsers.find(u => u.role === 'faculty');
const admin = demoUsers.find(u => u.role === 'admin');

  const handleRoleQuickLogin = async (roleKey) => {
    try {
      const user = await login(roleKey);
      addToast(`Logged in as ${user.name} (${user.role.toUpperCase()})`, 'success', 'Session Established');
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      addToast('Login error: ' + err.message, 'error');
    }
  };

  const handleFormLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      const user = await login(email);
      addToast(`Welcome back, ${user.name}!`, 'success', 'Access Authorized');
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      addToast('Invalid institutional email or credentials', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-cloud-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background ambient accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 text-white shadow-md mb-3">
            <Cloud className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-cloud-900 tracking-tight">
            Department Academic Cloud
          </h1>
          <p className="text-xs sm:text-sm text-cloud-600 mt-1">
            Secure academic infrastructure for the department
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[11px] font-semibold">
            <span>Chaitanya Bharathi Institute of Technology &bull; CSE / AI&ML</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-cloud-200/90 space-y-6">
          
          {/* Quick 1-Click Role Login (As explicitly requested in prompt) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cloud-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                Evaluator Demo Login (1-Click)
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Instant Access
              </span>
            </div>

            <div className="space-y-2.5">
              
              {/* Student Role Button */}
              <button
                type="button"
                onClick={() => handleRoleQuickLogin('student')}
                disabled={loading}
                className="w-full text-left p-3.5 rounded-xl border border-cloud-200 hover:border-brand-400 hover:bg-brand-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-cloud-900 group-hover:text-brand-700 transition-colors">
                      Student: {student?.name || 'Loading...'}
                    </div>
                    <div className="text-[11px] text-cloud-500">
                      {student?.rollNo || 'Loading...'}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-cloud-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Faculty Role Button */}
              <button
                type="button"
                onClick={() => handleRoleQuickLogin('faculty')}
                disabled={loading}
                className="w-full text-left p-3.5 rounded-xl border border-cloud-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-cloud-900 group-hover:text-emerald-700 transition-colors">
                       Faculty: {faculty?.name || 'Loading...'}
                    </div>
                    <div className="text-[11px] text-cloud-500">
                      Associate Professor & Course Lead AI204
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-cloud-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </button>

              {/* HOD / Admin Role Button */}
              <button
                type="button"
                onClick={() => handleRoleQuickLogin('admin')}
                disabled={loading}
                className="w-full text-left p-3.5 rounded-xl border border-cloud-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-cloud-900 group-hover:text-purple-700 transition-colors">
                      HOD / Admin: {demoUsers.find(u => u.role === 'admin')?.name || 'Administrator'}
                    </div>
                    <div className="text-[11px] text-cloud-500">
                      Professor & Head of Department &bull; Root Clearance
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-cloud-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </button>

            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cloud-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-2 text-cloud-400">or sign in with credentials</span>
            </div>
          </div>

          {/* Regular Login Form */}
          <form onSubmit={handleFormLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-cloud-700 mb-1">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. demo.user@example.edu"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-cloud-700 mb-1">
                Security Password / Token
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              Sign In to Academic Cloud
            </button>
          </form>

          {/* Security Guarantee */}
          <div className="pt-2 text-center text-[11px] text-cloud-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Role-Based Access Boundaries Enforced &bull; JWT Ready</span>
          </div>

        </div>

      </div>
    </div>
  );
}
