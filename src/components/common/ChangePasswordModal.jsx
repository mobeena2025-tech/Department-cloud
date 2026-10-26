import React, { useState } from 'react';
import { X, KeyRound, Eye, EyeOff } from 'lucide-react';
import { api, setSession } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

// Same rules as the server (server/lib/password.js); the server has the final say.
function checkNewPassword(pw, email, rollNo) {
  if (pw.length < 8) return 'At least 8 characters';
  if (pw.length > 72) return 'At most 72 characters';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Use at least one letter and one number';
  const local = String(email || '').split('@')[0].toLowerCase();
  if (local.length >= 4 && pw.toLowerCase().includes(local)) return 'Must not contain your email name';
  const roll = String(rollNo || '').replace(/[^0-9A-Za-z]/g, '').toLowerCase();
  if (roll && pw.replace(/[^0-9A-Za-z]/g, '').toLowerCase().includes(roll)) return 'Must not contain your roll number';
  return null;
}

// required: first sign-in with a temporary password; the window can't be closed
// (only Sign Out) until a new password is saved.
export default function ChangePasswordModal({ isOpen, onClose, required = false }) {
  const { currentUser, updateCurrentUser, logout } = useAuth();
  const { addToast } = useNotification();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const close = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError('');
    onClose?.();
  };

  const rule = next ? checkNewPassword(next, currentUser?.email, currentUser?.rollNo) : null;
  const mismatch = confirm && next !== confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const problem = checkNewPassword(next, currentUser?.email, currentUser?.rollNo);
    if (problem) return setError(problem);
    if (next !== confirm) return setError('The new passwords do not match');
    if (next === current) return setError('Choose a password different from the current one');

    setSaving(true);
    try {
      const res = await api.changePassword(current, next);
      // The old session ended with the old password; keep using the new one.
      if (res.session) setSession(res.session);
      updateCurrentUser({ mustChangePassword: false });
      addToast('Password changed. Other devices have been signed out.', 'success', 'Password Updated');
      close();
    } catch (err) {
      setError(err.message || 'Could not change the password');
    } finally {
      setSaving(false);
    }
  };

  const input = (label, value, setValue, autoComplete) => (
    <div>
      <label className="block font-semibold text-cloud-700 mb-1">{label}</label>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full px-3 py-2 rounded-xl border border-cloud-200 text-cloud-900 focus:outline-none focus:border-brand-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cloud-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-cloud-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cloud-200 bg-cloud-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-cloud-900">Change Password</h3>
          </div>
          {!required && (
            <button onClick={close} className="text-cloud-400 hover:text-cloud-600 p-1 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {currentUser?.mustChangePassword && (
            <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              {required
                ? `Welcome, ${currentUser?.name?.split(' ')[0] || ''}! You signed in with a first-time password. Choose your own password to continue.`
                : 'You are using a temporary password. Choose your own to keep your account safe.'}
            </p>
          )}
          {input('Current password', current, setCurrent, 'current-password')}
          {input('New password', next, setNext, 'new-password')}
          <p className={`text-[11px] -mt-2 ${rule ? 'text-amber-700' : 'text-cloud-500'}`}>
            {rule || 'At least 8 characters, with a letter and a number.'}
          </p>
          {input('Confirm new password', confirm, setConfirm, 'new-password')}
          {mismatch && <p className="text-[11px] -mt-2 text-amber-700">The new passwords do not match</p>}

          <label className="flex items-center gap-2 text-cloud-600 cursor-pointer">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Show passwords
          </label>

          {error && (
            <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">{error}</p>
          )}

          <div className="pt-3 border-t border-cloud-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={required ? logout : close}
              className="px-4 py-2 rounded-xl border border-cloud-200 text-cloud-700 hover:bg-cloud-100 font-medium cursor-pointer"
            >
              {required ? 'Sign Out' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
