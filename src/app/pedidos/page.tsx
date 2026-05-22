/**
 * src/app/pedidos/page.tsx
 * Fila de Produção Avançada (Kanban) - Gráfica Gramame
 * Drag-and-Drop Nativo, Alertas Visuais de Prazo e Drill-down de Produção
 */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { downloadOrderPdf } from '@/lib/pdf/generator';
import { useAuth } from '@/components/auth/auth-provider';

export default function PedidosPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Interface
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    if (!tenantId) return;
    setLoading(true);

    supabase.from('tenants' as any).select('*').eq('id', tenantId).single().then(({ data }: { data: any }) => {
      if (data) setStoreSettings(data);
    });

    // Puxando os order_items junto para permitir o Drill-down instantâneo
    const { data }: { data: any[] | null } = await (supabase as any)
      .from('orders')
      .select('id, created_at, total, down_payment_value, status, payment_status, delivery_date, customers(name, whatsapp), order_items(description, quantity, width, height)')
      .eq('tenant_id', tenantId)
      .neq('status', 'CANCELLED') // Kanban foca no que está vivo
      .order('created_at', { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { 
    fetchOrders(); 
  }, [tenantId]);

  // ==========================================
  // LÓGICA DO KANBAN E DRAG AND DROP
  // ==========================================
  const KANBAN_COLUMNS = [
    { id: 'QUOTATION', title: 'Orçamentos', icon: '📝', borderColor: 'border-slate-600', bgColor: 'bg-slate-900/50' },
    { id: 'SERVICE_ORDER', title: 'Ordens Fila', icon: '⏳', borderColor: 'border-blue-500/50', bgColor: 'bg-blue-900/10' },
    { id: 'PRODUCTION', title: 'Em Produção', icon: '⚙️', borderColor: 'border-orange-500/50', bgColor: 'bg-orange-900/10' },
    { id: 'COMPLETED', title: 'Finalizados', icon: '✅', borderColor: 'border-green-500/50', bgColor: 'bg-green-900/10' },
  ];

  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('orderId', orderId);
    // Fecha o menu se estiver aberto ao começar a arrastar
    setActiveMenuId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Permite o drop
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (!orderId) return;

    const orderToUpdate = orders.find(o => o.id === orderId);
    if (orderToUpdate && orderToUpdate.status !== newStatus) {
      // Atualização Otimista da UI para sensação de tempo real
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId).eq('tenant_id', tenantId);
    }
  };

  // ==========================================
  // INTELIGÊNCIA DE PRAZOS
  // ==========================================
  const getDeliveryStatus = (dateString: string | null, status: string) => {
    if (status === 'COMPLETED' || !dateString) return null;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const datePart = dateString.split('T')[0];
    const delivery = new Date(`${datePart}T12:00:00`);
    delivery.setHours(0,0,0,0);
    
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (diffDays < 0) return { label: 'Atrasado', class: 'border-l-4 border-l-red-500 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.2)]' };
    if (diffDays === 0) return { label: 'Entrega Hoje', class: 'border-l-4 border-l-orange-500 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.15)] animate-pulse' };
    if (diffDays <= 2) return { label: 'Próximo', class: 'border-l-4 border-l-yellow-500 bg-yellow-500/5' };
    
    return { label: 'No Prazo', class: 'border-l-4 border-l-green-500 bg-slate-900' };
  };

  // ==========================================
  // AÇÕES RÁPIDAS
  // ==========================================
  const handleNotifyCustomer = (order: any) => {
    setActiveMenuId(null);
    const trackingUrl = `${window.location.origin}/rastreio/${order.id}`;
    let message = `Olá ${order.customers?.name || ''}!\n\n`;

    if (order.status === 'COMPLETED') {
      message += `🚀 Boas notícias! Seu pedido já está *PRONTO PARA RETIRADA* aqui na Gráfica Gramame.\n\n`;
    } else {
      message += `Seu pedido está em andamento. Acompanhe o status em tempo real acessando o link abaixo:\n\n`;
    }
    
    message += `🔗 ${trackingUrl}\n\nQualquer dúvida, estamos à disposição!`;

    const phone = order.customers?.whatsapp;
    if (phone && phone !== 'Não Informado') {
      const cleanPhone = phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      navigator.clipboard.writeText(message);
      alert('Link e texto copiados! O cliente não possui número registrado.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setActiveMenuId(null);
    if (!window.confirm("Certeza que deseja cancelar este pedido? Ele sairá da fila de produção.")) return;
    
    setOrders(orders.filter(o => o.id !== orderId));
    await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', orderId).eq('tenant_id', tenantId);
  };

  const handleGeneratePdf = async (orderId: string, type: 'DOC' | 'RECIBO') => {
    setActiveMenuId(null);
    try {
      const { data, error }: { data: any, error: any } = await (supabase as any)
        .from('orders').select('*, customers(name, whatsapp), order_items(*)').eq('id', orderId).eq('tenant_id', tenantId).single();

      if (error || !data) return alert("Erro ao gerar PDF.");

      const items = data.order_items.map((i: any) => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price), total_price: Number(i.total_price) }));
      const finalValue = Number(data.total);
      const discountValue = Number(data.discount_value || 0);
      const grossValue = finalValue + discountValue;
      const paidValue = Number(data.down_payment_value || 0);

      const pdfSettings = {
        name: storeSettings?.name || 'GRÁFICA GRAMAME',
        address: storeSettings?.address || 'João Pessoa, PB',
        phone: storeSettings?.phone || '(83) 99847-4211',
        pixKey: storeSettings?.pix_key || 'Chave não informada'
      };

      const customerSafe = data.customers || { name: 'Consumidor Final', whatsapp: 'Não Informado' };

      if (type === 'RECIBO') {
        await downloadOrderPdf('RECEIPT', { orderId: data.id, issuedAt: data.created_at, deliveryDate: data.delivery_date, customer: customerSafe, items, grossValue, discountValue, finalValue, paidValue, remainingValue: finalValue - paidValue, storeSettings: pdfSettings } as any, `recibo-${data.id.slice(0, 5)}.pdf`);
      } else {
        const layout = data.status === 'QUOTATION' ? 'QUOTATION' : 'SERVICE_ORDER';
        await downloadOrderPdf(layout, { orderId: data.id, issuedAt: data.created_at, deliveryDate: data.delivery_date, customer: customerSafe, items, grossValue, discountValue, finalValue, storeSettings: pdfSettings } as any, `documento-${data.id.slice(0, 5)}.pdf`);
      }
    } catch (err) {
      alert(`Erro ao montar o PDF.`);
    }
  };

  if (authLoading || !tenantId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-black uppercase tracking-widest animate-pulse">
        Montando Linha de Produção...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex-1 flex flex-col h-screen overflow-hidden">
      
      {/* HEADER FIXO */}
      <header className="mb-8 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-green-500">Linha de Produção</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Quadro Kanban Interativo</p>
        </div>
        <Link href="/vendas" className="bg-green-600 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-500 transition-all shadow-xl shadow-green-900/20">
          + Novo Pedido
        </Link>
      </header>

      {/* KANBAN BOARD */}
      <div className="flex-1 flex gap-6 overflow-x-auto custom-scrollbar pb-6 snap-x">
        {KANBAN_COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.status === col.id);
          
          return (
            <div 
              key={col.id}
              className={`flex-1 min-w-[320px] max-w-[400px] flex flex-col rounded-[2rem] border ${col.borderColor} ${col.bgColor} snap-center`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Kanban Column Header */}
              <div className="p-5 flex justify-between items-center border-b border-slate-800/50 shrink-0">
                <h2 className="font-black uppercase tracking-widest text-xs text-slate-200 flex items-center gap-2">
                  <span>{col.icon}</span> {col.title}
                </h2>
                <span className="bg-slate-950 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black border border-slate-800">
                  {colOrders.length}
                </span>
              </div>

              {/* Kanban Cards Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {colOrders.map(order => {
                  const saldoPendente = Number(order.total) - Number(order.down_payment_value);
                  const isDevendo = saldoPendente > 0;
                  const alertStatus = getDeliveryStatus(order.delivery_date, order.status);

                  return (
                    <div 
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      className={`relative rounded-2xl border border-slate-800 p-4 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all group ${alertStatus ? alertStatus.class : 'bg-slate-900'}`}
                    >
                      {/* Menu 3 Pontinhos */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === order.id ? null : order.id); }}
                        className="absolute top-4 right-3 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        •••
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === order.id && (
                        <div className="absolute top-10 right-4 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button onClick={() => handleGeneratePdf(order.id, 'DOC')} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">📄 Gerar OS / PDF</button>
                          <button onClick={() => handleGeneratePdf(order.id, 'RECIBO')} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">🧾 Emitir Recibo</button>
                          <Link href={`/vendas?editId=${order.id}`} className="block w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">✏️ Editar Pedido</Link>
                          <button onClick={() => handleNotifyCustomer(order)} className="w-full text-left px-4 py-3 text-xs font-bold text-green-400 hover:bg-green-500/10 transition-colors border-t border-slate-700">📱 Avisar Cliente (Zap)</button>
                          <button onClick={() => handleCancelOrder(order.id)} className="w-full text-left px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors border-t border-slate-700">🗑️ Cancelar Pedido</button>
                        </div>
                      )}

                      {/* Card Content (Clicável para abrir Detalhes) */}
                      <div onClick={() => setSelectedOrder(order)}>
                        <div className="mb-3 pr-8">
                          <div className="flex justify-between items-start mb-1">
                             <p className="text-slate-100 font-black text-sm uppercase tracking-tight truncate">{order.customers?.name || 'Consumidor Avulso'}</p>
                          </div>
                          <p className="text-[9px] text-slate-500 font-mono">Pedido #{order.id.slice(0,6)} • {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>

                        <div className="flex items-end justify-between mt-4">
                          <div className="flex flex-col gap-2">
                             {/* Badge de Pagamento */}
                             {isDevendo ? (
                               <div className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-400 uppercase w-fit">Falta R$ {saldoPendente.toFixed(2)}</div>
                             ) : (
                               <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-[9px] font-black text-green-500 uppercase w-fit">Totalmente Pago</div>
                             )}

                             {/* Badge de Prazo */}
                             {alertStatus && (
                                <div className={`text-[9px] font-black uppercase tracking-widest ${alertStatus.class.includes('red') ? 'text-red-500' : alertStatus.class.includes('orange') ? 'text-orange-500' : alertStatus.class.includes('yellow') ? 'text-yellow-500' : 'text-slate-400'}`}>
                                  {alertStatus.label} {order.delivery_date && `(${new Date(order.delivery_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})})`}
                                </div>
                             )}
                          </div>
                          <span className="text-base font-black font-mono text-slate-200">R$ {Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Overlay invisível para fechar o menu ao clicar fora */}
      {activeMenuId && (
        <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)}></div>
      )}

      {/* MODAL DE DRILL-DOWN (Detalhes da Produção) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-[40px] border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div>
                <h2 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Detalhes da Produção</h2>
                <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mt-1">Cliente: {selectedOrder.customers?.name || 'Avulso'} • Pedido #{selectedOrder.id.slice(0,6)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-colors">×</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Itens para Produzir</h3>
              
              {selectedOrder.order_items?.map((item: any, idx: number) => (
                <div key={idx} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex justify-between items-start gap-4 hover:border-slate-700 transition-colors">
                  <div className="flex-1">
                    <p className="text-slate-100 font-bold text-sm uppercase leading-tight mb-2">{item.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                       <span className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[9px] font-black uppercase text-green-400 font-mono">Qtd: {item.quantity}</span>
                       {item.width && item.height && (
                         <span className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[9px] font-black uppercase text-blue-400 font-mono">Medida: {item.width}m x {item.height}m</span>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-end gap-3">
               <Link href={`/vendas?editId=${selectedOrder.id}`} className="px-6 py-4 bg-slate-800 text-slate-300 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all">Editar Pedido</Link>
               <button onClick={() => setSelectedOrder(null)} className="px-8 py-4 bg-green-500 text-slate-950 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-green-400 transition-all shadow-lg shadow-green-500/20">Fechar Visualização</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}