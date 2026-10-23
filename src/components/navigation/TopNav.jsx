import React, { useState } from 'react';
import {
  Cloud,
  Search,
  Bell,
  Shield,
  ChevronDown,
  User,
  LogOut,
  Sparkles,
  CheckCircle2,
  Lock,
  GraduationCap,
  Briefcase,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export default function TopNav({ onNavigate, currentPath }) {
  const { currentUser, switchRole, logout, accessScope } = useAuth();
  const { addToast } = useNotification();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'ANN Assignment 2 Deadline', time: 'In 6 days', unread: true },
    { id: 2, title: 'New Material: CNN Pooling.pdf', time: '2 hours ago', unread: true },
    { id: 3, title: 'Guest Lecture Announcement', time: 'Yesterday', unread: false },
  ];

  const handleRoleChange = (roleKey, name) => {
    switchRole(roleKey);
    setShowRoleMenu(false);
    addToast(`Switched active persona to ${name} (${roleKey.toUpperCase()})`, 'info', 'Role Changed');
    // Navigate to role root
    if (roleKey === 'student') onNavigate('/student');
    if (roleKey === 'faculty') onNavigate('/faculty');
    if (roleKey === 'admin') onNavigate('/admin');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-cloud-200/90 shadow-xs">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-xs group-hover:bg-brand-700 transition-colors flex-shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-cloud-900 tracking-tight leading-none group-hover:text-brand-600 transition-colors">
                  Department Academic Cloud
                </span>
                <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 text-[10px] py-0">
                  CBIT Autonomous
                </span>
              </div>
              <span className="text-[11px] text-cloud-500 font-normal block leading-tight mt-0.5">
                Secure academic infrastructure for the department
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search / Assistant Quick Ask */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={() => onNavigate('/assistant')}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-cloud-200 bg-cloud-50 hover:bg-white hover:border-brand-300 text-cloud-400 text-xs transition-all shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-cloud-400 group-hover:text-brand-600 transition-colors" />
              <span className="text-cloud-600">
                Ask academic assistant... (e.g. Find DBMS Unit 3 notes)
              </span>
            </div>
            <span className="flex items-center gap-1 text-[10px] bg-white px-2 py-0.5 rounded-md border border-cloud-200 text-brand-600 font-mono font-medium">
              <Sparkles className="w-2.5 h-2.5" />
              Assistant
            </span>
          </button>
        </div>

        {/* Right: Security Indicator, Quick Role Switcher, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Visible Access Control Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <Lock className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="text-[11px]">
              Access: <span className="font-semibold">{accessScope}</span>
            </span>
          </div>

          {/* Quick 1-Click Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowUserMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cloud-100 hover:bg-cloud-200 text-cloud-800 text-xs font-semibold transition-colors border border-cloud-200 cursor-pointer"
              title="Switch demo evaluation role"
            >
              <div className="flex items-center gap-1.5">
                {currentUser?.role === 'student' && <GraduationCap className="w-4 h-4 text-brand-600" />}
                {currentUser?.role === 'faculty' && <Briefcase className="w-4 h-4 text-emerald-600" />}
                {currentUser?.role === 'admin' && <Shield className="w-4 h-4 text-purple-600" />}
                <span className="capitalize">{currentUser?.role} View</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-cloud-500" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-cloud-200 p-2 z-50 text-xs animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-cloud-100 mb-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-cloud-400">
                    Demonstration Role Switcher
                  </div>
                  <div className="text-cloud-700 text-xs mt-0.5">
                    Test role-based views and security boundaries:
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => handleRoleChange('student', 'Demo Student A')}
                    className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                      currentUser?.role === 'student' ? 'bg-brand-50 border border-brand-200' : 'hover:bg-cloud-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-cloud-900">Student (Demo Student A)</div>
                      <div className="text-[11px] text-cloud-500">Roll: DEMO-ROLL &bull; Enrolled Courses Only</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleChange('faculty', 'Dr. Demo Faculty A')}
                    className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                      currentUser?.role === 'faculty' ? 'bg-emerald-50 border border-emerald-200' : 'hover:bg-cloud-50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-cloud-900">Faculty (Dr. Demo Faculty A)</div>
                      <div className="text-[11px] text-cloud-500">Course Lead AI204 &bull; Materials & Submissions</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleRoleChange('admin', 'Prof. Demo Head')}
                    className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                      currentUser?.role === 'admin' ? 'bg-purple-50 border border-purple-200' : 'hover:bg-cloud-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-cloud-900">HOD / Admin (Prof. Demo Head)</div>
                      <div className="text-[11px] text-cloud-500">Full Department Authority &bull; Audit Logs & Analytics</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowRoleMenu(false);
                setShowUserMenu(false);
              }}
              className="p-2 rounded-xl text-cloud-600 hover:text-cloud-900 hover:bg-cloud-100 transition-colors relative cursor-pointer"
              title="Department Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-cloud-200 p-3 z-50 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-cloud-100 mb-2">
                  <span className="font-bold text-cloud-900">Notifications</span>
                  <span className="badge-pill bg-brand-50 text-brand-700 text-[10px]">2 unread</span>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2 rounded-lg hover:bg-cloud-50 transition-colors">
                      <div className="font-medium text-cloud-900">{n.title}</div>
                      <div className="text-[10px] text-cloud-500 mt-0.5">{n.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowRoleMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-cloud-100 transition-colors cursor-pointer"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser?.name}
                className="w-7 h-7 rounded-lg object-cover border border-cloud-200"
              />
              <span className="text-xs font-semibold text-cloud-800 hidden md:block max-w-[120px] truncate">
                {currentUser?.name?.split(' ')[0]}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-cloud-200 p-3 z-50 text-xs animate-in fade-in duration-150">
                <div className="pb-3 border-b border-cloud-100 mb-2">
                  <div className="font-bold text-cloud-900">{currentUser?.name}</div>
                  <div className="text-[11px] text-cloud-500 truncate">{currentUser?.email}</div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="badge-pill bg-brand-50 text-brand-700 border border-brand-200 font-mono text-[10px] uppercase font-bold">
                      {currentUser?.role}
                    </span>
                    <span className="text-[10px] text-cloud-500">
                      {currentUser?.rollNo || currentUser?.empId}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate(currentUser?.role === 'student' ? '/student/profile' : '/admin/settings');
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-cloud-50 text-cloud-700 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Academic Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      onNavigate('/login');
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
