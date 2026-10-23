import React from 'react';
import TopNav from '../components/navigation/TopNav';
import Sidebar from '../components/navigation/Sidebar';

export default function AppLayout({ children, currentPath, onNavigate }) {
  return (
    <div className="min-h-screen bg-cloud-50 flex flex-col font-sans">
      {/* Sticky Top Navigation */}
      <TopNav currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar currentPath={currentPath} onNavigate={onNavigate} />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
