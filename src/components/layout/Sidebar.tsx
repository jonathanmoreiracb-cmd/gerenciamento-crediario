'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Receipt, CalendarDays, Settings, User, Users, PlusCircle, LogOut, Loader2 } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
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

  return (
    <aside className="w-64 bg-slate-900 h-screen hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-white font-bold text-xl">Crediário App</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-md transition-colors">
          <LayoutDashboard className="w-5 h-5" /> Dashboard
        </Link>
        <Link href="/vendas/nova" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-md transition-colors">
          <PlusCircle className="w-5 h-5" /> Nova Venda
        </Link>
        <Link href="/clientes" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-md transition-colors">
          <User className="w-5 h-5" /> Clientes
        </Link>
        <Link href="/vendas" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-md transition-colors">
          <Receipt className="w-5 h-5" /> Vendas
        </Link>
        <Link href="/parcelas" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-md transition-colors">
          <CalendarDays className="w-5 h-5" /> Cobranças
        </Link>
        <Link href="/colaboradores" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-md transition-colors">
          <Users className="w-5 h-5" /> Colaboradores
        </Link>
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-1">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 rounded-md text-sm transition-colors">
          <Settings className="w-4 h-4" /> Configurações
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-950/30 rounded-md text-sm transition-colors cursor-pointer disabled:opacity-50 text-left"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
