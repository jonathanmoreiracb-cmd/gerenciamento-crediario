'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function VendasPage() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVendas() {
      if (!supabase) return;
      const { data } = await supabase.from('vendas')
        .select(`id, syscor_id, produto_nome, valor_total, num_parcelas, data_venda, status_geral, cliente:clientes(nome)`)
        .order('data_venda', { ascending: false });

      if (data) setVendas(data);
      setLoading(false);
    }
    loadVendas();
  }, []);

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Relatório de Vendas</h2>
        
        <Link 
          href="/vendas/nova"
          className="inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <PlusCircle className="w-5 h-5" /> Nova Venda Parcelada
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Data</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Cliente</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Syscor ID</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Produto</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Total</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Parcelas</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading && <tr><td colSpan={6} className="text-center py-10 text-slate-500">Aguardando dados...</td></tr>}
              
              {!loading && vendas.map(v => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{v.data_venda.split('-').reverse().join('/')}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{v.cliente?.nome}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono">{v.syscor_id || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{v.produto_nome}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{formatBRL(Number(v.valor_total))}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{v.num_parcelas}x</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      v.status_geral === 'quitado' ? 'bg-emerald-100 text-emerald-800' :
                      v.status_geral === 'atrasado' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {v.status_geral.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              
              {!loading && vendas.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Nenhuma venda encontrada.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
