'use client';

import { useEffect, useState } from 'react';
import { UserX, Users, Pencil, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{isOpen: boolean; cliente: any; nome: string; whatsapp: string; cpf: string}>({
    isOpen: false, cliente: null, nome: '', whatsapp: '', cpf: ''
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
    </div>
  );
}
