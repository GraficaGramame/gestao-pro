/**
 * src/app/financeiro/page.tsx
 * Módulo Financeiro Avançado - Gráfica Gramame
 * Atualização: Drill-down interativo nos KPIs (Listagem de devedores por clique).
 */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PaymentStatus, Receipt } from '@/types';
import { downloadOrderPdf } from '@/lib/pdf/generator';
import { useAuth } from '@/components/auth/auth-provider';

type FilterTab = 'ALL' | 'PENDING' | 'PAID';

export default function FinanceiroPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros e Buscas
  const [activeTab, setActiveTab] = useState<FilterTab>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados do Modal de Pagamento
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderReceipts, setOrderReceipts] = useState<Receipt[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('PIX');
  const [processing, setProcessing] = useState(false);

  // Estados do Modal de Detalhamento dos KPIs (Novo!)
  const [kpiModalOpen, setKpiModalOpen] = useState(false);
  const [kpiModalType, setKpiModalType] = useState<'A_RECEBER' | 'INADIMPLENCIA'>('A_RECEBER');
  const [kpiModalOrders, setKpiModalOrders] = useState<any[]>([]);

  const fetchFinancials = async () => {
    if (!tenantId) return;
    setLoading(true);
    
    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*, customers(name, whatsapp)')
      .eq('tenant_id', tenantId)
      .neq('status', 'CANCELLED')
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { 
    fetchFinancials(); 
  }, [tenantId]);

  // ==========================================
  // INTELIGÊNCIA DO MINI-DASHBOARD
  // ==========================================
  const kpis = useMemo(() => {
    let faturado = 0;
    let aReceber = 0;
    let emAtraso = 0;
    const aReceberList: any[] = [];
    const emAtrasoList: any[] = [];
    
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    orders.forEach(o => {
      const valorTotal = Number(o.total) || 0;
      const valorPago = Number(o.down_payment_value) || 0;
      const saldoDevedor = valorTotal - valorPago;

      faturado += valorTotal;

      if (saldoDevedor > 0) {
        aReceber += saldoDevedor;
        aReceberList.push(o); // Guarda o pedido na lista de "A Receber"
        
        if (o.delivery_date) {
          const dataEntrega = new Date(o.delivery_date);
          if (dataEntrega < hoje) {
            emAtraso += saldoDevedor;
            emAtrasoList.push(o); // Guarda o pedido na lista de "Inadimplência"
          }
        }
      }
    });

    return { faturado, aReceber, emAtraso, aReceberList, emAtrasoList };
  }, [orders]);

  // ==========================================
  // FILTROS DA LISTA
  // ==========================================
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const saldo = Number(o.total) - Number(o.down_payment_value);
      const isPendente = saldo > 0;
      
      if (activeTab === 'PENDING' && !isPendente) return false;
      if (activeTab === 'PAID' && isPendente) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const clientName = o.customers?.name?.toLowerCase() || 'consumidor avulso';
        const orderIdStr = o.id.toLowerCase();
        if (!clientName.includes(query) && !orderIdStr.includes(query)) return false;
      }
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // ==========================================
  // EXPORTAÇÃO EXCEL / CSV
  // ==========================================
  const exportToCSV = () => {
    const headers = ['Pedido', 'Cliente', 'Data', 'Total (R$)', 'Pago (R$)', 'Saldo Devedor (R$)', 'Status'];
    const rows = filteredOrders.map(o => [
      `#${o.id.slice(0,6)}`,
      o.customers?.name || 'Consumidor Avulso',
      new Date(o.created_at).toLocaleDateString('pt-BR'),
      Number(o.total).toFixed(2),
      Number(o.down_payment_value).toFixed(2),
      (Number(o.total) - Number(o.down_payment_value)).toFixed(2),
      (Number(o.total) - Number(o.down_payment_value)) <= 0 ? 'Quitado' : 'Pendente'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateReceipt = async (order: any) => {
    const { data: itemsData } = await supabase.from('order_items').select('*').eq('order_id', order.id);
    const items = (itemsData || []).map((i: any) => ({
      ...i,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      total_price: Number(i.total_price)
    }));

    const finalValue = Number(order.total);
    const discountValue = Number(order.discount_value || 0);
    const grossValue = finalValue + discountValue;
    const paidValue = Number(order.down_payment_value || 0);

    await downloadOrderPdf('RECEIPT', {
      orderId: order.id,
      issuedAt: order.created_at,
      customer: order.customers,
      items,
      grossValue,
      discountValue,
      finalValue,
      paidValue,
      remainingValue: finalValue - paidValue
    }, `recibo-${order.id.slice(0, 5)}.pdf`);
  };

  const openPaymentModal = async (order: any) => {
    // Se o modal de KPI estiver aberto, nós fechamos ele para focar no pagamento
    setKpiModalOpen(false); 
    
    setSelectedOrder(order);
    setPaymentAmount((Number(order.total) - Number(order.down_payment_value)).toFixed(2));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('PIX');
    setPaymentModalOpen(true);
    
    const { data } = await supabase
      .from('receipts')
      .select('*')
      .eq('order_id', order.id)
      .eq('tenant_id', tenantId)
      .order('payment_date', { ascending: false });
      
    if (data) setOrderReceipts(data);
  };

  const syncOrderPaymentStatus = async (orderId: string, totalOrderValue: number) => {
    const { data: receipts } = await supabase.from('receipts').select('amount').eq('order_id', orderId).eq('tenant_id', tenantId);
    const totalPaid = receipts?.reduce((acc: number, r: any) => acc + Number(r.amount), 0) || 0;
    const newStatus: PaymentStatus = totalPaid >= totalOrderValue ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'PENDING';

    await supabase.from('orders').update({ 
      down_payment_value: totalPaid, 
      payment_status: newStatus 
    }).eq('id', orderId).eq('tenant_id', tenantId);

    return totalPaid;
  };

  const handleAddReceipt = async () => {
    if (!tenantId || !selectedOrder || !paymentAmount) return;
    setProcessing(true);
    
    const amountNum = parseFloat(paymentAmount.replace(',', '.'));
    
    await supabase.from('receipts').insert({
      tenant_id: tenantId,
      order_id: selectedOrder.id,
      amount: amountNum,
      payment_date: new Date(paymentDate).toISOString(),
      description: `${paymentMethod} - Lançamento Financeiro`
    });

    await syncOrderPaymentStatus(selectedOrder.id, Number(selectedOrder.total));
    
    setPaymentModalOpen(false);
    fetchFinancials();
    setProcessing(false);
  };

  const handleEstornarReceipt = async (receiptId: string) => {
    const confirmCancel = window.confirm("Atenção: Deseja ESTORNAR este pagamento? O valor voltará a ficar como saldo devedor.");
    if (!confirmCancel || !tenantId || !selectedOrder) return;
    setProcessing(true);

    await supabase.from('receipts').delete().eq('id', receiptId).eq('tenant_id', tenantId);
    const newTotalPaid = await syncOrderPaymentStatus(selectedOrder.id, Number(selectedOrder.total));
    
    setOrderReceipts(prev => prev.filter(r => r.id !== receiptId));
    setSelectedOrder({...selectedOrder, down_payment_value: newTotalPaid});
    setPaymentAmount((Number(selectedOrder.total) - newTotalPaid).toFixed(2));
    
    fetchFinancials();
    setProcessing(false);
  };

  // Funções de clique dos KPIs
  const handleKpiClick = (type: 'A_RECEBER' | 'INADIMPLENCIA') => {
    const list = type === 'A_RECEBER' ? kpis.aReceberList : kpis.emAtrasoList;
    if (list.length === 0) return; // Não abre se não tiver ninguém devendo
    
    setKpiModalType(type);
    setKpiModalOrders(list);
    setKpiModalOpen(true);
  };

  if (authLoading || !tenantId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-black uppercase tracking-widest animate-pulse">
        Sincronizando Fluxo de Caixa...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER E EXPORTAÇÃO */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-green-500">Financeiro</h1>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mt-1">Gestão de Contas a Receber e Tesouraria</p>
          </div>
          <button onClick={exportToCSV} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-700">
            📊 Exportar Planilha (CSV)
          </button>
        </header>

        {/* MINI-DASHBOARD DE INADIMPLÊNCIA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Faturado Geral</h3>
            <p className="text-3xl font-black font-mono text-slate-200">R$ {kpis.faturado.toFixed(2)}</p>
          </div>
          
          <div 
            onClick={() => handleKpiClick('A_RECEBER')}
            className={`bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden transition-all ${kpis.aReceberList.length > 0 ? 'cursor-pointer hover:border-orange-500/50 hover:bg-slate-800/50 group' : 'opacity-80'}`}
            title={kpis.aReceberList.length > 0 ? "Clique para ver a lista de clientes a receber" : "Nenhum valor a receber"}
          >
            <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2 group-hover:text-orange-400 transition-colors">A Receber (Na Rua)</h3>
            <p className="text-3xl font-black font-mono text-orange-400">R$ {kpis.aReceber.toFixed(2)}</p>
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all"><span className="text-6xl">⏳</span></div>
          </div>
          
          <div 
            onClick={() => handleKpiClick('INADIMPLENCIA')}
            className={`bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden transition-all ${kpis.emAtrasoList.length > 0 ? 'cursor-pointer hover:border-red-500/50 hover:bg-slate-800/50 group' : 'opacity-80'}`}
            title={kpis.emAtrasoList.length > 0 ? "Clique para ver a lista de inadimplentes" : "Nenhuma inadimplência"}
          >
            <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2 group-hover:text-red-400 transition-colors">Inadimplência (Atrasados)</h3>
            <p className="text-3xl font-black font-mono text-red-500">R$ {kpis.emAtraso.toFixed(2)}</p>
            <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all"><span className="text-6xl">🚨</span></div>
          </div>
        </div>

        {/* FILTROS E BUSCA */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex w-full md:w-auto bg-slate-950 rounded-xl p-1 border border-slate-800">
            {(['ALL', 'PENDING', 'PAID'] as FilterTab[]).map(tab => (
              <button 
                key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-green-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'ALL' ? 'Todos' : tab === 'PENDING' ? 'Pendentes' : 'Quitados'}
              </button>
            ))}
          </div>
          <div className="w-full md:w-80 relative">
            <input 
              type="text" 
              placeholder="Buscar cliente ou pedido..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-100 outline-none focus:border-green-500 transition-colors"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          </div>
        </div>

        {/* TABELA DE RECEBIMENTOS */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-950/80 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                <tr>
                  <th className="px-6 py-5">Cliente / Pedido</th>
                  <th className="px-6 py-5">Total</th>
                  <th className="px-6 py-5">Pago</th>
                  <th className="px-6 py-5">Saldo Devedor</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center animate-pulse text-slate-500 font-black text-xs uppercase tracking-widest">Carregando carteira...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-black text-xs uppercase tracking-widest">Nenhum pedido encontrado.</td></tr>
                ) : filteredOrders.map(order => {
                  const total = Number(order.total);
                  const pago = Number(order.down_payment_value);
                  const saldo = total - pago;
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-5">
                        <p className="font-black text-slate-200 uppercase tracking-tight text-sm">{order.customers?.name || 'Consumidor Avulso'}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-mono mt-1 font-bold">#{order.id.slice(0, 6)} • {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="px-6 py-5 font-mono font-bold text-slate-300">R$ {total.toFixed(2)}</td>
                      <td className="px-6 py-5 text-green-400 font-mono font-black">R$ {pago.toFixed(2)}</td>
                      <td className="px-6 py-5 text-orange-400 font-mono font-black">R$ {saldo.toFixed(2)}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          saldo <= 0 ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        }`}>
                          {saldo <= 0 ? 'Quitado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right flex justify-end gap-2">
                        <button onClick={() => handleGenerateReceipt(order)} className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">PDF</button>
                        <button onClick={() => openPaymentModal(order)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${saldo <= 0 ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 shadow-none' : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'}`}>
                          Receber
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: DETALHAMENTO DOS KPIs (O "Drill-down")                      */}
      {/* ==================================================================== */}
      {kpiModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className={`p-8 border-b border-slate-800 flex justify-between items-start ${kpiModalType === 'INADIMPLENCIA' ? 'bg-red-500/5' : 'bg-orange-500/5'}`}>
              <div>
                <h2 className="text-xl font-black tracking-tighter uppercase text-slate-100">
                  {kpiModalType === 'A_RECEBER' ? 'Valores a Receber' : '🚨 Clientes Inadimplentes'}
                </h2>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${kpiModalType === 'INADIMPLENCIA' ? 'text-red-500' : 'text-orange-500'}`}>
                  {kpiModalOrders.length} {kpiModalOrders.length === 1 ? 'pedido listado' : 'pedidos listados'}
                </p>
              </div>
              <button onClick={() => setKpiModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-all">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {kpiModalOrders.map(order => {
                const total = Number(order.total);
                const pago = Number(order.down_payment_value);
                const saldo = total - pago;
                const cleanPhone = order.customers?.whatsapp?.replace(/\D/g, '') || '';
                const zapLink = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

                return (
                  <div key={order.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <div>
                       <p className="font-black text-slate-200 uppercase tracking-tight text-sm">{order.customers?.name || 'Consumidor Avulso'}</p>
                       <p className="text-[10px] text-slate-500 uppercase font-mono mt-1 font-bold">
                         Pedido #{order.id.slice(0, 6)}
                         {order.delivery_date && <span className="ml-2 text-slate-600">| Prazo: {new Date(order.delivery_date).toLocaleDateString('pt-BR')}</span>}
                       </p>
                     </div>
                     
                     <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className={`font-mono font-black ${kpiModalType === 'INADIMPLENCIA' ? 'text-red-500' : 'text-orange-400'}`}>
                             R$ {saldo.toFixed(2)}
                          </p>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Saldo Devedor</p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                           {order.customers?.whatsapp && (
                             <a 
                               href={`https://wa.me/${zapLink}?text=Olá,%20verificamos%20um%20saldo%20pendente%20referente%20ao%20pedido%20%23${order.id.slice(0,6)}...`}
                               target="_blank"
                               className="px-4 py-2 bg-slate-800 hover:bg-green-500/20 text-green-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-center border border-slate-700 hover:border-green-500/30 transition-all"
                             >
                               Cobrar via Zap
                             </a>
                           )}
                           <button 
                             onClick={() => openPaymentModal(order)}
                             className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center shadow-lg shadow-green-900/20 transition-all"
                           >
                             Receber
                           </button>
                        </div>
                     </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: PAGAMENTOS E ESTORNOS (O Existente)                          */}
      {/* ==================================================================== */}
      {paymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-8 bg-slate-950/50 border-b border-slate-800 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black tracking-tighter uppercase text-slate-100">Contas a Receber</h2>
                <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mt-1">
                  Pedido #{selectedOrder.id.slice(0, 6)} • {selectedOrder.customers?.name}
                </p>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-all">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 border-b border-slate-800">
                <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">Histórico de Lançamentos</h3>
                {orderReceipts.length === 0 ? (
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Nenhum valor recebido até o momento.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderReceipts.map(receipt => (
                      <div key={receipt.id} className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800 group hover:border-slate-700 transition-colors">
                        <div>
                          <p className="text-green-400 font-mono font-black text-sm">R$ {Number(receipt.amount).toFixed(2)}</p>
                          <p className="text-[9px] text-slate-500 uppercase font-bold mt-1 tracking-widest">
                            {new Date(receipt.payment_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} • {receipt.description || 'Pagamento'}
                          </p>
                        </div>
                        <button 
                          onClick={() => handleEstornarReceipt(receipt.id)} disabled={processing}
                          className="opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                        >
                          Estornar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(Number(selectedOrder.total) - Number(selectedOrder.down_payment_value)) > 0 && (
                <div className="p-8 bg-slate-950">
                  <h3 className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">Dar Baixa no Caixa</h3>
                  
                  <div className="space-y-5 mb-8">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor Recebido (R$)</label>
                        <input 
                          type="number" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} 
                          className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-green-400 font-black text-xl outline-none focus:border-green-500 font-mono transition-colors" 
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Método</label>
                          <select 
                            value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-slate-200 text-xs font-black outline-none focus:border-green-500 appearance-none transition-colors"
                          >
                            <option value="PIX">Pix</option>
                            <option value="DINHEIRO">Dinheiro</option>
                            <option value="CREDITO">Cartão de Crédito</option>
                            <option value="DEBITO">Cartão de Débito</option>
                            <option value="TRANSFERENCIA">Transferência</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Data</label>
                          <input 
                            type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-slate-200 text-xs font-mono outline-none focus:border-green-500 transition-colors" 
                          />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setPaymentModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 px-6 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-300 transition-all">
                        Fechar
                    </button>
                    <button onClick={handleAddReceipt} disabled={processing || !paymentAmount} className="flex-[2] bg-green-600 hover:bg-green-500 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-900/20 transition-all disabled:opacity-50 text-white">
                        {processing ? 'Registrando...' : 'Confirmar Recebimento'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {(Number(selectedOrder.total) - Number(selectedOrder.down_payment_value)) <= 0 && (
               <div className="p-8 bg-green-500/5 border-t border-green-500/10 flex justify-between items-center">
                 <p className="text-green-500 font-black uppercase text-[10px] tracking-widest">Pedido totalmente quitado.</p>
                 <button onClick={() => setPaymentModalOpen(false)} className="bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-300 transition-all">Sair</button>
               </div>
            )}
            
          </div>
        </div>
      )}
    </main>
  );
}