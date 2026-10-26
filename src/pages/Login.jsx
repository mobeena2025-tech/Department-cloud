import React, { useState } from 'react';
import {
  Cloud,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function Login({ onLoginSuccess }) {
  const { login, loading, authNotice } = useAuth();
  const { addToast } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleFormLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError('');

    try {
      const user = await login(email, password);
      addToast(`Welcome back, ${user.name}!`, 'success', 'Signed In');
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Sign-in failed');
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
            <span>Chaitanya Bharathi Institute of Technology &bull; AI &amp; DS</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-cloud-200/90 space-y-6">
          
          {(error || authNotice) && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error || authNotice}</span>
            </div>
          )}

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
                  placeholder="Your college email"
                  autoComplete="username"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-cloud-700 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-cloud-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In to Academic Cloud'}
            </button>
            <p className="text-center text-[11px] text-cloud-500">
              Forgot your password? Ask your department admin to reset it.
            </p>
          </form>

          {/* Security Guarantee */}
          <div className="pt-2 text-center text-[11px] text-cloud-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase Auth &bull; Role-based access</span>
          </div>

        </div>

      </div>
    </div>
  );
}
