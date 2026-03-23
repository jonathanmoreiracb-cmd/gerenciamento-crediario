'use client';

import { useState, useEffect } from 'react';
import { BadgeDollarSign, MessageCircle, Search, CalendarIcon, X, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ParcelasPage() {
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [paymentModal, setPaymentModal] = useState<{isOpen: boolean; parcela: any; amount: string; date: string}>({
    isOpen: false, parcela: null, amount: '', date: ''
  });
  const [editModal, setEditModal] = useState<{isOpen: boolean; parcela: any; amount: string; date: string}>({
    isOpen: false, parcela: null, amount: '', date: ''
  });
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
        venda:vendas!inner (
          id, produto_nome, num_parcelas, observacao,
          cliente:clientes!inner ( nome, whatsapp, is_colaborador )
        )
      `)
      .neq('venda.cliente.is_colaborador', true)
      .order('data_vencimento', { ascending: true });

    if (error) {
      console.error(error);
    } else if (data) {
      const hoje = new Date().toISOString().split('T')[0];
      const formatado = data.map((p: any) => {
        let realStatus = p.status_parcela;
        const isLate = p.data_vencimento < hoje;
        
        if (realStatus === 'parcial' && isLate) {
           realStatus = 'parcial_atrasado';
        } else if (realStatus === 'aberto' && isLate) {
           realStatus = 'atrasado';
        }

        return {
          id: p.id,
          cliente: p.venda?.cliente?.nome || 'Desconhecido',
          whatsapp: p.venda?.cliente?.whatsapp || '',
          produto: p.venda?.produto_nome || '',
          observacao: p.venda?.observacao || '',
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
    let matchStatus = false;
    if (filter === 'todos') {
      matchStatus = true;
    } else if (filter === 'atrasado') {
      matchStatus = p.status === 'atrasado' || p.status === 'parcial_atrasado';
    } else if (filter === 'parcial') {
      matchStatus = p.status === 'parcial' || p.status === 'parcial_atrasado';
    } else {
      matchStatus = p.status === filter;
    }

    const matchSearch = p.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMonth = monthFilter === '' || p.vencimento.startsWith(monthFilter);
    return matchStatus && matchSearch && matchMonth;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'atrasado':
      case 'parcial_atrasado': 
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'pago': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'parcial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusName = (status: string) => {
    switch(status) {
      case 'atrasado': return 'Atrasado';
      case 'parcial_atrasado': return 'Atrasado (Parcial)';
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

    const pixMsg = `\n\nCHAVE PIX:\nFITCH TECNOLOGIDA LTDA\nCNPJ: 52311538000110`;
    const text = `Olá ${p.cliente}, sua parcela de R$ ${p.valor.toFixed(2)} do produto ${p.produto} venceu em ${venFormatado}. Como podemos prosseguir com o pagamento?${pixMsg}`;
    window.open(`https://wa.me/${wppLimpo}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const openPaymentModal = (p: any) => {
    const pendente = Number(p.valor) - Number(p.valor_pago);
    setPaymentModal({
      isOpen: true,
      parcela: p,
      amount: pendente.toFixed(2),
      date: new Date().toISOString().split('T')[0]
    });
  };

  const confirmPayment = async () => {
    if (!supabase || !paymentModal.parcela) return;
    const p = paymentModal.parcela;

    const valorRecebido = parseFloat(paymentModal.amount.replace(',', '.'));
    if (isNaN(valorRecebido) || valorRecebido <= 0) return alert('Valor inválido!');

    setIsLoading(true);
    const novoValorPago = Number(p.valor_pago) + valorRecebido;
    let novoStatus = 'parcial';
    
    if (novoValorPago >= p.valor) {
      novoStatus = 'pago';
    }

    const { error } = await supabase.from('parcelas').update({
      valor_pago: novoValorPago,
      status_parcela: novoStatus,
      data_pagamento: paymentModal.date
    }).eq('id', p.id);

    if (error) {
       console.error(error);
       alert('Erro ao registrar pagamento no banco de dados.');
       setIsLoading(false);
    } else {
       setPaymentModal({ isOpen: false, parcela: null, amount: '', date: '' });
       loadParcelas();
    }
  };

  const openEditModal = (p: any) => {
    setEditModal({
      isOpen: true,
      parcela: p,
      amount: p.valor.toString(),
      date: p.vencimento
    });
  };

  const confirmEdit = async () => {
    if (!supabase || !editModal.parcela) return;
    const p = editModal.parcela;

    const novoValor = parseFloat(editModal.amount.replace(',', '.'));
    if (isNaN(novoValor) || novoValor <= 0) return alert('Valor inválido!');

    if (!editModal.date) return alert('Data inválida!');

    setIsLoading(true);
    const { error } = await supabase.from('parcelas').update({
      valor_parcela: novoValor,
      data_vencimento: editModal.date
    }).eq('id', p.id);

    if (error) {
       console.error(error);
       alert('Erro ao atualizar a parcela.');
       setIsLoading(false);
    } else {
       setEditModal({ isOpen: false, parcela: null, amount: '', date: '' });
       loadParcelas();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestão de Cobranças</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
           <input
             type="month"
             className="block w-full sm:w-auto px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
             value={monthFilter}
             onChange={e => setMonthFilter(e.target.value)}
             title="Filtrar por Mês de Vencimento"
           />
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
                        {p.observacao && (
                          <span className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5 truncate max-w-[200px]" title={p.observacao}>
                             Obs: {p.observacao}
                          </span>
                        )}
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
                      <button 
                        onClick={() => openEditModal(p)}
                        className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                        title="Editar Parcela (Data e Valor)"
                      >
                         <Pencil className="w-4 h-4" />
                      </button>
                      {(p.status === 'atrasado' || p.status === 'parcial_atrasado') && (
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
                            onClick={() => openPaymentModal(p)}
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

      {paymentModal.isOpen && paymentModal.parcela && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Registrar Pagamento</h3>
              <button 
                onClick={() => setPaymentModal({ isOpen: false, parcela: null, amount: '', date: '' })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-400 mb-4 border border-slate-100 dark:border-slate-800">
                 Parcela: <span className="font-semibold text-slate-900 dark:text-white">{paymentModal.parcela.num_parcela} de {paymentModal.parcela.total_parcelas}</span><br />
                 Produto: <span className="font-semibold text-slate-900 dark:text-white">{paymentModal.parcela.produto}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Valor Recebido (R$)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BadgeDollarSign className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={paymentModal.amount}
                    onChange={e => setPaymentModal({...paymentModal, amount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data do Pagamento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={paymentModal.date}
                    onChange={e => setPaymentModal({...paymentModal, date: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
               <button 
                 onClick={() => setPaymentModal({ isOpen: false, parcela: null, amount: '', date: '' })}
                 className="px-4 py-4 sm:py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
               >
                 Cancelar
               </button>
               <button 
                 onClick={confirmPayment}
                 disabled={isLoading}
                 className="px-6 py-3 sm:py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
               >
                 {isLoading ? 'Salvando...' : 'Confirmar Pagamento'}
               </button>
            </div>
          </div>
        </div>
      )}

      {editModal.isOpen && editModal.parcela && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Editar Parcela</h3>
              <button 
                onClick={() => setEditModal({ isOpen: false, parcela: null, amount: '', date: '' })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-sm text-yellow-800 dark:text-yellow-400 mb-4 border border-yellow-200 dark:border-yellow-900/30">
                 Aviso: Alterar a data mudará quando essa parcela será considerada Atrasada. O "Valor Total da Parcela" determina o alvo que deve ser atingido no pagamento.
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Valor Total da Parcela (R$)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BadgeDollarSign className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={editModal.amount}
                    onChange={e => setEditModal({...editModal, amount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nova Data de Vencimento
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={editModal.date}
                    onChange={e => setEditModal({...editModal, date: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
               <button 
                 onClick={() => setEditModal({ isOpen: false, parcela: null, amount: '', date: '' })}
                 className="px-4 py-4 sm:py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
               >
                 Cancelar
               </button>
               <button 
                 onClick={confirmEdit}
                 disabled={isLoading}
                 className="px-6 py-3 sm:py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
               >
                 {isLoading ? 'Salvando...' : 'Salvar Alterações'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
