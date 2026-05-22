/**
 * src/app/relatorios/page.tsx
 * Painel de BI e Inteligência de Negócio.
 * Focado em análise de rentabilidade e volume por produto.
 */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { calculateItemHealth } from '@/lib/calculations/pricing';

interface ProductStats {
  name: string;
  count: number;
  revenue: number;
  cost: number;
  margin: number;
}

export default function RelatoriosPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [stats, setProductStats] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBI() {
      if (!tenantId) return;
      setLoading(true);

      // Busca itens de pedidos que não foram cancelados
      const { data, error } = await (supabase as any)
        .from('order_items')
        .select('description, total_price, cost_total, orders!inner(tenant_id, status)')
        .eq('orders.tenant_id', tenantId)
        .neq('orders.status', 'CANCELLED');

      if (!error && data) {
        const productMap: Record<string, { count: number; revenue: number; cost: number }> = {};

        data.forEach((item: any) => {
          // Agrupa por nome base (remove detalhes de largura/altura da descrição)
          const name = item.description.split(' - ')[0]; 
          if (!productMap[name]) productMap[name] = { count: 0, revenue: 0, cost: 0 };
          productMap[name].count += 1;
          productMap[name].revenue += Number(item.total_price);
          productMap[name].cost += Number(item.cost_total);
        });

        const formatted: ProductStats[] = Object.entries(productMap).map(([name, val]) => {
          const health = calculateItemHealth(val.revenue, val.cost);
          return { name, ...val, margin: health.margin };
        }).sort((a, b) => b.revenue - a.revenue); // Ordena por faturamento

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
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Análise de Performance de Catálogo</p>
      </header>

      <div className="grid grid-cols-1 gap-8 max-w-6xl pb-20">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-slate-800 bg-slate-800/30">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-300">Ranking de Rentabilidade</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800/50 text-slate-500 font-black uppercase text-[9px] tracking-widest">
                <tr>
                  <th className="px-6 py-4">Produto</th>
                  <th className="px-6 py-4 text-center">Vendas</th>
                  <th className="px-6 py-4 text-right">Faturamento</th>
                  <th className="px-6 py-4 text-right">Margem Média</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center animate-pulse text-slate-600 uppercase font-black text-xs">Analisando banco de dados...</td></tr>
                ) : stats.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5 font-bold text-slate-200">{item.name}</td>
                    <td className="px-6 py-5 text-center font-mono text-slate-400 font-bold">{item.count}</td>
                    <td className="px-6 py-5 text-right font-black font-mono text-green-500">R$ {item.revenue.toFixed(2)}</td>
                    <td className="px-6 py-5 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black font-mono border ${
                        item.margin >= 30 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
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
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Dica do Especialista</h3>
             <p className="text-slate-400 text-xs leading-relaxed italic">
               "Produtos com margem abaixo de 30% podem estar consumindo sua operação sem gerar lucro líquido real. Considere reajustar o preço base ou trocar de fornecedor."
             </p>
          </div>
        </div>
      </div>
    </main>
  );
}