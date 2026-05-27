'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/context/AuthContext';
import { History, Search, User, Filter, Eye, X } from 'lucide-react';

export default function HistoricoPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('todos');
  const [actionFilter, setActionFilter] = useState('todos');
  const [operators, setOperators] = useState<string[]>([]);
  
  // Modal for displaying details JSON
  const [selectedDetails, setSelectedDetails] = useState<any | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    if (!supabase) return;
    
    const { data, error } = await supabase
      .from('historico_acoes')
      .select('*')
      .order('data_criacao', { ascending: false });

    if (error) {
      console.error(error);
    } else if (data) {
      setLogs(data);
      
      // Extract unique operators list
      const uniqueOps = Array.from(new Set(data.map((l: any) => l.usuario_nome))) as string[];
      setOperators(uniqueOps);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('excluir') || action.includes('delete') || action.includes('estorno')) {
      return 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-900/30';
    }
    if (action.includes('criar') || action.includes('insert') || action.includes('pagamento')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30';
    }
    if (action.includes('editar') || action.includes('update')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'criar_venda': return 'Nova Venda';
      case 'editar_venda': return 'Edição de Venda';
      case 'excluir_venda': return 'Exclusão de Venda';
      case 'pagamento_parcela': return 'Recebimento';
      case 'estorno_parcela': return 'Estorno / Reabertura';
      case 'editar_parcela': return 'Alteração de Parcela';
      case 'criar_cliente': return 'Novo Cliente';
      case 'editar_cliente': return 'Edição de Cliente';
      case 'excluir_cliente': return 'Exclusão de Cliente';
      case 'alterar_senha': return 'Alteração de Senha';
      default: return action;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesOperator = operatorFilter === 'todos' || log.usuario_nome === operatorFilter;
    
    const matchesAction = actionFilter === 'todos' || log.acao === actionFilter;

    return matchesSearch && matchesOperator && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Auditoria & Histórico de Operações</h2>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por descrição ou ação..."
            className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Operator Filter */}
        <div className="relative">
          <select
            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 py-2.5 px-3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border text-sm"
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
          >
            <option value="todos">👤 Todos os Operadores</option>
            {operators.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div className="relative">
          <select
            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 py-2.5 px-3 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border text-sm"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="todos">⚙️ Todas as Ações</option>
            <option value="criar_venda">🛍️ Novas Vendas</option>
            <option value="editar_venda">✏️ Edições de Vendas</option>
            <option value="excluir_venda">🗑️ Exclusões de Vendas</option>
            <option value="pagamento_parcela">💵 Recebimentos</option>
            <option value="estorno_parcela">↩️ Estornos</option>
            <option value="editar_cliente">👥 Edições de Clientes</option>
            <option value="alterar_senha">🔑 Alterações de Senha</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap w-[15%]">Data / Hora</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap w-[15%]">Operador</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap w-[15%]">Operação</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap w-[50%]">Descrição</th>
                <th className="px-6 py-4 font-medium text-right whitespace-nowrap w-[5%]">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    Aguardando registros de auditoria...
                  </td>
                </tr>
              )}

              {!loading && filteredLogs.map((log) => {
                const date = new Date(log.data_criacao);
                const formatado = `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                
                return (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-xs">
                      {formatado}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                      {log.usuario_nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getActionBadgeColor(log.acao)}`}>
                        {getActionLabel(log.acao)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                      {log.descricao}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {log.detalhes && Object.keys(log.detalhes).length > 0 ? (
                        <button
                          onClick={() => setSelectedDetails(log.detalhes)}
                          className="inline-flex items-center justify-center p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                          title="Ver Detalhes Técnicos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum registro encontrado no histórico.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details JSON Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Metadados e Alterações</h3>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 flex-1">
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                {JSON.stringify(selectedDetails, null, 2)}
              </pre>
            </div>

            <div className="px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedDetails(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
