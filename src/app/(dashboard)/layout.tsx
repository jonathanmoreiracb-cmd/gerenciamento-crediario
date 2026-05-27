'use client';

import Sidebar from '@/components/layout/Sidebar';
import { AuthProvider } from '@/lib/context/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header Placeholder */}
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 md:hidden">
              <h1 className="text-slate-900 dark:text-white font-bold">Crediário App</h1>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}
