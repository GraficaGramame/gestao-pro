/**
 * src/app/login/page.tsx
 * Página de Autenticação - Acesso ao Gestão Pro (Versão Blindada)
 */
'use client';
// Atualização de identidade
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Trava de segurança: Verifica se o Vercel injetou as chaves corretamente
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("Chave do banco ausente. Verifique o painel do Vercel.");
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Exibe exatamente o que o banco respondeu (ex: "Senha incorreta")
        setError(`Acesso negado: ${authError.message}`);
        setLoading(false);
      } else if (data?.session) {
        // Força a navegação bruta para limpar o cache de rotas do Next.js
        window.location.href = '/';
      } else {
        setError('Falha de resposta do servidor.');
        setLoading(false);
      }
    } catch (err: any) {
      // Captura erros silenciosos e vomita na tela
      setError(`Erro Crítico do Sistema: ${err?.message || 'Falha de conexão'}`);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 w-full">
      <div className="w-full max-w-md space-y-8 bg-slate-900 p-10 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-black text-green-500 tracking-tighter uppercase">Gramame Pro</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Acesse sua unidade de produção</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 text-[10px] font-bold uppercase p-4 rounded-xl text-center shadow-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">E-mail Corporativo</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm outline-none focus:border-green-500 transition-all text-slate-200"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Senha de Acesso</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-sm outline-none focus:border-green-500 transition-all text-slate-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-900/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest">
          Ambiente Seguro & Criptografado
        </p>
      </div>
    </main>
  );
}