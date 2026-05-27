'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  CalendarDays, 
  Settings, 
  User, 
  Users, 
  PlusCircle, 
  LogOut, 
  Loader2,
  History 
} from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erro ao deslogar:', error);
      window.location.href = '/login';
    } finally {
      setLoggingOut(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="w-64 bg-slate-900 h-screen hidden md:flex flex-col border-r border-slate-800">
      {/* App Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-white font-bold text-xl tracking-tight">Fitch Crediário</h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all text-sm font-medium">
          <LayoutDashboard className="w-4.5 h-4.5 text-slate-400" /> Dashboard
        </Link>
        <Link href="/vendas/nova" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all text-sm font-medium">
          <PlusCircle className="w-4.5 h-4.5 text-slate-400" /> Nova Venda
        </Link>
        <Link href="/clientes" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all text-sm font-medium">
          <User className="w-4.5 h-4.5 text-slate-400" /> Clientes
        </Link>
        <Link href="/vendas" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all text-sm font-medium">
          <Receipt className="w-4.5 h-4.5 text-slate-400" /> Vendas
        </Link>
        <Link href="/parcelas" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all text-sm font-medium">
          <CalendarDays className="w-4.5 h-4.5 text-slate-400" /> Cobranças
        </Link>
        <Link href="/colaboradores" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all text-sm font-medium">
          <Users className="w-4.5 h-4.5 text-slate-400" /> Colaboradores
        </Link>
        <Link href="/historico" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all text-sm font-medium">
          <History className="w-4.5 h-4.5 text-slate-400" /> Histórico / Auditoria
        </Link>
      </nav>

      {/* Footer Profile & Configuration Area */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* User Card */}
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-950/20 border border-slate-800/40">
          <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
            {user ? getInitials(user.nome) : '...'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-200 truncate leading-none mb-0.5">
              {user ? user.nome : 'Carregando...'}
            </span>
            <span className="text-[10px] text-slate-500 truncate leading-none">
              @{user ? user.username : '...'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800/60 rounded-lg text-sm font-medium transition-colors">
            <Settings className="w-4.5 h-4.5 text-slate-500" /> Configurações
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-950/20 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 text-left"
          >
            {loggingOut ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <LogOut className="w-4.5 h-4.5 text-red-500" />
            )}
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
