/**
 * src/app/produtos/page.tsx
 * Módulo de Produtos - UX Premium, Busca Instantânea e Auditoria de Margem.
 */
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Product, CalculationType } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

// IMPORTA O NOSSO NOVO COMPONENTE DE MODAL
import WizardBuilderModal from '@/components/ui/wizard-builder-modal';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4 
  }).format(value || 0);

const calcLabels: Record<string, string> = { 
  AREA: 'Área (m²)', 
  UNIT: 'Unidade', 
  TIME: 'Tempo', 
  FIXED: 'Fixo' 
};

const parseMoneyInput = (value: string): number => {
  if (!value) return 0;
  const sanitized = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : parsed;
};

export default function ProdutosPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<any[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados do Formulário Principal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [calcType, setCalcType] = useState<CalculationType>('UNIT');
  const [unit, setUnit] = useState('un');
  const [basePrice, setBasePrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [isOutsourced, setIsOutsourced] = useState(false);
  const [showOnWebsite, setShowOnWebsite] = useState(false); 

  // Estado do Modal Construtor de Funil
  const [wizardModalProduct, setWizardModalProduct] = useState<any | null>(null);

  const fetchProducts = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar catálogo:', error);
      alert('Falha ao carregar os produtos. Tente atualizar a página.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [tenantId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantId) return; 
    setSubmitting(true);

    const payload = {
      tenant_id: tenantId,
      name: name.trim(),
      calculation_type: calcType,
      unit: unit.trim(),
      base_price: parseMoneyInput(basePrice),
      cost_price: parseMoneyInput(costPrice),
      is_outsourced: isOutsourced,
      show_on_website: showOnWebsite,
    };

    try {
      if (editingId) {
        const { error } = await (supabase as any).from('products').update(payload).eq('id', editingId).eq('tenant_id', tenantId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('products').insert(payload);
        if (error) throw error;
      }
      handleCancel();
      await fetchProducts();
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar o produto. Verifique os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setName(product.name);
    setCalcType(product.calculation_type);
    setUnit(product.unit || 'un');
    setBasePrice(product.base_price.toString());
    setCostPrice(product.cost_price.toString());
    setIsOutsourced(product.is_outsourced || false);
    setShowOnWebsite(product.show_on_website || false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, productName: string) => {
    if (!tenantId) return; 
    if (!confirm(`Tem certeza que deseja excluir o produto "${productName}" permanentemente?`)) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id).eq('tenant_id', tenantId);
      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Não foi possível excluir o produto. Ele pode estar atrelado a algum pedido existente.');
    }
  };

  const toggleWebsiteVisibility = async (id: string, currentStatus: boolean) => {
    if (!tenantId) return; 
    try {
      setProducts(products.map(p => p.id === id ? { ...p, show_on_website: !currentStatus } : p));
      
      const { error } = await (supabase as any)
        .from('products')
        .update({ show_on_website: !currentStatus })
        .eq('id', id)
        .eq('tenant_id', tenantId);
        
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao alternar visibilidade:', error);
      fetchProducts(); 
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setCalcType('UNIT');
    setUnit('un');
    setBasePrice('');
    setCostPrice('');
    setIsOutsourced(false);
    setShowOnWebsite(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || !tenantId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-500 font-black uppercase tracking-widest animate-pulse">
        Sincronizando Catálogo...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 sm:p-8 flex-1 overflow-y-auto font-sans relative">
      <header className="mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-green-500 uppercase tracking-tighter">Produtos</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Gestão de Catálogo, Custos e Vitrine</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: Formulário de Cadastro */}
        <section className="bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-800 h-fit shadow-2xl lg:sticky lg:top-8 order-2 lg:order-1">
          {/* ... (Formulário mantido igual) ... */}
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-6 text-green-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            {editingId ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Nome do Produto</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Camiseta Básica" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-200 outline-none focus:border-green-500 transition-colors" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Cálculo</label>
                <select value={calcType} onChange={(e) => setCalcType(e.target.value as CalculationType)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-200 outline-none focus:border-green-500 appearance-none cursor-pointer">
                  <option value="AREA">Área (m²)</option>
                  <option value="UNIT">Unidade</option>
                  <option value="TIME">Tempo</option>
                  <option value="FIXED">Fixo</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Medida</label>
                <input type="text" required value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="un, m², h" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-200 outline-none focus:border-green-500 text-center uppercase" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Custo (R$)</label>
                <input type="text" required value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0,00" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-mono font-black text-red-500 outline-none focus:border-red-500 placeholder:text-slate-700" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Venda (R$)</label>
                <input type="text" required value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="0,00" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-mono font-black text-green-500 outline-none focus:border-green-500 placeholder:text-slate-700" />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <label className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${isOutsourced ? 'bg-orange-500/5 border-orange-500/30' : 'border-slate-800 hover:bg-slate-800/30'}`}>
                <input type="checkbox" checked={isOutsourced} onChange={(e) => setIsOutsourced(e.target.checked)} className="w-5 h-5 rounded border-slate-700 bg-slate-950 accent-orange-500" />
                <span className={`text-[10px] font-black uppercase tracking-widest ${isOutsourced ? 'text-orange-500' : 'text-slate-400'}`}>Produto Terceirizado</span>
              </label>
              <label className={`flex items-center gap-3 p-4 border rounded-2xl cursor-pointer transition-all ${showOnWebsite ? 'bg-[#F6C689]/10 border-[#F6C689]/30' : 'border-slate-800 hover:bg-slate-800/30'}`}>
                <input type="checkbox" checked={showOnWebsite} onChange={(e) => setShowOnWebsite(e.target.checked)} className="w-5 h-5 rounded border-slate-700 bg-slate-950 accent-[#F6C689]" />
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${showOnWebsite ? 'text-[#F6C689]' : 'text-slate-400'}`}>Exibir no Site</span>
                  <span className="text-[9px] text-slate-500 font-medium">Fica visível na página de orçamento</span>
                </div>
              </label>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-800">
              {editingId && (
                <button type="button" onClick={handleCancel} className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-700 transition-all">Cancelar</button>
              )}
              <button type="submit" disabled={submitting} className="flex-1 bg-green-500 text-slate-950 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-green-400 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                {submitting ? 'Processando...' : editingId ? 'Atualizar' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </section>

        {/* COLUNA DIREITA: Tabela de Produtos */}
        <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center shadow-xl relative">
            <svg className="w-5 h-5 text-slate-500 absolute left-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input type="text" placeholder="Buscar produto no catálogo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent text-slate-200 p-4 pl-12 outline-none font-bold placeholder:text-slate-600" />
            <div className="pr-4 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-950 py-2 px-3 rounded-xl border border-slate-800">{filteredProducts.length} itens</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl overflow-x-auto">
            {loading ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
                 <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Carregando catálogo...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-16 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Nenhum produto encontrado.</div>
            ) : (
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-600 border-b border-slate-800">
                  <tr>
                    <th className="p-5 text-left tracking-widest rounded-tl-[2rem]">Produto</th>
                    <th className="p-5 text-right tracking-widest">Custo</th>
                    <th className="p-5 text-right tracking-widest">Venda</th>
                    <th className="p-5 text-right tracking-widest">Margem</th>
                    <th className="p-5 text-center tracking-widest rounded-tr-[2rem]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredProducts.map(product => {
                    const lucro = product.base_price - product.cost_price;
                    const margem = product.base_price > 0 ? (lucro / product.base_price) * 100 : 0;
                    
                    let margemColor = 'text-red-500'; 
                    if (margem >= 50) margemColor = 'text-green-500'; 
                    else if (margem >= 30) margemColor = 'text-orange-500'; 
                    
                    return (
                      <tr key={product.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                            <p className="font-bold text-slate-200 truncate max-w-[200px]">{product.name}</p>
                            {product.show_on_website && (
                              <span className="bg-[#F6C689]/10 text-[#F6C689] border border-[#F6C689]/20 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest" title="Visível no site">No Site</span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-500 font-bold uppercase tracking-widest">{calcLabels[product.calculation_type]}</span>
                          </div>
                        </td>
                        <td className="p-5 text-right font-mono text-slate-500 font-bold">{formatCurrency(product.cost_price)}</td>
                        <td className="p-5 text-right font-mono text-slate-100 font-black">{formatCurrency(product.base_price)}</td>
                        <td className="p-5 text-right"><span className={`font-mono font-black text-xs px-2 py-1 rounded bg-slate-950 border border-slate-800 ${margemColor}`}>{margem.toFixed(1)}%</span></td>
                        <td className="p-5">
                          <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            
                            {/* NOVO BOTÃO: Abrir Construtor de Funil (Varinha Mágica) */}
                            {product.show_on_website && (
                              <button 
                                onClick={() => setWizardModalProduct(product)}
                                className="p-2 border rounded-xl transition-all bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500 hover:text-white" 
                                title="Configurar Funil de Orçamento"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                              </button>
                            )}

                            {/* Toggle Vitrine */}
                            <button onClick={() => toggleWebsiteVisibility(product.id, product.show_on_website)} className={`p-2 border rounded-xl transition-all ${product.show_on_website ? 'bg-[#F6C689]/10 text-[#F6C689] border-[#F6C689]/30 hover:bg-[#F6C689]/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-[#F6C689] hover:border-[#F6C689]/50'}`} title={product.show_on_website ? "Remover do site" : "Colocar no site"}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                            </button>
                            <button onClick={() => handleEdit(product)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-green-500 hover:border-green-500 hover:bg-green-500/10 transition-all" title="Editar Produto">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <button onClick={() => handleDelete(product.id, product.name)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all" title="Excluir Produto">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* RENDERIZA O MODAL AQUI (invisível até você clicar no botão da varinha mágica) */}
      <WizardBuilderModal 
        isOpen={!!wizardModalProduct} 
        onClose={() => setWizardModalProduct(null)} 
        product={wizardModalProduct} 
        onSaveSuccess={fetchProducts} 
      />

    </main>
  );
}