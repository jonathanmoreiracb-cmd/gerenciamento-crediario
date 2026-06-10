'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Pencil, Trash2, X, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/AuthContext';
import ReceiptModal from '@/components/layout/ReceiptModal';

export default function VendasPage() {
  const { logAction } = useAuth();
  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{
    isOpen: boolean; 
    venda: any; 
    produto_nome: string; 
    syscor_id: string; 
    observacao: string;
    valor_total: string;
  }>({
    isOpen: false, venda: null, produto_nome: '', syscor_id: '', observacao: '', valor_total: ''
  });
  const [receiptModal, setReceiptModal] = useState<{isOpen: boolean; venda: any}>({
    isOpen: false, venda: null
  });

  const loadVendas = async () => {
    setLoading(true);
    if (!supabase) return;
    const { data } = await supabase.from('vendas')
      .select(`
        id, syscor_id, produto_nome, valor_total, num_parcelas, data_venda, status_geral, observacao,
        cliente:clientes(nome, cpf, whatsapp),
        parcelas(id, num_parcela, valor_parcela, data_pagamento, valor_pago, status_parcela)
      `)
      .order('data_venda', { ascending: false });

    if (data) {
      const sorted = data.map((v: any) => {
        if (v.parcelas) {
          v.parcelas.sort((a: any, b: any) => a.num_parcela - b.num_parcela);
        }
        return v;
      });
      setVendas(sorted);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVendas();
  }, []);

  const openEditModal = (v: any) => {
    setEditModal({
      isOpen: true,
      venda: v,
      produto_nome: v.produto_nome || '',
      syscor_id: v.syscor_id || '',
      observacao: v.observacao || '',
      valor_total: v.valor_total ? v.valor_total.toString() : ''
    });
  };

  const confirmEdit = async () => {
    if (!supabase || !editModal.venda) return;
    const v = editModal.venda;
    
    if (!editModal.produto_nome) return alert('O nome do produto é obrigatório');
    
    const novoValor = parseFloat(editModal.valor_total.replace(',', '.'));
    if (isNaN(novoValor) || novoValor <= 0) return alert('Valor total da venda é inválido');

    const { error } = await supabase.from('vendas').update({
      produto_nome: editModal.produto_nome,
      syscor_id: editModal.syscor_id,
      observacao: editModal.observacao,
      valor_total: novoValor
    }).eq('id', v.id);

    if (error) {
      console.error(error);
      alert('Erro ao atualizar venda.');
    } else {
      // Registrar log de auditoria da edição
      await logAction(
        'editar_venda', 
        `Operador editou a venda "${v.produto_nome}" do cliente ${v.cliente?.nome} (R$ ${Number(v.valor_total).toFixed(2)} → R$ ${novoValor.toFixed(2)})`,
        {
          venda_id: v.id,
          antes: { produto: v.produto_nome, valor: v.valor_total, syscor: v.syscor_id, obs: v.observacao },
          depois: { produto: editModal.produto_nome, valor: novoValor, syscor: editModal.syscor_id, obs: editModal.observacao }
        }
      );

      setEditModal({ isOpen: false, venda: null, produto_nome: '', syscor_id: '', observacao: '', valor_total: '' });
      loadVendas();
    }
  };

  const handleDelete = async (id: string, produto: string) => {
    if (!supabase) return;
    
    const v = vendas.find((x) => x.id === id);
    if (!v) return;

    if (confirm(`ATENÇÃO! Tem certeza que deseja apagar a venda "${produto}"?\n\nISSO APAGARÁ TODAS AS PARCELAS VINCULADAS A ELA PERMANENTEMENTE.`)) {
       const { error } = await supabase.from('vendas').delete().eq('id', id);
       if (error) {
         console.error(error);
         alert('Erro ao apagar venda.');
       } else {
         // Registrar log de auditoria da exclusão
         await logAction(
           'excluir_venda',
           `Operador excluiu permanentemente a venda "${v.produto_nome}" (Total: R$ ${Number(v.valor_total).toFixed(2)}) do cliente ${v.cliente?.nome}`,
           { venda_id: id, dados_venda: v }
         );
         loadVendas();
       }
    }
  };

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
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading && <tr><td colSpan={8} className="text-center py-10 text-slate-500">Aguardando dados...</td></tr>}
              
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
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                     {v.status_geral === 'quitado' && (
                       <button 
                         onClick={() => setReceiptModal({ isOpen: true, venda: v })}
                         className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                         title="Recibo de Quitação Total"
                       >
                         <FileText className="w-4 h-4" />
                       </button>
                     )}
                     <button 
                       onClick={() => openEditModal(v)}
                       className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors animate-pulse"
                       title="Editar Venda"
                     >
                       <Pencil className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => handleDelete(v.id, v.produto_nome)}
                       className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                       title="Apagar Venda e Parcelas"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </td>
                </tr>
              ))}
              
              {!loading && vendas.length === 0 && (
                <tr>
                   <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                      Nenhuma venda encontrada.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editModal.isOpen && editModal.venda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Editar Dados da Venda</h3>
              <button 
                onClick={() => setEditModal({ isOpen: false, venda: null, produto_nome: '', syscor_id: '', observacao: '', valor_total: '' })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Produto</label>
                <input
                  type="text"
                  className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={editModal.produto_nome}
                  onChange={e => setEditModal({...editModal, produto_nome: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Total da Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  value={editModal.valor_total}
                  onChange={e => setEditModal({...editModal, valor_total: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Syscor ID</label>
                <input
                  type="text"
                  className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={editModal.syscor_id}
                  onChange={e => setEditModal({...editModal, syscor_id: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                <textarea
                  rows={3}
                  className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={editModal.observacao}
                  onChange={e => setEditModal({...editModal, observacao: e.target.value})}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
               <button 
                 onClick={() => setEditModal({ isOpen: false, venda: null, produto_nome: '', syscor_id: '', observacao: '', valor_total: '' })}
                 className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
               >
                 Cancelar
               </button>
               <button 
                 onClick={confirmEdit}
                 className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
               >
                 Salvar Alterações
               </button>
            </div>
          </div>
        </div>
      )}

      <ReceiptModal 
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal({ isOpen: false, venda: null })}
        type="quitacao"
        venda={receiptModal.venda}
      />
    </div>
  );
}
