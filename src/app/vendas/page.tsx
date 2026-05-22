/**
 * src/app/vendas/page.tsx
 * PDV Multi-tenant
 * Atualização: Insere o primeiro Recebimento automaticamente se houver Sinal na criação.
 * Bloqueia o campo de Sinal durante Edição (para forçar o uso do módulo Financeiro).
 */
'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, OrderItem, Customer } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

interface ProductListItemProps {
  product: Product;
  onAdd: (product: Product, qty: number, width?: number, height?: number) => void;
}

function ProductListItem({ product, onAdd }: ProductListItemProps) {
  const [width, setWidth] = useState<string>('1.00');
  const [height, setHeight] = useState<string>('1.00');
  const [qty, setQty] = useState<string>('1');
  
  const isAreaProduct = product.calculation_type === 'AREA';

  const handleAdd = () => {
    const parsedQty = parseFloat(qty.replace(',', '.'));
    if (isNaN(parsedQty) || parsedQty <= 0) {
      alert('Informe uma quantidade válida.');
      return;
    }

    if (isAreaProduct) {
      const w = parseFloat(width.replace(',', '.'));
      const h = parseFloat(height.replace(',', '.'));
      if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
        alert('Informe largura e altura válidas.');
        return;
      }
      onAdd(product, parsedQty, w, h);
    } else {
      onAdd(product, parsedQty);
    }
    
    setQty('1'); 
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl mb-2 hover:border-green-500/50 hover:bg-slate-800/50 transition-all gap-4">
      <div className="flex-1">
        <h3 className="font-bold text-sm text-slate-200">{product.name}</h3>
        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
          {isAreaProduct ? 'Cálculo: M²' : `Unid: ${product.unit || 'un'}`}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-green-400 font-mono w-24 text-right pr-2">
          R$ {product.base_price.toFixed(2)}
        </span>

        {isAreaProduct && (
          <div className="flex gap-1 items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <input
              type="number" step="0.01" value={width} onChange={e => setWidth(e.target.value)}
              className="w-12 bg-transparent text-slate-200 text-center px-0 py-1 text-xs outline-none focus:text-green-400 font-mono placeholder:text-slate-700"
              placeholder="Larg" title="Largura (m)"
            />
            <span className="text-slate-600 text-xs font-black">X</span>
            <input
              type="number" step="0.01" value={height} onChange={e => setHeight(e.target.value)}
              className="w-12 bg-transparent text-slate-200 text-center px-0 py-1 text-xs outline-none focus:text-green-400 font-mono placeholder:text-slate-700"
              placeholder="Alt" title="Altura (m)"
            />
          </div>
        )}

        <div className="flex gap-1 items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <span className="text-slate-600 text-[10px] font-black uppercase ml-1">Qtd:</span>
          <input
            type="number" step="1" min="1" value={qty} onChange={e => setQty(e.target.value)}
            className="w-10 bg-transparent text-slate-200 text-center px-0 py-1 text-xs outline-none focus:text-green-400 font-mono placeholder:text-slate-700"
            title="Quantidade de Peças"
          />
        </div>

        <button
          className="bg-green-600/10 hover:bg-green-500 text-green-500 hover:text-white px-4 py-2 rounded-lg transition-all font-black uppercase text-[10px] tracking-widest border border-green-500/20 hover:border-green-500 shrink-0 ml-1"
          onClick={handleAdd}
        >
          Add
        </button>
      </div>
    </div>
  );
}

const CATEGORIAS_RAPIDAS = ['Todos', 'Lona', 'Adesivo', 'Cartão', 'Camisa', 'Panfleto', 'Arte'];

