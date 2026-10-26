import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FolderArchive,
  ClipboardList,
  Bell,
  Sparkles,
  User,
  CheckSquare,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  HardDrive,
  FileCheck2,
  Lock,
  Layers,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ currentPath, onNavigate }) {
  const { currentUser, isStudent, isFaculty, isAdmin } = useAuth();

  // Navigation menus per role as explicitly defined in prompt
  const studentNav = [
    { label: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { label: 'Courses', path: '/student/courses', icon: BookOpen },
    { label: 'Materials', path: '/student/materials', icon: FolderArchive },
    { label: 'Assignments', path: '/student/assignments', icon: ClipboardList },
    { label: 'Announcements', path: '/student/announcements', icon: Bell },
    { label: 'Assistant', path: '/assistant', icon: Sparkles, highlight: true },
    { label: 'Profile', path: '/student/profile', icon: User },
  ];

  const facultyNav = [
    { label: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
    { label: 'My Materials', path: '/faculty/materials', icon: FolderArchive },
    { label: 'Upload Material', path: '/faculty/upload', icon: HardDrive },
    { label: 'Courses', path: '/faculty/courses', icon: BookOpen },
    { label: 'Assignments', path: '/faculty/assignments', icon: ClipboardList },
    { label: 'Grade Submissions', path: '/faculty/submissions', icon: Award },
    { label: 'Announcements', path: '/faculty/announcements', icon: Bell },
    { label: 'Assistant', path: '/assistant', icon: Sparkles, highlight: true },
    { label: 'Profile', path: '/faculty/profile', icon: User },
  ];

  const adminNav = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users & Roles', path: '/admin/students', icon: Users },
    { label: 'Courses', path: '/admin/courses', icon: BookOpen },
    { label: 'Materials Oversight', path: '/admin/materials', icon: FolderArchive },
    { label: 'Activity & Audit', path: '/admin/activity', icon: ShieldCheck },
    { label: 'System Info', path: '/admin/settings', icon: Settings },
    { label: 'Assistant', path: '/assistant', icon: Sparkles, highlight: true },
  ];

  let navItems = studentNav;
  if (isFaculty) navItems = facultyNav;
  if (isAdmin) navItems = adminNav;

  return (
    <aside className="w-64 bg-white border-r border-cloud-200/90 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none">
      
      {/* Navigation Links */}
      <div className="p-3 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-cloud-400">
          {currentUser?.role === 'student' && 'Student Portal'}
          {currentUser?.role === 'faculty' && 'Faculty Workspace'}
          {currentUser?.role === 'admin' && 'Department Secretariat'}
        </div>

        <nav className="space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path + '/'));

            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold border border-brand-200/80 shadow-2xs'
                    : item.highlight
                    ? 'text-brand-600 hover:bg-brand-50/50 hover:text-brand-700'
                    : 'text-cloud-600 hover:bg-cloud-50 hover:text-cloud-900'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-brand-600' : item.highlight ? 'text-brand-500' : 'text-cloud-400'
                }`} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.highlight && (
                  <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: what this account can see */}
      <div className="p-4 border-t border-cloud-200/90 bg-cloud-50/60 space-y-3">
        {/* Security boundary badge */}
        <div className="p-2.5 rounded-xl bg-white border border-cloud-200 flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div className="text-[10px] leading-tight">
            <div className="font-semibold text-cloud-900">Access Boundaries Enforced</div>
            <div className="text-cloud-500 truncate">
              {currentUser?.role === 'student' && 'Only your enrolled courses'}
              {currentUser?.role === 'faculty' && 'Only your assigned courses'}
              {currentUser?.role === 'admin' && 'Full department access'}
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
}

function BriefcaseIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}
