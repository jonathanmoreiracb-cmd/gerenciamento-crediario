'use client';

import { useEffect, useState } from 'react';
import { UserX, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
                  <td className="px-6 py-4 text-right whitespace-nowrap">
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
    </div>
  );
}
