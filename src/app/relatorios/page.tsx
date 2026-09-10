/**
 * src/app/relatorios/page.tsx
 * Painel de BI e Inteligência de Negócio.
 * Focado em análise de rentabilidade, lucro real e volume por produto (Fase 6).
 */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { calculateItemHealth } from '@/lib/calculations/pricing';

interface ProductStats {
  name: string;
  salesCount: number;
  unitsSold: number;
  revenue: number;
  legacyCost: number;
  netProfit: number;
  margin: number;
  usesAdvancedEngine: boolean;
}

export default function RelatoriosPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [stats, setProductStats] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBI() {
      if (!tenantId) return;
      setLoading(true);

      // Busca itens de pedidos que não foram cancelados, incluindo as novas colunas de snapshot
      const { data, error } = await (supabase as any)
        .from('order_items')
        .select('description, total_price, cost_total, quantity, cost_snapshot, net_margin, orders!inner(tenant_id, status)')
        .eq('orders.tenant_id', tenantId)
        .neq('orders.status', 'CANCELLED');

      if (!error && data) {
        const productMap: Record<string, { 
          salesCount: number; 
          unitsSold: number; 
          revenue: number; 
          legacyCost: number; 
          netProfit: number;
          hasSaaSSnapshot: boolean;
        }> = {};

        data.forEach((item: any) => {
          // Agrupa por nome base (remove detalhes de largura/altura da descrição para unificar o produto)
          const name = item.description.split(' - ')[0].split(' (')[0]; 
          
          if (!productMap[name]) {
            productMap[name] = { salesCount: 0, unitsSold: 0, revenue: 0, legacyCost: 0, netProfit: 0, hasSaaSSnapshot: false };
          }

          const itemRevenue = Number(item.total_price);
          const itemQty = Number(item.quantity) || 1;
          let itemNetProfit = 0;

          // Verificação Híbrida de Rentabilidade
          if (item.cost_snapshot && item.cost_snapshot.unitProfitability) {
            // Usa o Lucro Líquido exato congelado no momento da venda (Motor SaaS)
            itemNetProfit = item.cost_snapshot.unitProfitability.netProfit * item.cost_snapshot.saleQuantity;
            productMap[name].hasSaaSSnapshot = true;
          } else {
            // Usa a métrica legada de Saúde Financeira (custo fixo estimado em 15%)
            const health = calculateItemHealth(itemRevenue, Number(item.cost_total));
            itemNetProfit = health.netProfit;
            productMap[name].legacyCost += Number(item.cost_total);
          }

          productMap[name].salesCount += 1;
          productMap[name].unitsSold += itemQty;
          productMap[name].revenue += itemRevenue;
          productMap[name].netProfit += itemNetProfit;
        });

        const formatted: ProductStats[] = Object.entries(productMap).map(([name, val]) => {
          // Calcula a margem final média do produto com base no lucro líquido real
          const finalMargin = val.revenue > 0 ? (val.netProfit / val.revenue) * 100 : 0;
          
          return { 
            name, 
            salesCount: val.salesCount,
            unitsSold: val.unitsSold,
            revenue: val.revenue,
            legacyCost: val.legacyCost,
            netProfit: val.netProfit,
            margin: finalMargin,
            usesAdvancedEngine: val.hasSaaSSnapshot
          };
        }).sort((a, b) => b.revenue - a.revenue); // Ordena por maior faturamento

        setProductStats(formatted);
      }
      setLoading(false);
    }
    fetchBI();
  }, [tenantId]);

  if (authLoading || !tenantId) return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-black uppercase tracking-widest animate-pulse text-xs">
      Processando Inteligência de Dados...
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex-1 overflow-y-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-black tracking-tighter uppercase text-green-500">Business Intelligence</h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Análise de Performance e Rentabilidade Real (SaaS)</p>
      </header>

      <div className="grid grid-cols-1 gap-8 max-w-6xl pb-20">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-300">Ranking de Rentabilidade</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-[9px] text-cyan-400 font-black uppercase tracking-widest">Motor SaaS Ativo</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="bg-slate-800/50 text-slate-500 font-black uppercase text-[9px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4 text-center" title="Quantas vezes o produto foi vendido">Vendas</th>
                  <th className="px-6 py-4 text-right">Faturamento</th>
                  <th className="px-6 py-4 text-right" title="Valor real que sobra no bolso após todos os custos">Lucro Líquido</th>
                  <th className="px-6 py-4 text-right">Margem Real</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center animate-pulse text-slate-600 uppercase font-black text-xs">Analisando banco de dados...</td></tr>
                ) : stats.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{item.name}</span>
                        {item.usesAdvancedEngine && (
                          <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-[1px] rounded text-[8px] font-black uppercase tracking-widest" title="Rentabilidade exata baseada no motor de custos">Precisão Máxima</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-mono text-slate-300 font-bold">{item.salesCount}</span>
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">{item.unitsSold} un</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black font-mono text-slate-300">R$ {item.revenue.toFixed(2)}</td>
                    <td className="px-6 py-5 text-right font-black font-mono text-green-500">R$ {item.netProfit.toFixed(2)}</td>
                    <td className="px-6 py-5 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black font-mono border ${
                        item.margin >= 30 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        item.margin > 15 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {item.margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <svg className="w-24 h-24 text-cyan-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
             </div>
             <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-4 relative z-10">Inteligência de Custos Ativa</h3>
             <p className="text-slate-300 text-xs leading-relaxed font-medium relative z-10">
               Os produtos marcados com <strong className="text-cyan-400">Precisão Máxima</strong> estão utilizando a nova estrutura de insumos, contabilizando perdas técnicas, taxas financeiras e impostos. Produtos sem a marcação continuam utilizando a estimativa de 15% de custos fixos.
             </p>
          </div>
        </div>
      </div>
    </main>
  );
}