'use client';

import { useEffect, useState } from 'react';
import { UserX, Users, Pencil, X, FileText, Copy, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{isOpen: boolean; cliente: any; nome: string; whatsapp: string; cpf: string}>({
    isOpen: false, cliente: null, nome: '', whatsapp: '', cpf: ''
  });
  const [reportModal, setReportModal] = useState<{isOpen: boolean; cliente: any; text: string; loading: boolean; copied: boolean}>({
    isOpen: false, cliente: null, text: '', loading: false, copied: false
  });

  const loadClientes = async () => {
    setLoading(true);
    if (!supabase) return;
    const { data } = await supabase.from('clientes').select('*').order('nome', { ascending: true });
    if (data) setClientes(data);
    setLoading(false);
  }

  useEffect(() => {
    loadClientes();
  }, []);

  const handleDelete = async (id: string, nome: string) => {
    if (!supabase) return;
    
    if (confirm(`ATENÇÃO! Tem certeza que deseja apagar o cliente ${nome}?\n\nISSO APAGARÁ TODAS AS VENDAS E PARCELAS DELE PERMANENTEMENTE.`)) {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) {
        console.error(error);
        alert('Erro ao apagar cliente.');
      } else {
        alert('Cliente e todas as suas compras apagados com sucesso!');
        loadClientes();
      }
    }
  }

  const openEditModal = (c: any) => {
    setEditModal({
      isOpen: true,
      cliente: c,
      nome: c.nome || '',
      whatsapp: c.whatsapp || '',
      cpf: c.cpf || ''
    });
  }

  const openReportModal = async (c: any) => {
    setReportModal({ isOpen: true, cliente: c, text: '', loading: true, copied: false });
    
    const { data: vendas, error } = await supabase.from('vendas')
      .select(`
        id, produto_nome, data_venda, valor_total, num_parcelas, observacao,
        parcelas ( id, num_parcela, valor_parcela, data_vencimento, status_parcela, valor_pago )
      `)
      .eq('cliente_id', c.id)
      .order('data_venda', { ascending: false });

    if (error || !vendas) {
       setReportModal(prev => ({...prev, loading: false, text: 'Erro ao carregar dados do cliente.'}));
       return;
    }

    let report = `*RELATÓRIO FINANCEIRO E EXTRATO*\n`;
    report += `Cliente: ${c.nome}\n`;
    report += `WhatsApp: ${c.whatsapp}\n`;
    report += `CPF: ${c.cpf}\n`;
    report += `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

    if (vendas.length === 0) {
       report += `*Nenhuma compra registrada para este cliente.*\n`;
    } else {
       let totalAtrasado = 0;
       let totalAberto = 0;
       let totalPago = 0;

       vendas.forEach((v: any, index: number) => {
          report += `*${index + 1}. Compra: ${v.produto_nome}*\n`;
          report += `Data: ${v.data_venda.split('-').reverse().join('/')} | Total: ${Number(v.valor_total).toLocaleString('pt-BR', {style: 'currency', currency:'BRL'})}\n`;
          if (v.observacao) report += `Obs: ${v.observacao}\n`;
          
          const sortedParcelas = v.parcelas.sort((a: any, b: any) => a.num_parcela - b.num_parcela);
          sortedParcelas.forEach((p: any) => {
             const valParcela = Number(p.valor_parcela);
             const valPago = Number(p.valor_pago || 0);
             const pendente = valParcela - valPago;
             const venc = p.data_vencimento.split('-').reverse().join('/');
             let statusLine = '';

             const isOverdue = p.status_parcela !== 'pago' && new Date(p.data_vencimento) < new Date(new Date().toISOString().split('T')[0]);
             const trueStatus = isOverdue ? 'atrasado' : p.status_parcela;

             if (trueStatus === 'pago') {
               statusLine = `✔️ PAGO`;
               totalPago += valParcela;
             } else if (trueStatus === 'atrasado') {
               statusLine = `❌ ATRASADO`;
               if (valPago > 0) statusLine += ` (Pago: R$ ${valPago.toFixed(2)} | Falta: R$ ${pendente.toFixed(2)})`;
               totalAtrasado += pendente;
             } else {
               statusLine = `⏳ EM ABERTO`;
               if (valPago > 0) statusLine += ` (Parcial: R$ ${valPago.toFixed(2)} | Falta: R$ ${pendente.toFixed(2)})`;
               totalAberto += pendente;
             }

             report += `  - Parcela ${p.num_parcela}/${v.num_parcelas} (Venc: ${venc}): ${statusLine}\n`;
          });
          report += `\n`;
       });

       report += `-------------------------\n`;
       report += `*RESUMO DA CONTA:*\n`;
       report += `Total Pago: ${totalPago.toLocaleString('pt-BR', {style: 'currency', currency:'BRL'})}\n`;
       report += `Total em Atraso: ${totalAtrasado.toLocaleString('pt-BR', {style: 'currency', currency:'BRL'})}\n`;
       report += `Total a Vencer (Aberto): ${totalAberto.toLocaleString('pt-BR', {style: 'currency', currency:'BRL'})}\n`;
    }

    setReportModal(prev => ({...prev, loading: false, text: report}));
  };

  const copyReport = () => {
    navigator.clipboard.writeText(reportModal.text);
    setReportModal(prev => ({...prev, copied: true}));
    setTimeout(() => setReportModal(prev => ({...prev, copied: false})), 2000);
  }

  const confirmEdit = async () => {
    if (!supabase || !editModal.cliente) return;
    const c = editModal.cliente;
    
    if (!editModal.nome || !editModal.whatsapp) return alert('Nome e WhatsApp são obrigatórios');

    const { error } = await supabase.from('clientes').update({
      nome: editModal.nome,
      whatsapp: editModal.whatsapp,
      cpf: editModal.cpf
    }).eq('id', c.id);

    if (error) {
      console.error(error);
      alert('Erro ao atualizar cliente.');
    } else {
      setEditModal({ isOpen: false, cliente: null, nome: '', whatsapp: '', cpf: '' });
      loadClientes();
    }
  }

  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
         <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
         <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciamento de Clientes</h2>
      </div>

      <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Nome</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">WhatsApp</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">CPF</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Data Cadastro</th>
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading && <tr><td colSpan={5} className="text-center py-10 text-slate-500">Carregando...</td></tr>}
              
              {!loading && clientes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{c.nome}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{c.whatsapp}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{c.cpf}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(c.data_cadastro)}</td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                     <button 
                       onClick={() => openReportModal(c)}
                       className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md transition-colors"
                       title="Gerar Relatório Extraído"
                     >
                       <FileText className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => openEditModal(c)}
                       className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                       title="Editar Dados"
                     >
                       <Pencil className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => handleDelete(c.id, c.nome)}
                       className="inline-flex items-center justify-center p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors"
                       title="Apagar Cliente e Registros"
                     >
                       <UserX className="w-5 h-5" />
                     </button>
                  </td>
                </tr>
              ))}
              
              {!loading && clientes.length === 0 && (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      Nenhum cliente cadastrado.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editModal.isOpen && editModal.cliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Editar Cliente</h3>
              <button 
                onClick={() => setEditModal({ isOpen: false, cliente: null, nome: '', whatsapp: '', cpf: '' })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={editModal.nome}
                  onChange={e => setEditModal({...editModal, nome: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
                <input
                  type="text"
                  className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={editModal.whatsapp}
                  onChange={e => setEditModal({...editModal, whatsapp: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF</label>
                <input
                  type="text"
                  className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={editModal.cpf}
                  onChange={e => setEditModal({...editModal, cpf: e.target.value})}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
               <button 
                 onClick={() => setEditModal({ isOpen: false, cliente: null, nome: '', whatsapp: '', cpf: '' })}
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

      {reportModal.isOpen && reportModal.cliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                 <FileText className="w-5 h-5 text-indigo-500" />
                 Relatório do Cliente
              </h3>
              <button 
                onClick={() => setReportModal({ isOpen: false, cliente: null, text: '', loading: false, copied: false })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 flex-1">
              {reportModal.loading ? (
                 <div className="flex flex-col items-center justify-center h-48 space-y-4">
                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-slate-500">Extraindo pagamentos...</p>
                 </div>
              ) : (
                 <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    {reportModal.text}
                 </pre>
              )}
            </div>

            <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-between gap-3 shrink-0">
               <button 
                 onClick={() => setReportModal({ isOpen: false, cliente: null, text: '', loading: false, copied: false })}
                 className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
               >
                 Fechar
               </button>
               <button 
                 onClick={copyReport}
                 disabled={reportModal.loading}
                 className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
               >
                 {reportModal.copied ? <><Check className="w-4 h-4"/> Copiado!</> : <><Copy className="w-4 h-4" /> Copiar para WhatsApp</>}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
