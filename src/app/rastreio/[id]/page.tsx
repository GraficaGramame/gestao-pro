/**
 * src/app/rastreio/[id]/page.tsx
 * Página Pública de Rastreio de Pedidos (Self-Service do Cliente)
 * Acesso anônimo: Mostra apenas status e itens, ocultando valores.
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function RastreioPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('id, created_at, delivery_date, status, customers(name), order_items(description, quantity)')
          .eq('id', id as string)
          .single();

        if (fetchError || !data) throw new Error();
        setOrder(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchOrder();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-green-500 font-black uppercase tracking-widest animate-pulse">Buscando seu pedido...</div>;
  if (error || !order) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500 font-black uppercase tracking-widest">Pedido não encontrado ou inválido.</div>;

  // Linha do tempo de status (Orçamentos e Cancelamentos têm tratamento especial)
  const isCancelled = order.status === 'CANCELLED';
  const isQuotation = order.status === 'QUOTATION';
  
  const steps = [
    { key: 'SERVICE_ORDER', label: 'Ordem Recebida', sub: 'Aguardando fila de produção' },
    { key: 'PRODUCTION', label: 'Em Produção', sub: 'Sendo impresso/confeccionado' },
    { key: 'COMPLETED', label: 'Pronto para Retirada', sub: 'Disponível no balcão' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order.status);
  const progressPercent = isQuotation ? 0 : isCancelled ? 0 : ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6 sm:p-12">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        
        <header className="text-center mb-10 pb-10 border-b border-slate-800">
          <h1 className="text-3xl font-black text-green-500 tracking-tighter mb-2 uppercase">Gráfica Gramame</h1>
          <p className="text-slate-400 font-medium">Acompanhamento de Pedido</p>
          <div className="mt-4 inline-block bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase font-black mr-2">Cód. Pedido</span>
            <span className="font-mono font-bold text-slate-200">#{order.id.split('-')[0].toUpperCase()}</span>
          </div>
        </header>

        <section className="mb-12">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-6">Status em Tempo Real</h2>
          
          {isCancelled ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <span className="text-red-500 font-black uppercase text-lg">Pedido Cancelado</span>
              <p className="text-slate-400 text-sm mt-2">Entre em contato via WhatsApp para mais informações.</p>
            </div>
          ) : isQuotation ? (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 text-center">
              <span className="text-orange-400 font-black uppercase text-lg">Orçamento Pendente</span>
              <p className="text-slate-400 text-sm mt-2">Aguardando aprovação e sinal para iniciar produção.</p>
            </div>
          ) : (
            <div className="relative pt-6">
              <div className="overflow-hidden h-2 mb-8 text-xs flex rounded-full bg-slate-800">
                <div style={{ width: `${progressPercent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-1000"></div>
              </div>
              <div className="flex justify-between">
                {steps.map((step, index) => {
                  const isCompleted = currentStepIndex >= index;
                  const isCurrent = currentStepIndex === index;
                  return (
                    <div key={step.key} className={`flex flex-col items-center text-center w-1/3 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs mb-2 transition-colors ${
                        isCompleted ? 'bg-green-500 text-slate-900 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${isCurrent ? 'text-green-400' : 'text-slate-300'}`}>{step.label}</span>
                      <span className="text-[9px] text-slate-500 mt-1 hidden sm:block">{step.sub}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="bg-slate-950 rounded-2xl p-6 border border-slate-800">
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-900">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cliente</h3>
              <p className="font-bold text-slate-200 mt-1">{order.customers?.name || 'Não Informado'}</p>
            </div>
            <div className="text-right">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Previsão de Entrega</h3>
              <p className="font-bold text-blue-400 mt-1">
                {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'A Combinar'}
              </p>
            </div>
          </div>

          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Itens Solicitados</h3>
          <ul className="space-y-3">
            {order.order_items?.map((item: any, idx: number) => (
              <li key={idx} className="flex gap-3 items-start text-sm">
                <span className="font-mono text-green-500 font-bold">{item.quantity}x</span>
                <span className="text-slate-300 leading-tight">{item.description}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Precisa de ajuda?</p>
          <a href="https://wa.me/5583998474211" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-green-500 hover:text-green-400 font-black text-xs uppercase border border-green-500/30 bg-green-500/10 px-6 py-2 rounded-xl transition-all">
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}