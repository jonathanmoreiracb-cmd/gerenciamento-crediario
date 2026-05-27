'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, ArrowRight, User } from 'lucide-react';

function LoginForm() {
  const [operators, setOperators] = useState<any[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<any | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingOps, setLoadingOps] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') || '/';

  // Load operators from API
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const res = await fetch('/api/operators');
        const data = await res.json();
        if (data.success && data.operators) {
          setOperators(data.operators);
        }
      } catch (err) {
        console.error('Erro ao buscar operadores:', err);
      } finally {
        setLoadingOps(false);
      }
    };
    fetchOperators();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) {
      setError('Por favor, selecione seu operador.');
      return;
    }
    if (!password) {
      setError('Por favor, insira sua senha de acesso.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: selectedOperator.username, 
          password 
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(redirect);
        router.refresh();
      } else {
        setError(data.error || 'Senha incorreta. Tente novamente.');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua rede e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Background Radial Gradients & Glows */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      {/* Glassmorphic Login Container */}
      <div className="relative w-full max-w-lg px-4 py-8">
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/65 rounded-2xl p-8 shadow-2xl shadow-indigo-950/20 transition-all duration-300 hover:border-slate-700/50">
          
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-[1.5px] shadow-lg shadow-indigo-500/10 mb-4">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
              Fitch Crediário
            </h1>
            <p className="text-sm text-slate-400 mt-2">
              Selecione seu operador para acessar o painel de gerenciamento.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Operator Selection Grid */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 text-center">
                Quem está operando o sistema?
              </label>
              
              {loadingOps ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {operators.map((op) => {
                    const isSelected = selectedOperator?.username === op.username;
                    return (
                      <button
                        key={op.username}
                        type="button"
                        onClick={() => {
                          setSelectedOperator(op);
                          setError('');
                        }}
                        className={`flex flex-col items-center p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30 scale-[1.03] shadow-md shadow-indigo-500/10'
                            : 'bg-slate-950/30 border-slate-800 hover:border-slate-700/50 hover:bg-slate-900/20'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm tracking-wide mb-2.5 transition-colors ${
                          isSelected 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {getInitials(op.nome)}
                        </div>
                        <span className={`text-xs font-semibold text-center truncate w-full ${
                          isSelected ? 'text-white font-bold' : 'text-slate-400'
                        }`}>
                          {op.nome.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Slide down inputs when operator is selected */}
            {selectedOperator && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Senha de Acesso de {selectedOperator.nome.split(' ')[0]}
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha secreta"
                      className="w-full pl-4 pr-12 py-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 outline-none transition-all duration-300 focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 group-hover:border-slate-700/80 font-mono text-center"
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3.5 bg-red-950/30 border border-red-900/30 rounded-xl text-sm text-red-400 flex items-center gap-2 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 active:scale-[0.98] text-white py-3.5 px-4 rounded-xl font-medium tracking-wide shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Painel</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-600 mt-6 tracking-wide">
          © {new Date().getFullYear()} Fitch Tecnologia LTDA. Todos os direitos reservados.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
