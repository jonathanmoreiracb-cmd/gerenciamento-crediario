'use client';

import { useEffect, useState } from 'react';
import { DollarSign, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    aReceberMes: 0,
    aReceberGeral: 0,
    emAtraso: 0,
    recebidoMes: 0
  });
  const [loading, setLoading] = useState(true);
  const [ultimasVendas, setUltimasVendas] = useState<any[]>([]);
  const [inadimplentes, setInadimplentes] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!supabase) return;

      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

      // Total a Receber no Mês
      const { data: aReceber } = await supabase.from('parcelas')
        .select('valor_parcela, valor_pago')
        .in('status_parcela', ['aberto', 'parcial'])
        .gte('data_vencimento', firstDay)
        .lte('data_vencimento', lastDay);

      const aReceberMes = aReceber?.reduce((acc, curr) => acc + (Number(curr.valor_parcela) - Number(curr.valor_pago)), 0) || 0;

      // NOVO: Total Geral em Aberto (Todo Período)
      const { data: aReceberGeralData } = await supabase.from('parcelas')
        .select('valor_parcela, valor_pago')
        .in('status_parcela', ['aberto', 'parcial', 'atrasado']);
        
      const aReceberGeral = aReceberGeralData?.reduce((acc, curr) => acc + (Number(curr.valor_parcela) - Number(curr.valor_pago)), 0) || 0;

      // Total em Atraso Geral
      const today = new Date().toISOString().split('T')[0];
      const { data: atraso } = await supabase.from('parcelas')
        .select(`
           id,
           valor_parcela,
           valor_pago,
           status_parcela,
           data_vencimento,
           num_parcela,
           venda:vendas(
              produto_nome,
              num_parcelas,
              cliente:clientes(nome, whatsapp)
           )
        `)
        .in('status_parcela', ['aberto', 'parcial', 'atrasado']);
        
      const parcelasAtrasadas: any[] = [];
      const emAtraso = atraso?.reduce((acc, curr) => {
         if (curr.status_parcela === 'atrasado' || curr.data_vencimento < today) {
            parcelasAtrasadas.push(curr);
            return acc + (Number(curr.valor_parcela) - Number(curr.valor_pago));
         }
         return acc;
      }, 0) || 0;

      // Ordenar os inadimplentes do mais atrasado para o menos
      parcelasAtrasadas.sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime());

      // Total Recebido no Mês
      const { data: recebido } = await supabase.from('parcelas')
        .select('valor_pago')
        .gte('data_pagamento', firstDay)
        .lte('data_pagamento', lastDay)
        .gt('valor_pago', 0);
        
      const recebidoMes = recebido?.reduce((acc, curr) => acc + Number(curr.valor_pago), 0) || 0;

      // Últimas 5 Vendas
      const { data: vendas } = await supabase.from('vendas')
         .select(`id, produto_nome, valor_total, data_venda, cliente:clientes(nome)`)
         .order('data_venda', { ascending: false })
         .limit(5);

      setMetrics({ aReceberMes, aReceberGeral, emAtraso, recebidoMes });
      setInadimplentes(parcelasAtrasadas);
      if (vendas) setUltimasVendas(vendas);
      setLoading(false);
    }
    loadData();
  }, []);

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Resumo Financeiro</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total a Receber no Mês</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {loading ? '...' : formatBRL(metrics.aReceberMes)}
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
                Total Geral em Aberto: <span className="font-bold">{loading ? '...' : formatBRL(metrics.aReceberGeral)}</span>
              </p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total em Atraso (Geral)</p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                 {loading ? '...' : formatBRL(metrics.emAtraso)}
              </h3>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Recebido (Mês)</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                 {loading ? '...' : formatBRL(metrics.recebidoMes)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        
        {/* Painel de Atrasados */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/30 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-red-50 dark:bg-red-900/10 flex justify-between items-center">
             <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
               <AlertCircle className="w-5 h-5" />
               Atenção: Atrasados ({inadimplentes.length})
             </h3>
          </div>
          <div className="overflow-x-auto flex-1 h-[400px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Vencimento</th>
                  <th className="px-6 py-3 font-medium">Pendente</th>
                  <th className="px-6 py-3 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading && <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">Buscando...</td></tr>}
                  {!loading && inadimplentes.map(p => {
                     const pendente = Number(p.valor_parcela) - Number(p.valor_pago);
                     let wppLimpo = p.venda?.cliente?.whatsapp?.replace(/\D/g, '') || '';
                     if (wppLimpo.length === 11) wppLimpo = `55${wppLimpo}`;
                     const pixMsg = `\n\nCHAVE PIX:\nFITCH TECNOLOGIDA LTDA\nCNPJ: 52311538000110`;
                     const text = `Olá ${p.venda?.cliente?.nome}, sua parcela de R$ ${p.valor_parcela.toFixed(2)} do produto ${p.venda?.produto_nome} venceu em ${p.data_vencimento.split('-').reverse().join('/')}. Como podemos prosseguir com o pagamento?${pixMsg}`;
                     const waLink = `https://wa.me/${wppLimpo}?text=${encodeURIComponent(text)}`;

                     return (
                       <tr key={p.id} className="hover:bg-red-50/50 dark:hover:bg-red-900/10">
                         <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{p.venda?.cliente?.nome}</td>
                         <td className="px-6 py-4 text-red-600 dark:text-red-400 font-semibold">{p.data_vencimento.split('-').reverse().join('/')}</td>
                         <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{formatBRL(pendente)}</td>
                         <td className="px-6 py-4 text-right">
                           <a 
                             href={waLink}
                             target="_blank"
                             rel="noreferrer"
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-md transition-colors text-xs font-semibold shadow-sm"
                           >
                             <MessageCircle className="w-3.5 h-3.5" /> Cobrar
                           </a>
                         </td>
                       </tr>
                     );
                  })}
                  {!loading && inadimplentes.length === 0 && (
                     <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Nenhum cliente em atraso! 🎉</td></tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Últimas Vendas */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
             <h3 className="font-semibold text-slate-900 dark:text-white">Últimas Vendas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-3 font-medium">Data</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Produto</th>
                  <th className="px-6 py-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                 {loading && <tr><td colSpan={4} className="px-6 py-4 text-center text-slate-500">Carregando...</td></tr>}
                 {!loading && ultimasVendas.map(v => (
                   <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                     <td className="px-6 py-4 text-slate-500">{v.data_venda.split('-').reverse().join('/')}</td>
                     <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{v.cliente?.nome}</td>
                     <td className="px-6 py-4 text-slate-500">{v.produto_nome}</td>
                     <td className="px-6 py-4 font-medium text-indigo-600 dark:text-indigo-400 text-right">{formatBRL(Number(v.valor_total))}</td>
                   </tr>
                 ))}
                 {!loading && ultimasVendas.length === 0 && (
                   <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhuma venda registrada ainda.</td></tr>
                 )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}
