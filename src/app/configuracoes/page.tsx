/**
 * src/app/configuracoes/page.tsx
 * Gestão de Identidade e Regras de Negócio do Tenant.
 * Arquivo completo para substituição total com o Motor de Precificação.
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

  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [minSignal, setMinSignal] = useState<number>(50);

  const [targetMargin, setTargetMargin] = useState<number>(30);
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [paymentFee, setPaymentFee] = useState<number>(0);
  const [apportionmentMethod, setApportionmentMethod] = useState<'PERCENTAGE' | 'HOURS' | 'FIXED_VALUE'>('PERCENTAGE');
  const [defaultLoss, setDefaultLoss] = useState<number>(0);

  useEffect(() => {
    async function fetchSettings() {
      if (!tenantId) return;
      setLoading(true);
      
      const { data: rawTenantData, error: tenantError } = await (supabase as any)
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (!tenantError && rawTenantData) {
        setStoreName(rawTenantData.name || '');
        setAddress(rawTenantData.address || '');
        setPhone(rawTenantData.phone || '');
        setPixKey(rawTenantData.pix_key || '');
        setMinSignal(rawTenantData.min_down_payment_pct || 50);
      }

      const { data: rawPricingData, error: pricingError } = await (supabase as any)
        .from('tenant_pricing_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (!pricingError && rawPricingData) {
        setTargetMargin(rawPricingData.target_margin);
        setTaxPercentage(rawPricingData.tax_percentage);
        setPaymentFee(rawPricingData.payment_fee_percentage);
        setApportionmentMethod(rawPricingData.fixed_cost_apportionment_method);
        setDefaultLoss(rawPricingData.default_loss_percentage);
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

    const { error: tenantError } = await (supabase as any)
      .from('tenants')
      .update({
        name: storeName,
        address: address,
        phone: phone,
        pix_key: pixKey,
        min_down_payment_pct: minSignal
      })
      .eq('id', tenantId);

    const { error: pricingError } = await (supabase as any)
      .from('tenant_pricing_configs')
      .upsert({
        tenant_id: tenantId,
        target_margin: targetMargin,
        tax_percentage: taxPercentage,
        payment_fee_percentage: paymentFee,
        fixed_cost_apportionment_method: apportionmentMethod,
        default_loss_percentage: defaultLoss,
        updated_at: new Date().toISOString()
      }, { onConflict: 'tenant_id' });

    if (tenantError || pricingError) {
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
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Identidade, Regras da Loja e Motor de Precificação</p>
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

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-cyan-500 border-b border-slate-800 pb-3">Motor de Precificação (SaaS)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Margem Alvo de Lucro Líquido (%)</label>
                <input 
                  type="number" step="0.01" value={targetMargin} onChange={e => setTargetMargin(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 font-mono text-cyan-400"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Impostos sobre Venda (%)</label>
                <input 
                  type="number" step="0.01" value={taxPercentage} onChange={e => setTaxPercentage(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Taxa de Cartão / Gateway (%)</label>
                <input 
                  type="number" step="0.01" value={paymentFee} onChange={e => setPaymentFee(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Perda Técnica Padrão (%)</label>
                <input 
                  type="number" step="0.01" value={defaultLoss} onChange={e => setDefaultLoss(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Método de Rateio de Custo Fixo</label>
                <select 
                  value={apportionmentMethod} 
                  onChange={e => setApportionmentMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500 font-bold"
                >
                  <option value="PERCENTAGE">Percentual sobre Faturamento Esperado</option>
                  <option value="FIXED_VALUE">Valor Fixo por Item (R$)</option>
                  <option value="HOURS">Hora de Máquina/Produção</option>
                </select>
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