function VendasContent() {
  const { tenantId, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const editId = searchParams.get('editId');

  const [cart, setCart] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  const [discount, setDiscount] = useState<string>('0.00');
  const [downPayment, setDownPayment] = useState<string>('0.00');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    supabase.from('products').select('*').eq('tenant_id', tenantId).order('name').then(({ data }: { data: Product[] | null }) => {
      if (data) setProducts(data.map((p: Product) => ({ ...p, unit: p.unit || 'un' })));
    });
    supabase.from('customers').select('*').eq('tenant_id', tenantId).order('name').then(({ data }: { data: Customer[] | null }) => {
      if (data) setCustomers(data);
    });
  }, [tenantId]);

  useEffect(() => {
    if (!editId || !tenantId) return;
    
    const fetchOrderForEdit = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', editId)
        .eq('tenant_id', tenantId)
        .single();

      if (data && !error) {
        setSelectedCustomerId(data.customer_id || '');
        setDiscount(Number(data.discount_value || 0).toFixed(2));
        setDownPayment(Number(data.down_payment_value || 0).toFixed(2));
        setDeliveryDate(data.delivery_date || '');
        
        const loadedCart: OrderItem[] = data.order_items.map((i: any) => ({
          id: i.id,
          product_id: i.product_id,
          description: i.description,
          quantity: Number(i.quantity),
          width: i.width ? Number(i.width) : null,
          height: i.height ? Number(i.height) : null,
          unit_price: Number(i.unit_price),
          total_price: Number(i.total_price),
          cost_total: Number(i.cost_total),
        }));
        setCart(loadedCart);
      }
    };
    
    fetchOrderForEdit();
  }, [editId, tenantId]);

  useEffect(() => {
    if (!selectedCustomerId || !tenantId || editId) return;
    
    const applyCustomerCoupon = async () => {
      const customer = customers.find(c => c.id === selectedCustomerId) as any;
      if (customer?.associated_coupon) {
        const { data: coupon } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', customer.associated_coupon)
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .single();

        if (coupon) {
          const subtotal = cart.reduce((acc, item) => acc + item.total_price, 0);
          const calculatedDiscount = coupon.discount_type === 'PERCENTAGE' 
            ? (subtotal * (coupon.discount_value / 100)) 
            : coupon.discount_value;
            
          setDiscount(calculatedDiscount.toFixed(2));
        }
      }
    };
    applyCustomerCoupon();
  }, [selectedCustomerId, cart, tenantId, customers, editId]);

  if (authLoading || !tenantId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-black uppercase tracking-widest animate-pulse">
        Sincronizando PDV...
      </div>
    );
  }

  const addToCart = (product: Product, providedQty: number, width?: number, height?: number) => {
    let finalQuantity = providedQty;
    let desc = product.name;

    if (product.calculation_type === 'AREA' && width && height) {
      const areaPerUnit = width * height;
      finalQuantity = Number((areaPerUnit * providedQty).toFixed(4));
      desc = `${product.name} (${width.toFixed(2)}x${height.toFixed(2)}m) x ${providedQty} un`;
    }

    const newItem: OrderItem = {
      id: Math.random().toString(),
      product_id: product.id,
      description: desc,
      quantity: finalQuantity,
      width: width ?? null,
      height: height ?? null,
      unit_price: product.base_price,
      total_price: Number((product.base_price * finalQuantity).toFixed(2)),
      cost_total: Number((product.cost_price * finalQuantity).toFixed(2)),
    };

    setCart([...cart, newItem]);
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));

  const cartSubtotal = cart.reduce((acc, item) => acc + item.total_price, 0);
  const numDiscount = parseFloat(discount.replace(',', '.')) || 0;
  const cartTotal = Math.max(cartSubtotal - numDiscount, 0);
  const numDownPayment = parseFloat(downPayment.toString().replace(',', '.')) || 0;

  const handleFinalizeOrder = async () => {
    if (cart.length === 0) return;
    
    if (numDownPayment > cartTotal && !editId) {
      alert("O sinal não pode ser maior que o total do pedido.");
      return;
    }

    setSavingOrder(true);
    
    try {
      const paymentStatus = numDownPayment >= cartTotal ? 'PAID' : numDownPayment > 0 ? 'PARTIAL' : 'PENDING';
      
      if (editId) {
        // ATUALIZAÇÃO DE PEDIDO
        // Apenas atualiza totais. Recebimentos NÃO são modificados aqui para blindar o fluxo de caixa.
        await supabase.from('orders').update({
          customer_id: selectedCustomerId || null,
          total: cartTotal,
          discount_value: numDiscount,
          delivery_date: deliveryDate || null
        }).eq('id', editId).eq('tenant_id', tenantId);

        await supabase.from('order_items').delete().eq('order_id', editId);
        const itemsPayload = cart.map(({ id, ...rest }: any) => ({ ...rest, order_id: editId }));
        await supabase.from('order_items').insert(itemsPayload);

        alert('Pedido atualizado com sucesso!');
      } else {
        // NOVO PEDIDO
        const initialStatus = numDownPayment > 0 ? 'SERVICE_ORDER' : 'QUOTATION';
        
        const { data: newOrder, error: orderError } = await supabase.from('orders').insert({
          tenant_id: tenantId,
          customer_id: selectedCustomerId || null,
          status: initialStatus,
          total: cartTotal,
          discount_value: numDiscount,
          down_payment_value: numDownPayment, // Fica como cache
          payment_status: paymentStatus,
          delivery_date: deliveryDate || null
        }).select().single();

        if (orderError) throw orderError;

        if (newOrder) {
          const itemsPayload = cart.map(({ id, ...rest }: any) => ({ ...rest, order_id: newOrder.id }));
          await supabase.from('order_items').insert(itemsPayload);

          // NOVO: INSERE O SINAL NA TABELA DE HISTÓRICO DE RECEBIMENTOS AUTOMATICAMENTE
          if (numDownPayment > 0) {
            await supabase.from('receipts').insert({
              tenant_id: tenantId,
              order_id: newOrder.id,
              amount: numDownPayment,
              description: 'Sinal inicial no balcão'
            });
          }
        }

        alert('Pedido gerado com sucesso!');
      }

      setCart([]); setDiscount('0.00'); setDownPayment('0.00'); setDeliveryDate('');
      router.push('/pedidos');
    } catch (e) {
      alert('Erro ao processar pedido.');
      console.error(e);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!editId) return;
    const confirmCancel = window.confirm("ATENÇÃO: Tem certeza que deseja CANCELAR este pedido? Essa ação é irreversível.");
    if (!confirmCancel) return;

    setSavingOrder(true);
    await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', editId).eq('tenant_id', tenantId);
    alert('Pedido Cancelado.');
    router.push('/pedidos');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'Todos' || p.name.toLowerCase().includes(activeCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  return (
    <main className="flex min-h-screen bg-slate-950 text-slate-100 flex-1">
      <div className="flex-1 flex flex-col border-r border-slate-900 h-screen">
        
        <div className="p-8 pb-4 shrink-0 bg-slate-950 sticky top-0 z-10 border-b border-slate-900 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-green-500 mb-2">
              {editId ? `Editar Pedido #${editId.slice(0,6)}` : 'Terminal de Vendas'}
            </h1>
            {editId && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Ajuste de carrinho e cliente</p>}
          </div>

          {editId && (
            <button 
              onClick={handleCancelOrder}
              className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
            >
              Cancelar Pedido
            </button>
          )}
        </div>

        <div className="p-8 pb-4 shrink-0 bg-slate-950">
          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Buscar produto por nome..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 text-sm outline-none focus:border-green-500 text-slate-200 placeholder:text-slate-600 shadow-inner"
            />
            
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {CATEGORIAS_RAPIDAS.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                    activeCategory === cat 
                      ? 'bg-green-600 border-green-500 text-white shadow-lg shadow-green-900/20' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="text-center text-slate-600 font-black uppercase tracking-widest mt-10">
              Nenhum produto encontrado.
            </div>
          ) : (
            <div className="flex flex-col pb-20">
              {filteredProducts.map(p => <ProductListItem key={p.id} product={p} onAdd={addToCart} />)}
            </div>
          )}
        </div>
      </div>

      <div className="w-[420px] p-6 bg-slate-900 flex flex-col h-screen sticky top-0 shadow-2xl shrink-0">
        <h2 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-slate-400">🛒 Checkout ({cart.length})</h2>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {cart.map((item: OrderItem) => (
            <div key={item.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 relative group transition-all hover:border-slate-700">
              <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-red-500 hover:bg-red-500/10 p-1 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <p className="text-xs font-bold mb-2 pr-6 leading-tight text-slate-200">{item.description}</p>
              <div className="flex justify-between items-center pt-2 border-t border-slate-900">
                <span className="text-[10px] text-slate-500 font-bold font-mono">{item.quantity} x R$ {item.unit_price.toFixed(2)}</span>
                <span className="text-sm font-black text-green-400 font-mono">R$ {item.total_price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="mb-4">
            <label className="block text-[9px] text-slate-500 font-black uppercase mb-2">Vincular Cliente da Base</label>
            <select 
              value={selectedCustomerId} 
              onChange={e => setSelectedCustomerId(e.target.value)} 
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-3 text-xs outline-none focus:border-green-500 text-slate-200 font-bold mb-3"
            >
              <option value="">Balcão (Consumidor Final Avulso)</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <label className="block text-[9px] text-slate-500 font-black uppercase mb-2 mt-4">Prazo de Entrega (Opcional)</label>
            <input 
              type="date"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-3 text-xs outline-none focus:border-blue-500 text-slate-200"
            />
          </div>

          <div className="space-y-3 mb-6 bg-slate-950 p-5 rounded-3xl border border-slate-800 shadow-inner">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500 uppercase font-black">Subtotal</span>
              <span className="font-mono text-slate-300 font-bold">R$ {cartSubtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-slate-500 uppercase font-black">Desconto (R$)</span>
              <div className="flex items-center gap-1">
                <span className="text-red-400 font-black">- R$</span>
                <input
                  type="number" step="0.01" min="0" value={discount} onChange={e => setDiscount(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-right text-red-400 font-mono font-black outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-800">
              <span className="text-slate-100 font-black uppercase text-xs tracking-widest">Total Geral</span>
              <span className="text-3xl font-black text-slate-100 font-mono">R$ {cartTotal.toFixed(2)}</span>
            </div>

            <div className={`flex justify-between items-center text-[10px] mt-2 p-2 rounded-lg border ${editId ? 'bg-slate-900/50 border-slate-800 opacity-50' : 'bg-green-500/10 border-green-500/20'}`}>
              <div className="flex flex-col">
                <span className={`${editId ? 'text-slate-500' : 'text-green-500'} uppercase font-black`}>Sinal / Recebido</span>
                {editId && <span className="text-[8px] text-red-400 mt-1 uppercase font-bold">Gerencie no Financeiro</span>}
              </div>
              <div className="flex items-center gap-1">
                <span className={`${editId ? 'text-slate-600' : 'text-green-400'} font-black`}>R$</span>
                <input
                  type="number" step="0.01" min="0" value={downPayment} onChange={e => setDownPayment(e.target.value)}
                  disabled={!!editId} // Desativa edição financeira no PDV se for atualização de pedido
                  className={`w-20 bg-slate-950 rounded-lg px-2 py-1 text-right font-mono font-black outline-none transition-colors ${
                    editId ? 'text-slate-500 border-slate-800 cursor-not-allowed' : 'text-green-400 border border-green-500/30 focus:border-green-500'
                  }`}
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleFinalizeOrder}
            disabled={cart.length === 0 || savingOrder}
            className={`w-full text-white font-black py-5 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-2xl ${
              editId ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-green-600 hover:bg-green-500 shadow-green-900/20'
            } disabled:bg-slate-800 disabled:text-slate-600`}
          >
            {savingOrder ? 'Processando...' : editId ? 'Atualizar Pedido' : 'Finalizar Pedido'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function VendasPage() {
  return (
    <Suspense fallback={<div className="bg-slate-950 min-h-screen text-slate-700 p-20 text-center font-black uppercase tracking-widest">Iniciando PDV...</div>}>
      <VendasContent />
    </Suspense>
  );
}