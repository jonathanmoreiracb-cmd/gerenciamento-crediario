'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface User {
  id: string;
  nome: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logAction: (action: string, description: string, details?: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logAction: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logAction = async (action: string, description: string, details?: any) => {
    if (!supabase) return;
    
    const userName = user?.nome || 'Operador Anônimo';
    const userId = user?.id || null;

    try {
      await supabase.from('historico_acoes').insert({
        usuario_id: userId,
        usuario_nome: userName,
        acao: action,
        descricao: description,
        detalhes: details || {}
      });
    } catch (err) {
      console.error('Erro ao registrar log de auditoria:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logAction, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
