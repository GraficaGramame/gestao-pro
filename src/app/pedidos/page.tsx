/**
 * src/app/pedidos/page.tsx
 * Fila de Produção Avançada (Kanban) - Gráfica Gramame
 * Drag-and-Drop Nativo, Alertas Visuais de Prazo e Drill-down de Produção
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { downloadOrderPdf } from '@/lib/pdf/generator';
import { useAuth } from '@/components/auth/auth-provider';

export default function PedidosPage() {
  const router = useRouter();
  const { tenantId, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [siteOrders, setSiteOrders] = useState<any[]>([]); 
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estados de Interface
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const fetchOrders = async () => {
    if (!tenantId) return;
    setLoading(true);

    supabase.from('tenants' as any).select('*').eq('id', tenantId).single().then(({ data }: { data: any }) => {
      if (data) setStoreSettings(data);
    });

    const { data: officialOrders }: { data: any[] | null } = await (supabase as any)
      .from('orders')
      .select('id, created_at, total, down_payment_value, status, payment_status, delivery_date, customers(name, whatsapp), order_items(description, quantity, width, height)')
      .eq('tenant_id', tenantId)
      .neq('status', 'CANCELLED') 
      .order('created_at', { ascending: false });

    if (officialOrders) setOrders(officialOrders);

    const { data: leads } = await (supabase as any)
      .from('orcamentos_funil')
      .select('*')
      .order('created_at', { ascending: false });

    if (leads) {
      const pendentes = leads.filter((l: any) => l.status !== 'CONVERTIDO');
      setSiteOrders(pendentes);
    }

    setLoading(false);
  };

  useEffect(() => { 
    fetchOrders(); 
  }, [tenantId]);

  // ==========================================
  // LÓGICA DO KANBAN E DRAG AND DROP
  // ==========================================
  const KANBAN_COLUMNS = [
    { id: 'SITE_INBOX', title: 'Pedidos do Site', icon: '🌐', borderColor: 'border-pink-500/50', bgColor: 'bg-pink-900/10' },
    { id: 'QUOTATION', title: 'Orçamentos', icon: '📝', borderColor: 'border-slate-600', bgColor: 'bg-slate-900/50' },
    { id: 'SERVICE_ORDER', title: 'Ordens Fila', icon: '⏳', borderColor: 'border-blue-500/50', bgColor: 'bg-blue-900/10' },
    { id: 'PRODUCTION', title: 'Em Produção', icon: '⚙️', borderColor: 'border-orange-500/50', bgColor: 'bg-orange-900/10' },
    { id: 'COMPLETED', title: 'Finalizados', icon: '✅', borderColor: 'border-green-500/50', bgColor: 'bg-green-900/10' },
  ];

  const handleDragStart = (e: React.DragEvent, orderId: string, source: 'OFFICIAL' | 'SITE') => {
    e.dataTransfer.setData('orderId', orderId);
    e.dataTransfer.setData('source', source);
    setActiveMenuId(null);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    const source = e.dataTransfer.getData('source');
    if (!orderId) return;

    if (source === 'SITE') {
      const lead = siteOrders.find(l => l.id === orderId);
      if (!lead) return;
      await (supabase as any).from('orcamentos_funil').update({ status: 'CONVERTIDO' }).eq('id', lead.id);
      fetchOrders();
      return;
    }

    if (source === 'OFFICIAL') {
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (orderToUpdate && orderToUpdate.status !== newStatus) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        await (supabase as any).from('orders').update({ status: newStatus }).eq('id', orderId).eq('tenant_id', tenantId);
      }
    }
  };

  // ==========================================
  // FUNÇÕES EXCLUSIVAS PARA OS LEADS DO SITE
  // ==========================================
  const getPayload = (lead: any) => {
    try {
      return typeof lead.payload === 'string' ? JSON.parse(lead.payload) : (lead.payload || {});
    } catch (e) {
      return {};
    }
  };

  const handleLeadWhatsApp = (lead: any, payloadObj: any) => {
    const phone = payloadObj.whatsapp || lead.whatsapp;
    if (!phone) {
      alert("O cliente não informou um telefone válido.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const message = `Olá ${payloadObj.nome || lead.nome || 'cliente'}, recebemos sua solicitação de orçamento pelo nosso site referente ao produto: *${payloadObj.produto_nome}* (Qtd: ${payloadObj.quantidade}).\n\nComo posso ajudar a finalizar o seu pedido?`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("Certeza que deseja excluir permanentemente esta solicitação do site?")) return;
    setSiteOrders(siteOrders.filter(l => l.id !== id));
    await (supabase as any).from('orcamentos_funil').delete().eq('id', id);
    setSelectedLead(null);
  };

  // BOTÃO MÁGICO: Leva para /vendas já com os dados salvos em rascunho
  const handleConvertToOrder = (lead: any, payloadObj: any) => {
    const draftData = {
      lead_id: lead.id,
      customer_name: payloadObj.nome || lead.nome,
      customer_whatsapp: payloadObj.whatsapp || lead.whatsapp,
      items: [{
        description: payloadObj.produto_nome,
        quantity: payloadObj.quantidade || 1,
        unit_price: payloadObj.valorUnitario || 0,
        total_price: payloadObj.valorTotal || 0,
        selections: payloadObj.selections
      }],
      total: payloadObj.valorTotal || 0
    };
    
    // Salva na memória do navegador e redireciona
    sessionStorage.setItem('draftOrderFromLead', JSON.stringify(draftData));
    router.push('/vendas?fromLead=true');
  };

  const handleGenerateLeadPdf = async (lead: any, payloadObj: any) => {
    try {
      // Extraindo os adicionais para a descrição do PDF
      const adicionaisText = payloadObj.selections 
        ? Object.values(payloadObj.selections).join(' • ') 
        : '';
        
      const fullDescription = `${payloadObj.produto_nome} ${adicionaisText ? `(${adicionaisText})` : ''} ${payloadObj.precisa_arte ? '• C/ Arte Inclusa' : '• Arte do Cliente'}`;

      const fakeOrder = {
        orderId: `SITE-${lead.id.slice(0, 5).toUpperCase()}`,
        issuedAt: lead.created_at || new Date().toISOString(),
        deliveryDate: null,
        customer: {
          name: payloadObj.nome || lead.nome || 'Cliente do Site',
          whatsapp: payloadObj.whatsapp || lead.whatsapp || 'Não Informado'
        },
        items: [{
          description: fullDescription,
          quantity: payloadObj.quantidade || 1,
          unit_price: Number(payloadObj.valorUnitario || 0),
          total_price: Number(payloadObj.valorTotal || 0)
        }],
        grossValue: Number(payloadObj.valorTotal || 0),
        discountValue: 0,
        finalValue: Number(payloadObj.valorTotal || 0),
        storeSettings: storeSettings || { name: 'GRÁFICA GRAMAME', phone: '(83) 99847-4211' }
      };

      await downloadOrderPdf('QUOTATION', fakeOrder as any, `orcamento-site-${payloadObj.nome || 'cliente'}.pdf`);
    } catch (err) {
      alert("Erro ao gerar PDF do orçamento.");
    }
  };

  // ==========================================
  // INTELIGÊNCIA DE PRAZOS
  // ==========================================
  const getDeliveryStatus = (dateString: string | null, status: string) => {
    if (status === 'COMPLETED' || !dateString) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const delivery = new Date(`${dateString.split('T')[0]}T12:00:00`); delivery.setHours(0,0,0,0);
    const diffDays = Math.ceil((delivery.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return { label: 'Atrasado', class: 'border-l-4 border-l-red-500 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.2)]' };
    if (diffDays === 0) return { label: 'Entrega Hoje', class: 'border-l-4 border-l-orange-500 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.15)] animate-pulse' };
    if (diffDays <= 2) return { label: 'Próximo', class: 'border-l-4 border-l-yellow-500 bg-yellow-500/5' };
    return { label: 'No Prazo', class: 'border-l-4 border-l-green-500 bg-slate-900' };
  };

  // ==========================================
  // AÇÕES RÁPIDAS (Pedidos Oficiais)
  // ==========================================
  const handleNotifyCustomer = (order: any) => {
    setActiveMenuId(null);
    const trackingUrl = `${window.location.origin}/rastreio/${order.id}`;
    let message = order.status === 'COMPLETED' 
      ? `Olá ${order.customers?.name || ''}!\n\n🚀 Boas notícias! Seu pedido já está *PRONTO PARA RETIRADA* aqui na Gráfica Gramame.\n\n🔗 ${trackingUrl}`
      : `Olá ${order.customers?.name || ''}!\n\nSeu pedido está em andamento. Acompanhe o status:\n\n🔗 ${trackingUrl}`;

    const phone = order.customers?.whatsapp;
    if (phone && phone !== 'Não Informado') {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      navigator.clipboard.writeText(message); alert('Link e texto copiados!');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setActiveMenuId(null);
    if (!window.confirm("Certeza que deseja cancelar este pedido?")) return;
    setOrders(orders.filter(o => o.id !== orderId));
    await (supabase as any).from('orders').update({ status: 'CANCELLED' }).eq('id', orderId).eq('tenant_id', tenantId);
  };

  const handleGeneratePdf = async (orderId: string, type: 'DOC' | 'RECIBO') => {
    setActiveMenuId(null);
    try {
      const { data, error }: { data: any, error: any } = await (supabase as any).from('orders').select('*, customers(name, whatsapp), order_items(*)').eq('id', orderId).eq('tenant_id', tenantId).single();
      if (error || !data) return alert("Erro ao gerar PDF.");
      const items = data.order_items.map((i: any) => ({ ...i, quantity: Number(i.quantity), unit_price: Number(i.unit_price), total_price: Number(i.total_price) }));
      const pdfSettings = { name: storeSettings?.name || 'GRÁFICA GRAMAME', address: storeSettings?.address || 'João Pessoa, PB', phone: storeSettings?.phone || '(83) 99847-4211', pixKey: storeSettings?.pix_key || 'Chave não informada' };
      const customerSafe = data.customers || { name: 'Consumidor Final', whatsapp: 'Não Informado' };
      
      const payload = { orderId: data.id, issuedAt: data.created_at, deliveryDate: data.delivery_date, customer: customerSafe, items, grossValue: Number(data.total) + Number(data.discount_value || 0), discountValue: Number(data.discount_value || 0), finalValue: Number(data.total), paidValue: Number(data.down_payment_value || 0), remainingValue: Number(data.total) - Number(data.down_payment_value || 0), storeSettings: pdfSettings } as any;

      if (type === 'RECIBO') {
        await downloadOrderPdf('RECEIPT', payload, `recibo-${data.id.slice(0, 5)}.pdf`);
      } else {
        await downloadOrderPdf(data.status === 'QUOTATION' ? 'QUOTATION' : 'SERVICE_ORDER', payload, `documento-${data.id.slice(0, 5)}.pdf`);
      }
    } catch (err) { alert(`Erro ao montar o PDF.`); }
  };

  if (authLoading || !tenantId) {
    return <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-black uppercase tracking-widest animate-pulse">Montando Linha de Produção...</div>;
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
          + Novo Pedido Manual
        </Link>
      </header>

      {/* KANBAN BOARD */}
      <div className="flex-1 flex gap-6 overflow-x-auto custom-scrollbar pb-6 snap-x">
        {KANBAN_COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.status === col.id);
          
          return (
            <div key={col.id} className={`flex-1 min-w-[320px] max-w-[400px] flex flex-col rounded-[2rem] border ${col.borderColor} ${col.bgColor} snap-center`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, col.id)}>
              <div className="p-5 flex justify-between items-center border-b border-slate-800/50 shrink-0">
                <h2 className="font-black uppercase tracking-widest text-xs text-slate-200 flex items-center gap-2"><span>{col.icon}</span> {col.title}</h2>
                <span className="bg-slate-950 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black border border-slate-800">{col.id === 'SITE_INBOX' ? siteOrders.length : colOrders.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                
                {/* RENDER: PEDIDOS DO SITE (COLUNA ROSA) */}
                {col.id === 'SITE_INBOX' && siteOrders.map(lead => {
                  const payloadObj = getPayload(lead);

                  return (
                    <div 
                      key={`site-${lead.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead.id, 'SITE')}
                      onClick={() => setSelectedLead({ ...lead, payloadObj })}
                      className="relative rounded-2xl border border-pink-500/30 p-4 cursor-pointer hover:border-pink-500/60 transition-all bg-pink-950/20 group shadow-[0_0_15px_rgba(236,72,153,0.05)]"
                    >
                      <div className="mb-3 pr-8">
                        <p className="text-pink-100 font-black text-sm uppercase tracking-tight truncate">{payloadObj.nome || lead.nome || 'Cliente'}</p>
                        <p className="text-[10px] text-pink-400 font-mono">Via Site • {new Date(lead.created_at || Date.now()).toLocaleDateString()}</p>
                        <p className="text-[11px] text-pink-300/80 mt-2 font-bold">{payloadObj.quantidade || 1}x {payloadObj.produto_nome || 'Produto'}</p>
                      </div>
                      <div className="flex items-end justify-between mt-4">
                        <div className="px-2 py-1 rounded bg-pink-500/20 border border-pink-500/30 text-[9px] font-black text-pink-400 uppercase w-fit group-hover:bg-pink-500/40 transition-colors">
                          Ver Adicionais 👀
                        </div>
                        <span className="text-base font-black font-mono text-pink-200">R$ {Number(payloadObj.valorTotal || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}

                {/* RENDER: ORDENS DO SISTEMA */}
                {col.id !== 'SITE_INBOX' && colOrders.map(order => {
                  const saldoPendente = Number(order.total) - Number(order.down_payment_value);
                  const isDevendo = saldoPendente > 0;
                  const alertStatus = getDeliveryStatus(order.delivery_date, order.status);

                  return (
                    <div key={order.id} draggable onDragStart={(e) => handleDragStart(e, order.id, 'OFFICIAL')} className={`relative rounded-2xl border border-slate-800 p-4 cursor-grab active:cursor-grabbing hover:border-slate-600 transition-all group ${alertStatus ? alertStatus.class : 'bg-slate-900'}`}>
                      <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === order.id ? null : order.id); }} className="absolute top-4 right-3 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors">•••</button>
                      
                      {activeMenuId === order.id && (
                        <div className="absolute top-10 right-4 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button onClick={() => handleGeneratePdf(order.id, 'DOC')} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">📄 Gerar OS / PDF</button>
                          <button onClick={() => handleGeneratePdf(order.id, 'RECIBO')} className="w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">🧾 Emitir Recibo</button>
                          <Link href={`/vendas?editId=${order.id}`} className="block w-full text-left px-4 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">✏️ Editar Pedido</Link>
                          <button onClick={() => handleNotifyCustomer(order)} className="w-full text-left px-4 py-3 text-xs font-bold text-green-400 hover:bg-green-500/10 transition-colors border-t border-slate-700">📱 Avisar Cliente (Zap)</button>
                          <button onClick={() => handleCancelOrder(order.id)} className="w-full text-left px-4 py-3 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors border-t border-slate-700">🗑️ Cancelar Pedido</button>
                        </div>
                      )}

                      <div onClick={() => setSelectedOrder(order)}>
                        <div className="mb-3 pr-8">
                          <p className="text-slate-100 font-black text-sm uppercase tracking-tight truncate">{order.customers?.name || 'Consumidor Avulso'}</p>
                          <p className="text-[9px] text-slate-500 font-mono">Pedido #{order.id.slice(0,6)} • {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-end justify-between mt-4">
                          <div className="flex flex-col gap-2">
                             {isDevendo ? <div className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-400 uppercase w-fit">Falta R$ {saldoPendente.toFixed(2)}</div> : <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-[9px] font-black text-green-500 uppercase w-fit">Totalmente Pago</div>}
                             {alertStatus && <div className={`text-[9px] font-black uppercase tracking-widest ${alertStatus.class.includes('red') ? 'text-red-500' : alertStatus.class.includes('orange') ? 'text-orange-500' : alertStatus.class.includes('yellow') ? 'text-yellow-500' : 'text-slate-400'}`}>{alertStatus.label} {order.delivery_date && `(${new Date(order.delivery_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})})`}</div>}
                          </div>
                          <span className="text-base font-black font-mono text-slate-200">R$ {Number(order.total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {activeMenuId && <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)}></div>}

      {/* MODAL: DETALHES DO LEAD (SITE) */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full max-w-2xl rounded-[40px] border border-pink-500/30 shadow-2xl flex flex-col overflow-hidden shadow-pink-900/20">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-pink-950/20">
              <div>
                <h2 className="text-xl font-black text-pink-400 uppercase tracking-tighter">Novo Contato do Site</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Lead #{selectedLead.id.slice(0,8)} • {new Date(selectedLead.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-colors">×</button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cliente</p>
                  <p className="text-slate-200 font-bold">{selectedLead.payloadObj?.nome || selectedLead.nome}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Telefone / WhatsApp</p>
                  <p className="text-slate-200 font-bold font-mono">{selectedLead.payloadObj?.whatsapp || selectedLead.whatsapp}</p>
                </div>
              </div>

              <div className="bg-pink-950/10 p-5 rounded-3xl border border-pink-500/20">
                 <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-2">Interesse de Compra</p>
                 <p className="text-slate-100 font-black text-lg mb-2">
                   {selectedLead.payloadObj?.quantidade || 1}x {selectedLead.payloadObj?.produto_nome || 'Produto Indefinido'}
                 </p>
                 
                 {/* Exibição Correta das Seleções do Cliente */}
                 <div className="flex flex-wrap gap-2 mb-4">
                   {selectedLead.payloadObj?.selections && Object.values(selectedLead.payloadObj.selections).map((opcao: any, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-black uppercase text-slate-300">
                        {opcao}
                      </span>
                   ))}
                   {/* Badge de Arte */}
                   <span className={`px-3 py-1 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-black uppercase ${selectedLead.payloadObj?.precisa_arte ? 'text-orange-400' : 'text-blue-400'}`}>
                     Arte: {selectedLead.payloadObj?.precisa_arte ? 'Precisa de Criação' : 'Enviará Pronta'}
                   </span>
                 </div>

                 <div className="flex justify-between items-end border-t border-pink-900/30 pt-4 mt-2">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor Calculado:</span>
                       <span className="text-[10px] text-pink-400/60 font-mono mt-1">R$ {Number(selectedLead.payloadObj?.valorUnitario || 0).toFixed(2)} por unid.</span>
                    </div>
                    <span className="text-2xl font-black text-green-400 font-mono">R$ {Number(selectedLead.payloadObj?.valorTotal || 0).toFixed(2)}</span>
                 </div>
              </div>
            </div>

            <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between gap-3 items-center">
               <button onClick={() => handleDeleteLead(selectedLead.id)} className="px-4 py-3 text-red-500 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-colors">🗑️ Apagar</button>
               
               <div className="flex gap-2">
                 <button onClick={() => handleGenerateLeadPdf(selectedLead, selectedLead.payloadObj)} className="px-4 py-3 bg-slate-800 text-slate-200 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all">📄 PDF</button>
                 <button onClick={() => handleLeadWhatsApp(selectedLead, selectedLead.payloadObj)} className="px-4 py-3 bg-slate-800 text-green-400 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">💬 WhatsApp</button>
                 
                 {/* O BOTÃO MÁGICO */}
                 <button onClick={() => handleConvertToOrder(selectedLead, selectedLead.payloadObj)} className="px-6 py-3 bg-pink-600 text-slate-100 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-pink-500 transition-all shadow-lg shadow-pink-600/20 ml-2">
                   🪄 Criar Pedido
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DRILL-DOWN (Detalhes da Produção Oficial) */}
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
                       {item.width && item.height && <span className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-[9px] font-black uppercase text-blue-400 font-mono">Medida: {item.width}m x {item.height}m</span>}
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