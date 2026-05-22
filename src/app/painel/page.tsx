/**
 * src/app/painel/page.tsx
 * Dashboard Interativo - Entradas, Pendências e Gestão de Despesas Variáveis
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

type DateFilter = 'today' | 'yesterday' | '7days' | 'month';

export default function Dashboard() {
  const { tenantId, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DateFilter>('month');
  
  // Modais
  const [isReceiptsModalOpen, setIsReceiptsModalOpen] = useState(false);
  const [isFutureModalOpen, setIsFutureModalOpen] = useState(false);
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  
  // Edição Entradas
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');

  // Formulário Nova Despesa
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCat, setExpCat] = useState('MAINTENANCE');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expIsPaid, setExpIsPaid] = useState(true);

  const [metrics, setMetrics] = useState({
    totalFaturado: 0,
    recebimentosFuturos: 0,
    custoMaterial: 0,
    totalCustosFixos: 0,
    totalDespesasPagas: 0,
    totalAPagar: 0,
    pedidosAtivos: 0,
  });

  const [detailedReceipts, setDetailedReceipts] = useState<any[]>([]);
  const [detailedFuture, setDetailedFuture] = useState<any[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const parseSafeDate = (dateString: string) => {
    if (!dateString) return new Date();
    const datePart = dateString.split('T')[0].split(' ')[0];
    return new Date(`${datePart}T12:00:00`);
  };

  async function fetchDashboardData() {
    if (!tenantId) return;
    setLoading(true);

    try {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      if (activeFilter === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (activeFilter === 'yesterday') {
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
      } else if (activeFilter === '7days') {
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
      }

      const startDateIso = startDate.toISOString();
      const endDateIso = endDate.toISOString();
      const startDateString = startDateIso.split('T')[0];
      const endDateString = endDateIso.split('T')[0];

      // 1. CUSTOS FIXOS
      const { data: fixedCosts } = await (supabase as any).from('fixed_costs').select('amount').eq('tenant_id', tenantId);
      const totalFixoMensal = fixedCosts?.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0;
      let divisorCustoFixo = activeFilter === 'today' || activeFilter === 'yesterday' ? 30 : activeFilter === '7days' ? 30/7 : 1;
      const totalFixoProporcional = totalFixoMensal / divisorCustoFixo;

      // 2. ENTRADAS REAIS
      const { data: receiptsData } = await (supabase as any)
        .from('receipts')
        .select(`id, amount, payment_date, description, orders(id, customers(name))`)
        .eq('tenant_id', tenantId)
        .gte('payment_date', startDateIso)
        .lte('payment_date', endDateIso)
        .order('payment_date', { ascending: false });

      setDetailedReceipts(receiptsData || []);
      const totalFaturado = receiptsData?.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0;

      // 3. A RECEBER (DETALHADO)
      const { data: futureData } = await (supabase as any)
        .from('orders')
        .select('id, total, created_at, customers(name), receipts(amount)')
        .eq('tenant_id', tenantId)
        .in('payment_status', ['PENDING', 'PARTIAL'])
        .in('status', ['SERVICE_ORDER', 'PRODUCTION', 'COMPLETED'])
        .order('created_at', { ascending: false });

      let totalA_Receber = 0;
      const futureList = futureData?.map((order: any) => {
        const paid = order.receipts?.reduce((acc: number, r: any) => acc + Number(r.amount), 0) || 0;
        const balance = Number(order.total) - paid;
        totalA_Receber += balance;
        return { ...order, balance };
      }).filter((o: any) => o.balance > 0) || [];

      setDetailedFuture(futureList);

      // 4. CUSTOS DE MATERIAL
      const { data: currentOrders } = await (supabase as any).from('orders').select('id').eq('tenant_id', tenantId).gte('created_at', startDateIso).lte('created_at', endDateIso).neq('status', 'CANCELLED').neq('status', 'QUOTATION');
      const orderIds = currentOrders?.map((o: any) => o.id) || [];
      let custoMaterial = 0;
      if (orderIds.length > 0) {
        const { data: orderItems } = await (supabase as any).from('order_items').select('cost_total').in('order_id', orderIds);
        custoMaterial = orderItems?.reduce((acc: number, curr: any) => acc + Number(curr.cost_total), 0) || 0;
      }

      // 5. DESPESAS EXTRAS (PAGAS NO PERÍODO E PENDENTES)
      const { data: expensesData } = await (supabase as any)
        .from('expenses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('due_date', { ascending: true });

      let totalDespesasPagas = 0;
      let totalAPagar = 0;
      const pendingList: any[] = [];

      expensesData?.forEach((exp: any) => {
        if (exp.payment_date) {
          // Se foi paga dentro do período filtrado, entra no custo real do dia/semana/mês
          if (exp.payment_date >= startDateString && exp.payment_date <= endDateString) {
            totalDespesasPagas += Number(exp.amount);
          }
        } else {
          // Conta em aberto global
          totalAPagar += Number(exp.amount);
          pendingList.push(exp);
        }
      });
      setPendingExpenses(pendingList);

      // 6. PEDIDOS ATIVOS
      const { count: pedidosAtivos } = await (supabase as any).from('orders').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('status', ['SERVICE_ORDER', 'PRODUCTION']);

      setMetrics({ 
        totalFaturado, 
        recebimentosFuturos: totalA_Receber, 
        custoMaterial, 
        totalCustosFixos: totalFixoProporcional, 
        totalDespesasPagas,
        totalAPagar,
        pedidosAtivos: pedidosAtivos || 0 
      });

      // GRÁFICO
      if (receiptsData && receiptsData.length > 0) {
        const groupedData: Record<string, number> = {};
        receiptsData.forEach((receipt: any) => {
          const date = parseSafeDate(receipt.payment_date);
          const dayKey = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          groupedData[dayKey] = (groupedData[dayKey] || 0) + Number(receipt.amount);
        });
        const chartFormat = Object.keys(groupedData).sort().map(key => ({ name: key, Recebido: groupedData[key] }));
        setChartData(chartFormat);
      } else {
        setChartData([]);
      }
    } catch (error) {
      console.error('Erro no dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) fetchDashboardData();
  }, [tenantId, authLoading, activeFilter]);

  // Edição Entradas
  const handleUpdateReceipt = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('receipts').update({ amount: parseFloat(editAmount), payment_date: editDate }).eq('id', id);
      if (error) throw error;
      setEditingId(null);
      fetchDashboardData();
    } catch (error) {
      alert('Erro ao atualizar o recebimento.');
    }
  };

  const startEditing = (receipt: any) => {
    setEditingId(receipt.id);
    setEditAmount(receipt.amount.toString());
    setEditDate(receipt.payment_date.split('T')[0]);
  };

  // Funções de Despesa
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc || !expAmount || !expDate) return;
    try {
      const { error } = await (supabase as any).from('expenses').insert({
        tenant_id: tenantId,
        description: expDesc,
        amount: parseFloat(expAmount),
        category: expCat,
        due_date: expDate,
        payment_date: expIsPaid ? expDate : null
      });
      if (error) throw error;
      
      setExpDesc(''); setExpAmount(''); setExpDate(new Date().toISOString().split('T')[0]); setExpIsPaid(true);
      fetchDashboardData();
    } catch (error) {
      alert('Erro ao lançar despesa.');
    }
  };

  const handlePayExpense = async (id: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await (supabase as any).from('expenses').update({ payment_date: today }).eq('id', id);
      if (error) throw error;
      fetchDashboardData();
    } catch (error) {
      alert('Erro ao dar baixa na despesa.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if(!confirm("Deseja realmente apagar esta despesa?")) return;
    try {
      const { error } = await (supabase as any).from('expenses').delete().eq('id', id);
      if (error) throw error;
      fetchDashboardData();
    } catch (error) {
      alert('Erro ao apagar despesa.');
    }
  };

  // Matemática Master
  const lucroLiquido = metrics.totalFaturado - metrics.custoMaterial - metrics.totalCustosFixos - metrics.totalDespesasPagas;
  const isLucroPositivo = lucroLiquido >= 0;
  const margemLucro = metrics.totalFaturado > 0 ? (lucroLiquido / metrics.totalFaturado) * 100 : 0;

  if (loading || authLoading) return (
    <div className="flex-1 h-screen flex items-center justify-center bg-slate-950">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex-1 p-10 h-screen overflow-y-auto bg-slate-950 custom-scrollbar relative">
      
      {/* HEADER E FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Painel de Controle</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Gestão Gramame • Regime de Caixa Real</p>
        </div>
        <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow-2xl">
          {(['today', 'yesterday', '7days', 'month'] as DateFilter[]).map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-green-500 text-slate-950 shadow-lg scale-105' : 'text-slate-500 hover:text-slate-300'}`}>
              {f === 'today' ? 'Hoje' : f === 'yesterday' ? 'Ontem' : f === '7days' ? '7 Dias' : 'Mês'}
            </button>
          ))}
        </div>
      </div>

      {/* GRID 1: FLUXO DE CAIXA REAL (5 COLS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <button onClick={() => setIsReceiptsModalOpen(true)} className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 text-left hover:border-green-500/50 hover:scale-[1.02] transition-all group relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><span className="text-6xl">💰</span></div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Entradas</h3>
          <p className="text-3xl font-mono font-bold text-slate-100 mb-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalFaturado)}</p>
          <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest animate-pulse">Ver Detalhes →</p>
        </button>

        <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 relative overflow-hidden">
           <div className="absolute right-0 top-0 p-4 opacity-5"><span className="text-6xl">✂️</span></div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Material (Prod)</h3>
          <p className="text-3xl font-mono font-bold text-slate-100">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.custoMaterial)}</p>
        </div>

        <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5"><span className="text-6xl">🏢</span></div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Fixo (Op)</h3>
          <p className="text-3xl font-mono font-bold text-slate-100">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalCustosFixos)}</p>
        </div>

        <button onClick={() => setIsExpensesModalOpen(true)} className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 text-left hover:border-orange-500/50 hover:scale-[1.02] transition-all group relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><span className="text-6xl">☕</span></div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Extras (Var)</h3>
          <p className="text-3xl font-mono font-bold text-orange-400 mb-1">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalDespesasPagas)}</p>
          <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest animate-pulse">Gerenciar →</p>
        </button>

        <div className={`p-6 rounded-[32px] border flex flex-col justify-between ${isLucroPositivo ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          <div>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isLucroPositivo ? 'text-green-500' : 'text-red-500'}`}>Lucro Líquido</h3>
            <p className={`text-3xl font-mono font-bold ${isLucroPositivo ? 'text-green-400' : 'text-red-400'}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lucroLiquido)}</p>
          </div>
          <div className={`mt-2 text-[10px] font-black uppercase tracking-widest ${isLucroPositivo ? 'text-green-600' : 'text-red-600'}`}>Margem: {margemLucro.toFixed(1)}%</div>
        </div>
      </div>

      {/* GRID 2: FUTURO E PENDÊNCIAS (2 COLS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
         <button onClick={() => setIsFutureModalOpen(true)} className="bg-slate-900 p-5 rounded-[24px] border border-slate-800 flex justify-between items-center hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group">
            <div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">A Receber (Clientes)</h3>
              <p className="text-2xl font-mono font-bold text-blue-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.recebimentosFuturos)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">→</div>
         </button>
         
         <button onClick={() => setIsExpensesModalOpen(true)} className="bg-slate-900 p-5 rounded-[24px] border border-slate-800 flex justify-between items-center hover:border-red-500/50 hover:bg-slate-800/50 transition-all group">
            <div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">A Pagar (Fornecedores/Despesas)</h3>
              <p className="text-2xl font-mono font-bold text-red-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalAPagar)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">→</div>
         </button>
      </div>

      {/* GRÁFICO E FILA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-[48px] border border-slate-800 min-h-[400px] shadow-inner">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Evolução Diária de Entradas</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px' }} />
                <Area type="monotone" dataKey="Recebido" stroke="#22c55e" strokeWidth={4} fill="url(#colorRec)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-600 font-black uppercase text-[10px] tracking-widest">Sem dados no período</div>
          )}
        </div>

        <div className="bg-slate-900 p-8 rounded-[48px] border border-slate-800 flex flex-col justify-between shadow-2xl">
          <div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Fila de Produção</h3>
            <Link href="/pedidos" className="group flex items-center gap-5 p-4 bg-slate-950 rounded-3xl border border-slate-800 hover:border-green-500/30 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center text-2xl font-black text-slate-950 shadow-lg shadow-green-500/20">{metrics.pedidosAtivos}</div>
              <div><p className="text-slate-100 font-black text-sm uppercase tracking-tighter">Pedidos Ativos</p><p className="text-green-500 text-[9px] font-black uppercase tracking-widest mt-1 group-hover:translate-x-1 transition-transform italic">Gerenciar Fila »</p></div>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-8">
            <button onClick={() => setIsExpensesModalOpen(true)} className="py-4 bg-orange-500 text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest text-center hover:scale-[1.02] transition-all">Lançar Despesa</button>
            <Link href="/vendas" className="py-4 bg-green-500 text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest text-center hover:scale-[1.02] transition-all">Novo Pedido</Link>
          </div>
        </div>
      </div>

      {/* MODAL 1: DETALHAMENTO DE ENTRADAS */}
      {isReceiptsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-[40px] border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Histórico de Entradas</h2>
                <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mt-1">Conferência de Caixa</p>
              </div>
              <button onClick={() => setIsReceiptsModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {detailedReceipts.map((r) => (
                <div key={r.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 group hover:border-green-500/30 transition-all">
                  {editingId === r.id ? (
                     <div className="space-y-4 animate-in slide-in-from-top-2">
                     <div className="grid grid-cols-2 gap-4">
                       <div><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Nova Data</label><input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none mt-1" /></div>
                       <div><label className="text-[9px] font-black uppercase text-slate-500 ml-1">Valor (R$)</label><input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 outline-none mt-1 font-mono" /></div>
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => handleUpdateReceipt(r.id)} className="flex-1 py-2 bg-green-500 text-slate-950 font-black text-[10px] uppercase rounded-xl hover:bg-green-400">Salvar</button>
                       <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-800 text-slate-400 font-black text-[10px] uppercase rounded-xl">Cancelar</button>
                     </div>
                   </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div><p className="text-slate-100 font-bold text-sm uppercase tracking-tight">{r.orders?.customers?.name || 'Cliente Avulso'}</p><p className="text-[10px] text-slate-500 font-mono mt-1">{parseSafeDate(r.payment_date).toLocaleDateString('pt-BR')} • {r.description || 'Pagamento'}</p></div>
                      <div className="flex items-center gap-4"><div className="text-green-500 font-mono font-black text-sm">+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.amount)}</div><button onClick={() => startEditing(r)} className="p-2 bg-slate-900 text-slate-500 hover:text-green-500 rounded-lg">✎</button></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: A RECEBER */}
      {isFutureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-[40px] border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Contas a Receber</h2>
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-1">Pendências de Clientes</p>
              </div>
              <button onClick={() => setIsFutureModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {detailedFuture.map((o) => (
                <div key={o.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="text-slate-100 font-bold text-sm uppercase tracking-tight">{o.customers?.name || 'Cliente'}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Pedido de {new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-500 font-mono font-black text-sm">R$ {o.balance.toFixed(2)}</p>
                    <Link href={`/pedidos`} className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-blue-400 mt-2 block">Acessar »</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: GESTOR DE DESPESAS (LANÇAMENTO E PENDÊNCIAS) */}
      {isExpensesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-5xl h-[85vh] rounded-[40px] border border-slate-800 shadow-2xl flex overflow-hidden">
            
            {/* LADO ESQUERDO: LANÇAMENTO */}
            <div className="w-full md:w-1/2 p-8 border-r border-slate-800 flex flex-col">
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter">Lançar Despesa</h2>
                <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mt-1">Saídas Extras e Manutenção</p>
              </div>
              
              <form onSubmit={handleAddExpense} className="flex-1 flex flex-col space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Descrição</label>
                  <input type="text" placeholder="Ex: Conserto da impressora, Café..." value={expDesc} onChange={(e)=>setExpDesc(e.target.value)} required className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm text-slate-100 outline-none focus:border-orange-500 transition-colors" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Valor (R$)</label>
                    <input type="number" step="0.01" placeholder="0.00" value={expAmount} onChange={(e)=>setExpAmount(e.target.value)} required className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm font-mono text-slate-100 outline-none focus:border-orange-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Data Venc/Pagto</label>
                    <input type="date" value={expDate} onChange={(e)=>setExpDate(e.target.value)} required className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm font-mono text-slate-100 outline-none focus:border-orange-500 transition-colors" />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Categoria</label>
                   <select value={expCat} onChange={(e)=>setExpCat(e.target.value)} className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-sm text-slate-100 outline-none focus:border-orange-500 appearance-none">
                     <option value="MAINTENANCE">Manutenção / Equipamentos</option>
                     <option value="SUPPLIES">Insumos Internos / Limpeza</option>
                     <option value="LOGISTICS">Fretes / Motoboy Extra</option>
                     <option value="FOOD">Alimentação / Equipe</option>
                     <option value="OTHER">Outros Diversos</option>
                   </select>
                </div>

                <div className="pt-4 mt-auto">
                  <div className="flex gap-2 p-2 bg-slate-950 rounded-2xl border border-slate-800 mb-6">
                    <button type="button" onClick={()=>setExpIsPaid(true)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${expIsPaid ? 'bg-orange-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}>Já foi Pago</button>
                    <button type="button" onClick={()=>setExpIsPaid(false)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${!expIsPaid ? 'bg-red-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}>A Pagar (Agendar)</button>
                  </div>
                  <button type="submit" className="w-full py-5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-2xl text-[12px] uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20">Registrar Despesa</button>
                </div>
              </form>
            </div>

            {/* LADO DIREITO: LISTA DE PENDÊNCIAS */}
            <div className="hidden md:flex w-1/2 flex-col bg-slate-950">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Contas a Pagar</h2>
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-1">Aguardando Baixa</p>
                </div>
                <button onClick={() => setIsExpensesModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center font-bold">×</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {pendingExpenses.length > 0 ? pendingExpenses.map((exp) => (
                  <div key={exp.id} className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-slate-100 font-bold text-sm uppercase tracking-tight">{exp.description}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Vence: {parseSafeDate(exp.due_date).toLocaleDateString('pt-BR')} • {exp.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-400 font-mono font-black text-lg">R$ {Number(exp.amount).toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handlePayExpense(exp.id)} className="flex-1 py-2 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-slate-950 border border-green-500/20 font-black text-[10px] uppercase rounded-xl transition-all">Pagar Hoje</button>
                       <button onClick={() => handleDeleteExpense(exp.id)} className="px-4 py-2 bg-slate-950 text-slate-500 hover:text-red-500 font-black text-[10px] uppercase rounded-xl transition-all">Excluir</button>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <span className="text-6xl mb-4">🙌</span>
                    <p className="text-slate-100 font-black uppercase tracking-widest text-sm">Tudo em dia!</p>
                    <p className="text-slate-500 font-medium text-[10px] uppercase tracking-widest mt-2">Nenhuma conta pendente na fila.</p>
                  </div>
                )}
              </div>
            </div>

            {/* BOTAO FECHAR MOBILE */}
            <button onClick={() => setIsExpensesModalOpen(false)} className="md:hidden absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold">×</button>
          </div>
        </div>
      )}

    </div>
  );
}