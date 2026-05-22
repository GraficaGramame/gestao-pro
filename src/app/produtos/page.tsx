/**
 * src/app/produtos/page.tsx
 * Módulo de Produtos - UX Premium, Busca Instantânea e Auditoria de Margem.
 */
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Product, CalculationType } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';

// Formatação com até 4 casas decimais para itens de alta precisão
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4 
  }).format(value);

const calcLabels: Record<string, string> = { 
  AREA: 'Área (m²)', 
  UNIT: 'Unidade', 
  TIME: 'Tempo', 
  FIXED: 'Fixo' 
};

export default function ProdutosPage() {
  const { tenantId, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados do Formulário
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [calcType, setCalcType] = useState<CalculationType>('UNIT');
  const [unit, setUnit] = useState('un');
  const [basePrice, setBasePrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [isOutsourced, setIsOutsourced] = useState(false);

  const fetchProducts = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, [tenantId]);

  // ==========================================
  // AÇÕES DE BANCO DE DADOS (CRUD)
  // ==========================================

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const numBasePrice = parseFloat(basePrice.replace(',', '.'));
    const numCostPrice = parseFloat(costPrice.replace(',', '.'));

    const payload = {
      tenant_id: tenantId,
      name: name.trim(),
      calculation_type: calcType,
      unit: unit.trim(),
      base_price: numBasePrice,
      cost_price: numCostPrice,
      is_outsourced: isOutsourced,
    };

    if (editingId) {
      await supabase.from('products').update(payload).eq('id', editingId).eq('tenant_id', tenantId);
    } else {
      await supabase.from('products').insert(payload);
    }

    handleCancel();
    await fetchProducts();
    setSubmitting(false);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setCalcType(product.calculation_type);
    setUnit(product.unit || 'un');
    setBasePrice(product.base_price.toString());
    setCostPrice(product.cost_price.toString());
    setIsOutsourced(product.is_outsourced);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, productName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${productName}" permanentemente?`)) return;
    await supabase.from('products').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchProducts();
  };

  const handleCancel = () => {
    setEditingId(null);
    setName('');
    setCalcType('UNIT');
    setUnit('un');
    setBasePrice('');
    setCostPrice('');
    setIsOutsourced(false);
  };

  // Filtro de busca instantâneo
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
    <main className="min-h-screen bg-slate-950 text-white p-8 flex-1 overflow-y-auto font-sans relative">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-green-500 uppercase tracking-tighter">Produtos</h1>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Gestão de Catálogo, Custos e Margens</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: Formulário de Cadastro */}
        <section className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 h-fit shadow-2xl sticky top-8">
          <h2 className="text-[10px] font-black uppercase tracking-widest mb-6 text-green-500">
            {editingId ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Nome do Produto</label>
              <input
                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Adesivo Vinil Brilho"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-200 outline-none focus:border-green-500 transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Cálculo</label>
                <select
                  value={calcType} onChange={(e) => setCalcType(e.target.value as CalculationType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-200 outline-none focus:border-green-500 appearance-none"
                >
                  <option value="AREA">Área (m²)</option>
                  <option value="UNIT">Unidade</option>
                  <option value="TIME">Tempo</option>
                  <option value="FIXED">Fixo</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Medida (un/m²)</label>
                <input
                  type="text" required value={unit} onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-200 outline-none focus:border-green-500 text-center uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Custo (R$)</label>
                <input
                  type="number" step="0.0001" required value={costPrice} onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-mono font-black text-red-500 outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Venda (R$)</label>
                <input
                  type="number" step="0.0001" required value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm font-mono font-black text-green-500 outline-none focus:border-green-500"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-800/30 transition-colors">
              <input
                type="checkbox" checked={isOutsourced} onChange={(e) => setIsOutsourced(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-950 accent-orange-500"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Produto Terceirizado</span>
            </label>

            <div className="flex gap-4 pt-2">
              {editingId && (
                <button type="button" onClick={handleCancel} className="flex-1 bg-slate-800 text-slate-300 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-700 transition-all">
                  Cancelar
                </button>
              )}
              <button type="submit" disabled={submitting} className="flex-1 bg-green-500 text-slate-950 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-green-400 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100">
                {submitting ? 'Processando...' : editingId ? 'Atualizar' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </section>

        {/* COLUNA DIREITA: Tabela de Produtos e Filtro */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Barra de Busca */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center shadow-xl relative">
            <svg className="w-5 h-5 text-slate-500 absolute left-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Buscar produto no catálogo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-slate-200 p-4 pl-12 outline-none font-bold placeholder:text-slate-600"
            />
            <div className="pr-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {filteredProducts.length} itens
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            {loading ? (
              <div className="p-10 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Carregando catálogo...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">Nenhum produto encontrado.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-950/50 text-[10px] font-black uppercase text-slate-600 border-b border-slate-800">
                  <tr>
                    <th className="p-6 text-left tracking-widest">Produto</th>
                    <th className="p-6 text-right tracking-widest">Custo</th>
                    <th className="p-6 text-right tracking-widest">Venda</th>
                    <th className="p-6 text-right tracking-widest">Margem</th>
                    <th className="p-6 text-center tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredProducts.map(product => {
                    const lucro = product.base_price - product.cost_price;
                    const margem = product.base_price > 0 ? (lucro / product.base_price) * 100 : 0;
                    
                    // Inteligência visual de margem
                    let margemColor = 'text-red-500'; // Margem baixa / Prejuízo
                    if (margem >= 50) margemColor = 'text-green-500'; // Produto Estrela
                    else if (margem >= 30) margemColor = 'text-orange-500'; // Atenção
                    
                    return (
                      <tr key={product.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="p-6">
                          <p className="font-bold text-slate-200">{product.name}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-[9px] text-slate-400 font-black uppercase tracking-widest">
                              {calcLabels[product.calculation_type]}
                            </span>
                            {product.is_outsourced && (
                              <span className="bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded text-[9px] text-orange-500 font-black uppercase tracking-widest">
                                Terceirizado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-6 text-right font-mono text-slate-400 font-bold">{formatCurrency(product.cost_price)}</td>
                        <td className="p-6 text-right font-mono text-slate-100 font-bold">{formatCurrency(product.base_price)}</td>
                        <td className="p-6 text-right">
                          <span className={`font-mono font-black ${margemColor}`}>{margem.toFixed(1)}%</span>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Botão Editar */}
                            <button onClick={() => handleEdit(product)} className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-green-500 hover:border-green-500 hover:bg-green-500/10 transition-all" title="Editar Produto">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            {/* Botão Excluir */}
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
    </main>
  );
}