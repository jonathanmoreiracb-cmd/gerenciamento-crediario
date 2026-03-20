'use client';

import { useState, useEffect } from 'react';
import { BadgeDollarSign, MessageCircle, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ParcelasPage() {
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadParcelas = async () => {
    setIsLoading(true);
    if (!supabase) return;
    
    // Fazemos um join entre parcelas -> vendas -> clientes
    const { data, error } = await supabase
      .from('parcelas')
      .select(`
        id, num_parcela, valor_parcela, data_vencimento, status_parcela, valor_pago,
        venda:vendas (
          id, produto_nome, num_parcelas,
          cliente:clientes ( nome, whatsapp )
        )
      `)
      .order('data_vencimento', { ascending: true });

    if (error) {
      console.error(error);
    } else if (data) {
      const hoje = new Date().toISOString().split('T')[0];
      const formatado = data.map((p: any) => {
        let realStatus = p.status_parcela;
        if ((realStatus === 'aberto' || realStatus === 'parcial') && p.data_vencimento < hoje) {
           realStatus = 'atrasado';
        }

        return {
          id: p.id,
          cliente: p.venda?.cliente?.nome || 'Desconhecido',
          whatsapp: p.venda?.cliente?.whatsapp || '',
          produto: p.venda?.produto_nome || '',
          num_parcela: p.num_parcela,
          total_parcelas: p.venda?.num_parcelas || 1,
          valor: p.valor_parcela,
          vencimento: p.data_vencimento,
          status: realStatus,
          valor_pago: p.valor_pago
        };
      });
      setParcelas(formatado);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadParcelas();
  }, []);

  const filtered = parcelas.filter(p => {
    const matchStatus = filter === 'todos' || p.status === filter;
    const matchSearch = p.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'atrasado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pago': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'parcial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusName = (status: string) => {
    switch(status) {
      case 'atrasado': return 'Atrasado';
      case 'pago': return 'Pago';
      case 'parcial': return 'Parcial';
      default: return 'Em Aberto';
    }
  };

  const abrirWhatsApp = (p: any) => {
    // Transforma "2023-11-10" em formato mais amigável
    const [y, m, d] = p.vencimento.split('-');
    const venFormatado = `${d}/${m}/${y}`;
    
    // Transforma whatsapp para padrao +55 se faltar, remove chars caso exista
    let wppLimpo = p.whatsapp.replace(/\D/g, '');
    if (wppLimpo.length === 11) wppLimpo = `55${wppLimpo}`;

    const text = `Olá ${p.cliente}, sua parcela de R$ ${p.valor.toFixed(2)} do produto ${p.produto} venceu em ${venFormatado}. Como podemos prosseguir com o pagamento?`;
    window.open(`https://wa.me/${wppLimpo}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const baixarPagamento = async (p: any) => {
    if (!supabase) return;

    const faltaPagar = Number(p.valor) - Number(p.valor_pago);
    const input = prompt(`Registrar pagamento para ${p.cliente}.\nFalta pagar: R$ ${faltaPagar.toFixed(2)} de R$ ${p.valor.toFixed(2)} \n\nDigite o valor recebido AGORA:`);
    
    if (!input) return;
    
    const valorRecebido = parseFloat(input.replace(',', '.'));
    if (isNaN(valorRecebido) || valorRecebido <= 0) return alert('Valor inválido!');

    const novoValorPago = Number(p.valor_pago) + valorRecebido;
    let novoStatus = 'parcial';
    
    // Se o valor recebido somado ao que ele já pagou cobrir a fatura = pago
    if (novoValorPago >= p.valor) {
      novoStatus = 'pago';
    }

    const { error } = await supabase.from('parcelas').update({
      valor_pago: novoValorPago,
      status_parcela: novoStatus,
      data_pagamento: novoStatus === 'pago' ? new Date().toISOString().split('T')[0] : null
    }).eq('id', p.id);

    if (error) {
       console.error(error);
       alert('Erro ao registrar pagamento no banco de dados.');
    } else {
       alert(`Pagamento registrado! Parcelas atualizada.`);
       loadParcelas(); // Recarrega do banco
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Cobranças</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
           <div className="relative w-full sm:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-slate-400" />
             </div>
             <input
               type="text"
               placeholder="Buscar cliente..."
               className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>

           <select 
             className="w-full sm:w-auto rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 py-2.5 px-3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border"
             value={filter}
             onChange={e => setFilter(e.target.value)}
           >
             <option value="todos">Todas Parcelas</option>
             <option value="atrasado">🚨 Atrasadas</option>
             <option value="aberto">⏳ Em Aberto</option>
             <option value="parcial">⚠️ Pagas Parcialmente</option>
             <option value="pago">✅ Pagas</option>
           </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Cliente</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Produto / Parcela</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Vencimento</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Vlr Parcelado</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Pendente</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Status</th>
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading && (
                 <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Carregando dados do Supabase...
                    </td>
                 </tr>
              )}
              
              {!isLoading && filtered.map(p => {
                const pendente = Number(p.valor) - Number(p.valor_pago);
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{p.cliente}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{p.produto}</span>
                        <span className="text-xs font-semibold text-slate-500">{p.num_parcela} de {p.total_parcelas}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {p.vencimento.split('-').reverse().join('/')}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">R$ {Number(p.valor).toFixed(2)}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                       R$ {pendente.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusColor(p.status)}`}>
                        {getStatusName(p.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {p.status === 'atrasado' && (
                        <button 
                          onClick={() => abrirWhatsApp(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-md transition-colors shadow-sm"
                          title="Cobrar via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" /> <span className="hidden xl:inline">Cobrar</span>
                        </button>
                      )}
                      {p.status !== 'pago' && (
                         <button 
                            onClick={() => baixarPagamento(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors shadow-sm"
                            title="Registrar Pagamento"
                         >
                           <BadgeDollarSign className="w-4 h-4" /> <span className="hidden xl:inline">Receber</span>
                         </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              
              {!isLoading && filtered.length === 0 && (
                <tr>
                   <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Nenhuma parcela encontrada para este status.
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
