/**
 * src/app/producao/page.tsx
 * Kanban de Produção Multi-tenant
 * Atualização: Exibição de Prazo de Entrega e Alerta de Dívida visual no Kanban.
 */
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { OrderStatus } from '@/types';
import { useAuth } from '@/components/auth/auth-provider';

type KanbanOrder = {
  id: string;
  created_at: string;
  delivery_date: string | null;
  status: OrderStatus;
  customer_name: string | null;
  items_summary: string;
  total: number;
  down_payment_value: number;
};

const STATUS_COLUMNS: { id: OrderStatus; title: string; color: string }[] = [
  { id: 'QUOTATION', title: 'Orçamentos', color: 'border-slate-700' },
  { id: 'SERVICE_ORDER', title: 'Fila de Impressão', color: 'border-blue-800' },
  { id: 'PRODUCTION', title: 'Em Produção', color: 'border-orange-800' },
  { id: 'COMPLETED', title: 'Finalizados', color: 'border-green-800' },
];

export default function ProducaoPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<KanbanOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!tenantId) return;
    setLoading(true);

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('id, created_at, delivery_date, total, down_payment_value, status, customers(name), order_items(description, quantity)')
      .eq('tenant_id', tenantId)
      .eq('archived', false)
      .neq('status', 'CANCELLED')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formatted = data.map((order: any) => ({
        id: order.id,
        created_at: order.created_at,
        delivery_date: order.delivery_date,
        total: Number(order.total),
        down_payment_value: Number(order.down_payment_value),
        status: order.status,
        customer_name: order.customers?.name ?? 'Consumidor',
        items_summary: order.order_items?.map((i: any) => `${i.quantity}x ${i.description}`).join(' | ') || '...',
      }));
      setOrders(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [tenantId]);

  if (authLoading || !tenantId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-black uppercase tracking-widest animate-pulse">
        Sincronizando Esteira...
      </div>
    );
  }

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!tenantId) return;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId).eq('tenant_id', tenantId);
  };

  const handleArchive = async (orderId: string) => {
    if (!tenantId) return;
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    await supabase.from('orders').update({ archived: true }).eq('id', orderId).eq('tenant_id', tenantId);
  };

  const handleCancel = async (orderId: string) => {
    if (!tenantId || !confirm('Deseja cancelar este pedido?')) return;
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', orderId).eq('tenant_id', tenantId);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col flex-1">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Produção</h1>
        <p className="text-slate-400 mt-1 uppercase text-[10px] font-black tracking-widest">Esteira operacional da Gráfica</p>
      </header>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {STATUS_COLUMNS.map((column) => {
          const columnOrders = orders.filter((o) => o.status === column.id);

          return (
            <div key={column.id} className="w-80 shrink-0 flex flex-col bg-slate-900/50 rounded-xl border border-slate-800">
              <div className={`p-4 border-b ${column.color} bg-slate-900 rounded-t-xl flex justify-between items-center`}>
                <h2 className="font-black text-[11px] uppercase tracking-widest text-slate-300">{column.title}</h2>
                <span className="bg-slate-800 px-2 py-0.5 rounded-full text-[10px] font-bold">{columnOrders.length}</span>
              </div>
              
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {columnOrders.map((order) => {
                  const saldoPendente = order.total - order.down_payment_value;
                  const isDevendo = saldoPendente > 0;

                  return (
                    <div key={order.id} className="bg-slate-800 border border-slate-700 p-4 rounded-lg group hover:border-slate-500 transition-all">
                      <div className="flex justify-between items-start mb-2 font-mono text-[9px] text-slate-500">
                        <span>#{order.id.slice(0, 6)}</span>
                        <button onClick={() => handleCancel(order.id)} className="opacity-0 group-hover:opacity-100 text-red-500 font-bold">CANCELAR</button>
                      </div>
                      
                      <p className="font-bold text-sm text-slate-100 mb-1 leading-tight">{order.customer_name}</p>
                      
                      <p className="text-[10px] text-slate-400 line-clamp-3 font-medium mb-3 bg-slate-900/50 p-2 rounded border border-slate-700/50">
                        {order.items_summary}
                      </p>

                      {/* SELOS VISUAIS: PRAZO E DÍVIDA */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {order.delivery_date && (
                          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded text-[9px] font-black uppercase">
                            Entrega: {new Date(order.delivery_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                          </span>
                        )}
                        {isDevendo && (
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[9px] font-black uppercase">
                            Falta R$ {saldoPendente.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-700/50 flex justify-between items-center">
                        <button onClick={() => handleArchive(order.id)} className="text-[10px] font-black text-slate-500 hover:text-white uppercase">Arquivar</button>
                        <select 
                          value={order.status} 
                          onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                          className="bg-slate-950 text-[10px] font-black uppercase px-2 py-1 rounded outline-none border border-slate-700 focus:border-green-500"
                        >
                          {STATUS_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}