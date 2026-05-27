'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Settings, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, logAction, refreshUser } = useAuth();
  
  const [nome, setNome] = useState('');
  const [senhaAntiga, setSenhaAntiga] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auxiliary SHA-256 hashing
  async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;
    
    const targetNome = nome.trim();
    if (!targetNome) {
      setErrorMsg('O nome de exibição é obrigatório.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Query and update by username to avoid fallback UUID mismatch issues
      const { error } = await supabase
        .from('usuarios')
        .update({ nome: targetNome })
        .eq('username', user.username);

      if (error) throw error;

      await logAction('editar_operador', `Operador alterou seu nome de "${user.nome}" para "${targetNome}"`, { oldName: user.nome, newName: targetNome });
      await refreshUser();
      
      setSuccessMsg('Nome atualizado com sucesso!');
      setNome('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar nome.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;

    if (!senhaAntiga || !novaSenha || !confirmarSenha) {
      setErrorMsg('Preencha todos os campos de senha.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErrorMsg('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (novaSenha.length < 4) {
      setErrorMsg('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Query by username to avoid fallback UUID mismatch issues
      const { data: dbUser, error: queryErr } = await supabase
        .from('usuarios')
        .select('id, senha_hash')
        .eq('username', user.username)
        .maybeSingle();

      if (queryErr) {
        throw new Error(`Erro ao consultar usuário no banco: ${queryErr.message}`);
      }
      
      if (!dbUser) {
        throw new Error('Usuário não encontrado na tabela do banco de dados. Verifique se o script SQL foi executado no Supabase.');
      }

      const hashedOldInput = await sha256(senhaAntiga);
      if (dbUser.senha_hash !== hashedOldInput) {
        throw new Error('A senha antiga informada está incorreta.');
      }

      const hashedNew = await sha256(novaSenha);
      const { error: updateErr } = await supabase
        .from('usuarios')
        .update({ senha_hash: hashedNew })
        .eq('id', dbUser.id);

      if (updateErr) throw updateErr;

      await logAction('alterar_senha', `Operador ${user.nome} alterou sua própria senha de acesso`);
      
      setSuccessMsg('Senha de acesso atualizada com sucesso!');
      setSenhaAntiga('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações da Conta</h2>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-800 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Dados de Perfil</h3>
            <p className="text-sm text-slate-500">Altere suas informações públicas de exibição.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome de Exibição</label>
              <input
                type="text"
                placeholder={user?.nome || 'Seu nome'}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nome de Usuário (Username)</label>
              <input
                type="text"
                value={user?.username ? `@${user.username}` : ''}
                className="block w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-400 font-mono select-none"
                disabled
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar Nome'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Segurança e Senha</h3>
            <p className="text-sm text-slate-500">Mantenha sua conta segura alterando sua senha periodiamente.</p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha Atual</label>
              <input
                type={showSenha ? 'text' : 'password'}
                value={senhaAntiga}
                onChange={(e) => setSenhaAntiga(e.target.value)}
                placeholder="Sua senha atual"
                className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nova Senha</label>
              <input
                type={showSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="block w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirmar Nova Senha</label>
              <div className="relative group">
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="block w-full pl-3 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Alterar Senha'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
