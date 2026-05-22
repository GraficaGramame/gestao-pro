/**
 * src/app/marketing/page.tsx
 * Hub de Marketing Multi-tenant - Versão com tipagem explícita e correção de alertas.
 * Responsável pela gestão de cupons e fidelização de aniversariantes.
 */
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Customer, Coupon } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';

export default function MarketingPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [birthdays, setBirthdays] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [discountValue, setDiscountValue] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMarketingData = async (): Promise<void> => {
    if (!tenantId) return;
    setLoading(true);
    
    const { data: cpData } = await supabase
      .from('coupons')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
      
    if (cpData) setCoupons(cpData);

    const { data: custData } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('birthdate', 'is', null);

    if (custData) {
      const currentMonth = new Date().getMonth();
      // Correção do alerta: Tipagem explícita do parâmetro 'c' como Customer
      const bdaysThisMonth = custData.filter((c: Customer) => {
        if (!c.birthdate) return false;
        const bdate = new Date(c.birthdate);
        return new Date(bdate.getTime() + Math.abs(bdate.getTimezoneOffset() * 60000)).getMonth() === currentMonth;
      });
      setBirthdays(bdaysThisMonth);
    }
    setLoading(false);
  };

  useEffect(() => { 
    fetchMarketingData(); 
  }, [tenantId]);

  if (authLoading || !tenantId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-black uppercase tracking-widest animate-pulse">
        Sincronizando Campanhas...
      </div>
    );
  }

  const handleCreateCoupon = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    const val = parseFloat(discountValue.replace(',', '.'));

    const payload = {
      tenant_id: tenantId,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: val,
      valid_until: validUntil ? new Date(validUntil).toISOString() : null,
      is_active: true,
    };

    await supabase.from('coupons').insert(payload);
    setCode(''); 
    setDiscountValue(''); 
    setValidUntil('');
    fetchMarketingData();
    setSubmitting(false);
  };

  const toggleCouponStatus = async (id: string, currentStatus: boolean): Promise<void> => {
    await supabase
      .from('coupons')
      .update({ is_active: !currentStatus })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    fetchMarketingData();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex-1">
      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tighter uppercase text-green-500">Marketing</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Fidelização e Retenção</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl">
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-6">Novo Cupom</h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <input 
                type="text" required value={code} onChange={e => setCode(e.target.value)} 
                placeholder="CÓDIGO (EX: VERÃO20)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-black uppercase text-green-400 outline-none focus:border-green-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <select 
                  value={discountType} onChange={e => setDiscountType(e.target.value as 'FIXED' | 'PERCENTAGE')}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold uppercase outline-none"
                >
                  <option value="FIXED">Valor Fixo (R$)</option>
                  <option value="PERCENTAGE">Porcentagem (%)</option>
                </select>
                <input 
                  type="number" step="0.01" required value={discountValue} onChange={e => setDiscountValue(e.target.value)} 
                  placeholder="VALOR"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono outline-none"
                />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-900/10 transition-all">
                {submitting ? 'Gerando...' : 'Ativar Cupom'}
              </button>
            </form>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-500 font-black uppercase text-[9px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4 text-right">Desconto</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {coupons.map((c: Coupon) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-black text-slate-200">{c.code}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-green-400">
                      {c.discount_type === 'FIXED' ? `R$ ${c.discount_value}` : `${c.discount_value}%`}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleCouponStatus(c.id, c.is_active)}
                        className={`text-[9px] font-black px-2 py-1 rounded uppercase transition-colors ${
                          c.is_active ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        }`}
                      >
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        <div className="lg:col-span-5">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full">
            <h2 className="text-[11px] font-black uppercase tracking-widest mb-6">🎂 Aniversariantes do Mês ({birthdays.length})</h2>
            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {birthdays.map((cust: Customer) => (
                <div key={cust.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center group hover:border-green-500/50 transition-all">
                  <div>
                    <p className="text-sm font-black text-slate-200 leading-tight">{cust.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold font-mono mt-1">{cust.whatsapp}</p>
                  </div>
                  <a 
                    href={`https://wa.me/55${cust.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/20 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all"
                  >
                    WhatsApp
                  </a>
                </div>
              ))}
              {birthdays.length === 0 && (
                <p className="text-center py-10 text-slate-600 text-xs font-bold uppercase italic tracking-widest">
                  Nenhum aniversário este mês
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}