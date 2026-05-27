/**
 * src/components/auth/auth-provider.tsx
 * Provedor de contexto para gerenciar a sessão e o logoff.
 */
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  loading: boolean;
  signOut: () => Promise<void>; // Adicionado a função de logoff
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  tenantId: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Função de logoff para ser usada em qualquer parte do sistema
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTenantId(null);
    window.location.href = '/login'; // Força o redirecionamento
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null);
      setTenantId(session?.user?.id ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      setTenantId(session?.user?.id ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, tenantId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);