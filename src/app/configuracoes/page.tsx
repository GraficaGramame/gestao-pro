/**
 * src/app/configuracoes/page.tsx
 * Gestão de Identidade e Regras de Negócio do Tenant.
 * Arquivo completo para substituição total.
 */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

export default function ConfiguracoesPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Estados dos dados da loja
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [minSignal, setMinSignal] = useState<number>(50);

  useEffect(() => {
    async function fetchSettings() {
      if (!tenantId) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tenants' as any)
        .select('*')
        .eq('id', tenantId)
        .single();

      if (!error && data) {
        setStoreName(data.name || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setPixKey(data.pix_key || '');
        setMinSignal(data.min_down_payment_pct || 50);
      }
      setLoading(false);
    }
    fetchSettings();
  }, [tenantId]);

  if (authLoading || !tenantId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-black uppercase tracking-widest animate-pulse">
        Sincronizando Perfil...
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const { error } = await supabase
      .from('tenants' as any)
      .update({
        name: storeName,
        address: address,
        phone: phone,
        pix_key: pixKey,
        min_down_payment_pct: minSignal
      })
      .eq('id', tenantId);

    if (error) {
      setFeedback({ type: 'error', msg: 'Erro ao salvar configurações.' });
    } else {
      setFeedback({ type: 'success', msg: 'Configurações atualizadas com sucesso!' });
      setTimeout(() => setFeedback(null), 3000);
    }
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex-1">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase text-green-500">Configurações</h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Identidade e Regras da Loja</p>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          {feedback && (
            <div className={`p-4 rounded-xl border font-bold text-xs uppercase tracking-widest text-center ${
              feedback.type === 'success' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500 text-red-400'
            }`}>
              {feedback.msg}
            </div>
          )}

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-3">Dados da Empresa (PDFs)</h2>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Nome Fantasia / Razão Social</label>
              <input 
                type="text" value={storeName} onChange={e => setStoreName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Endereço Completo</label>
              <input 
                type="text" value={address} onChange={e => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">WhatsApp de Contato</label>
              <input 
                type="text" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 font-mono"
              />
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800 pb-3">Financeiro e Regras</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Chave PIX para Recebimento</label>
                <input 
                  type="text" value={pixKey} onChange={e => setPixKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 font-mono text-green-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Sinal Mínimo Sugerido (%)</label>
                <input 
                  type="number" value={minSignal} onChange={e => setMinSignal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 font-mono"
                />
              </div>
            </div>
          </section>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-900/10 transition-all disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </main>
  );
}