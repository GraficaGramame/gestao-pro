'use client';

import React, { useState, useEffect } from 'react';
import { B2BProduct } from '@/types/b2b';
import { supabase } from '@/lib/supabase/client';
import { Search, Edit2, Trash2, Power, Layers, PackagePlus, X, Loader2, Sparkles } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'c1', name: 'Sacolas', slug: 'sacolas', isActive: true },
  { id: 'c2', name: 'Tags & Cards', slug: 'tags', isActive: true },
  { id: 'c3', name: 'Adesivos & Lacres', slug: 'adesivos', isActive: true },
];

export default function AdminB2BPage() {
  const [products, setProducts] = useState<B2BProduct[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('todas');

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<B2BProduct | null>(null);
  const [productToEdit, setProductToEdit] = useState<B2BProduct | null>(null);

  // Form State: Cadastro
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('sacolas');
  const [newDimensions, setNewDimensions] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('/assets/img-adesivos.webp');
  
  // Preços de Tiragens (Cadastro)
  const [p25, setP25] = useState('3.80');
  const [p50, setP50] = useState('2.50');
  const [p100, setP100] = useState('1.80');
  const [p250, setP250] = useState('1.50');
  const [p500, setP500] = useState('1.30');
  const [p1000, setP1000] = useState('1.10');

  // Taxas e Upsell (Cadastro)
  const [newArtFee, setNewArtFee] = useState('85.90');
  const [newReviewFee, setNewReviewFee] = useState('21.90');
  const [newUpsellActive, setNewUpsellActive] = useState(true);
  const [newUpsellTitle, setNewUpsellTitle] = useState('Kit 100 Tags Personalizadas em Couché 300g');
  const [newUpsellPrice, setNewUpsellPrice] = useState('89.00');

  // Form State: Edição
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('sacolas');
  const [editDimensions, setEditDimensions] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editP25, setEditP25] = useState('');
  const [editP50, setEditP50] = useState('');
  const [editP100, setEditP100] = useState('');
  const [editP250, setEditP250] = useState('');
  const [editP500, setEditP500] = useState('');
  const [editP1000, setEditP1000] = useState('');
  const [editArtFee, setEditArtFee] = useState('');
  const [editReviewFee, setEditReviewFee] = useState('');
  const [editUpsellActive, setEditUpsellActive] = useState(true);
  const [editUpsellTitle, setEditUpsellTitle] = useState('');
  const [editUpsellPrice, setEditUpsellPrice] = useState('');

  const [newCatName, setNewCatName] = useState('');

  // 1. Carregar Dados do Supabase
  const loadAdminData = async () => {
    setLoading(true);
    try {
      const { data: prods, error: prodErr } = await (supabase.from('b2b_products') as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (!prodErr && prods && prods.length > 0) {
        const formatted: B2BProduct[] = await Promise.all(
          prods.map(async (p: any) => {
            const { data: variants } = await (supabase.from('b2b_variants') as any)
              .select('*')
              .eq('product_id', p.id);

            const { data: tiers } = await (supabase.from('b2b_pricing_tiers') as any)
              .select('*')
              .eq('product_id', p.id)
              .order('min_quantity', { ascending: true });

            return {
              id: p.id,
              slug: p.slug,
              title: p.title,
              category: (p.slug.includes('tag') ? 'tags' : p.slug.includes('adesivo') ? 'adesivos' : 'sacolas') as any,
              dimensions: p.dimensions,
              description: p.description || '',
              imageUrl: p.image_url || '/assets/img-adesivos.webp',
              galleryUrls: p.gallery_urls || [],
              isActive: p.is_active,
              artFee: Number(p.art_fee ?? 85.90),
              reviewFee: Number(p.review_fee ?? 21.90),
              upsellActive: p.upsell_active ?? true,
              upsellTitle: p.upsell_title || 'Kit 100 Tags Personalizadas',
              upsellPrice: Number(p.upsell_price ?? 89.00),
              variants: (variants && variants.length > 0) ? variants.map((v: any) => ({
                id: v.id,
                name: v.name,
                paperType: v.paper_type,
                colorType: v.color_type as any,
                handleType: v.handle_type,
                isActive: v.is_active,
              })) : [],
              pricingTiers: (tiers && tiers.length > 0) ? tiers.map((t: any) => ({
                id: t.id,
                minQuantity: t.min_quantity,
                unitPrice: Number(t.unit_price),
              })) : [],
              additionalServices: [
                { id: 's1', name: 'Criação Profissional da Arte', price: Number(p.art_fee ?? 85.90) },
                { id: 's2', name: 'Revisão Técnica do Arquivo PDF', price: Number(p.review_fee ?? 21.90) },
              ],
            };
          })
        );
        setProducts(formatted);
      } else {
        const localData = typeof window !== 'undefined' ? localStorage.getItem('gramame_b2b_products') : null;
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) setProducts(parsed);
        }
      }

      const { data: cats } = await (supabase.from('b2b_categories') as any).select('*');
      if (cats && cats.length > 0) {
        setCategories(cats.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          isActive: c.is_active,
        })));
      }
    } catch (e) {
      console.error('Erro ao carregar dados admin:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // 2. Alternar Status do Produto (Ativo/Stand-by)
  const toggleProductStatus = async (productId: string) => {
    const currentProd = products.find((p) => p.id === productId);
    if (!currentProd) return;

    const newStatus = !currentProd.isActive;
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isActive: newStatus } : p))
    );

    try {
      await (supabase.from('b2b_products') as any)
        .update({ is_active: newStatus })
        .eq('id', productId);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('b2b_products_updated'));
      }
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }
  };

  // 3. Abrir Modal de Edição com Preços e Serviços Preenchidos
  const openEditModal = (product: B2BProduct) => {
    setProductToEdit(product);
    setEditTitle(product.title);
    setEditCategory(product.category);
    setEditDimensions(product.dimensions);
    setEditImageUrl(product.imageUrl);

    // Mapear preços das tiragens
    const t25 = product.pricingTiers.find((t) => t.minQuantity === 25)?.unitPrice || 3.80;
    const t50 = product.pricingTiers.find((t) => t.minQuantity === 50)?.unitPrice || 2.50;
    const t100 = product.pricingTiers.find((t) => t.minQuantity === 100)?.unitPrice || 1.80;
    const t250 = product.pricingTiers.find((t) => t.minQuantity === 250)?.unitPrice || 1.50;
    const t500 = product.pricingTiers.find((t) => t.minQuantity === 500)?.unitPrice || 1.30;
    const t1000 = product.pricingTiers.find((t) => t.minQuantity === 1000)?.unitPrice || 1.10;

    setEditP25(t25.toString());
    setEditP50(t50.toString());
    setEditP100(t100.toString());
    setEditP250(t250.toString());
    setEditP500(t500.toString());
    setEditP1000(t1000.toString());

    setEditArtFee(product.artFee.toString());
    setEditReviewFee(product.reviewFee.toString());
    setEditUpsellActive(product.upsellActive);
    setEditUpsellTitle(product.upsellTitle);
    setEditUpsellPrice(product.upsellPrice.toString());

    setIsEditModalOpen(true);
  };

  // 4. Salvar Alterações de Edição no Supabase
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEdit || !editTitle.trim()) return;

    setSaving(true);
    try {
      // Atualiza produto
      const { error: updateErr } = await (supabase.from('b2b_products') as any)
        .update({
          title: editTitle,
          slug: editTitle.toLowerCase().replace(/\s+/g, '-'),
          dimensions: editDimensions || 'Padrão',
          image_url: editImageUrl,
          art_fee: parseFloat(editArtFee) || 0,
          review_fee: parseFloat(editReviewFee) || 0,
          upsell_active: editUpsellActive,
          upsell_title: editUpsellTitle,
          upsell_price: parseFloat(editUpsellPrice) || 0,
        })
        .eq('id', productToEdit.id);

      if (updateErr) {
        alert(`Erro ao atualizar produto: ${updateErr.message}`);
      } else {
        // Deleta e recria as tiragens com os valores novos digitados
        await (supabase.from('b2b_pricing_tiers') as any)
          .delete()
          .eq('product_id', productToEdit.id);

        await (supabase.from('b2b_pricing_tiers') as any).insert([
          { product_id: productToEdit.id, min_quantity: 25, unit_price: parseFloat(editP25) || 3.80 },
          { product_id: productToEdit.id, min_quantity: 50, unit_price: parseFloat(editP50) || 2.50 },
          { product_id: productToEdit.id, min_quantity: 100, unit_price: parseFloat(editP100) || 1.80 },
          { product_id: productToEdit.id, min_quantity: 250, unit_price: parseFloat(editP250) || 1.50 },
          { product_id: productToEdit.id, min_quantity: 500, unit_price: parseFloat(editP500) || 1.30 },
          { product_id: productToEdit.id, min_quantity: 1000, unit_price: parseFloat(editP1000) || 1.10 },
        ]);

        alert('Produto, preços, taxas e bonificações atualizados com sucesso!');
        await loadAdminData();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('b2b_products_updated'));
        }

        setIsEditModalOpen(false);
        setProductToEdit(null);
      }
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
    } finally {
      setSaving(false);
    }
  };

  // 5. Cadastrar Novo Produto com Todos os Campos
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSaving(true);
    const newSlug = newTitle.toLowerCase().replace(/\s+/g, '-');

    try {
      const { data: insertedProduct, error: prodErr } = await (supabase.from('b2b_products') as any)
        .insert({
          tenant_id: '00000000-0000-0000-0000-000000000000',
          title: newTitle,
          slug: newSlug,
          dimensions: newDimensions || 'Padrão',
          image_url: newImageUrl,
          is_active: true,
          art_fee: parseFloat(newArtFee) || 0,
          review_fee: parseFloat(newReviewFee) || 0,
          upsell_active: newUpsellActive,
          upsell_title: newUpsellTitle,
          upsell_price: parseFloat(newUpsellPrice) || 0,
        })
        .select()
        .single();

      if (prodErr) {
        alert(`Erro do Supabase ao cadastrar: ${prodErr.message}`);
      } else if (insertedProduct) {
        // Insere as 6 faixas de preço customizadas
        await (supabase.from('b2b_pricing_tiers') as any).insert([
          { product_id: insertedProduct.id, min_quantity: 25, unit_price: parseFloat(p25) || 3.80 },
          { product_id: insertedProduct.id, min_quantity: 50, unit_price: parseFloat(p50) || 2.50 },
          { product_id: insertedProduct.id, min_quantity: 100, unit_price: parseFloat(p100) || 1.80 },
          { product_id: insertedProduct.id, min_quantity: 250, unit_price: parseFloat(p250) || 1.50 },
          { product_id: insertedProduct.id, min_quantity: 500, unit_price: parseFloat(p500) || 1.30 },
          { product_id: insertedProduct.id, min_quantity: 1000, unit_price: parseFloat(p1000) || 1.10 },
        ]);

        // Insere variantes padrão
        await (supabase.from('b2b_variants') as any).insert([
          { product_id: insertedProduct.id, name: 'Offset Branca', paper_type: 'Offset 150g', color_type: 'Branca', is_active: true },
          { product_id: insertedProduct.id, name: 'Offset Colorida', paper_type: 'Offset 150g', color_type: 'Colorida', is_active: true },
        ]);

        alert('Produto cadastrado com sucesso!');
        await loadAdminData();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('b2b_products_updated'));
        }

        setIsProductModalOpen(false);
        setNewTitle('');
        setNewDimensions('');
      }
    } catch (err) {
      console.error('Erro ao cadastrar produto:', err);
    } finally {
      setSaving(false);
    }
  };

  // 6. Cadastrar Categoria
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const { error: catErr } = await (supabase.from('b2b_categories') as any).insert({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        name: newCatName,
        slug: newCatName.toLowerCase().replace(/\s+/g, '-'),
        is_active: true,
      });

      if (catErr) {
        alert(`Erro ao cadastrar categoria: ${catErr.message}`);
      } else {
        alert('Categoria cadastrada com sucesso!');
        await loadAdminData();
        setNewCatName('');
        setIsCategoryModalOpen(false);
      }
    } catch (err) {
      console.error('Erro ao cadastrar categoria:', err);
    }
  };

  // 7. Excluir Produto
  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await (supabase.from('b2b_products') as any).delete().eq('id', productToDelete.id);
      if (error) {
        alert(`Erro ao excluir: ${error.message}`);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('b2b_products_updated'));
        }
      }
      setProductToDelete(null);
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'todas' || p.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho Admin */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Painel Administrativo B2B</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestão total de preços, tiragens, taxas de criação e bonificações da Gráfica Gramame.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Layers className="w-4 h-4" />
            <span>+ Gerenciar Categorias</span>
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="bg-[#28397a] hover:bg-blue-900 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Cadastrar Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#28397a] focus:outline-none bg-white text-slate-900"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategoryFilter('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              selectedCategoryFilter === 'todas' ? 'bg-[#28397a] text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                selectedCategoryFilter === cat.slug ? 'bg-[#28397a] text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Produtos CRUD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 text-[#28397a] animate-spin" />
            <span className="ml-3 text-xs font-bold text-slate-700">Carregando dados do Supabase...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Dimensões</th>
                  <th className="p-4">Taxa de Arte</th>
                  <th className="p-4">Combo/Bonificação</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 p-1 shrink-0 flex items-center justify-center">
                        <img src={product.imageUrl} alt={product.title} className="max-h-full max-w-full object-contain" />
                      </div>
                      <span>{product.title}</span>
                    </td>
                    <td className="p-4 capitalize">{product.category}</td>
                    <td className="p-4">{product.dimensions}</td>
                    <td className="p-4 font-bold text-slate-800">
                      {product.artFee > 0 ? `R$ ${product.artFee.toFixed(2)}` : 'Grátis/Desativada'}
                    </td>
                    <td className="p-4">
                      {product.upsellActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Sparkles className="w-3 h-3" />
                          <span>{product.upsellPrice > 0 ? `+R$ ${product.upsellPrice.toFixed(2)}` : 'Brinde 100% Grátis'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Desativado</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleProductStatus(product.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black cursor-pointer border transition-all ${
                          product.isActive
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{product.isActive ? 'Ativo' : 'Stand-by'}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar Preços e Serviços"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setProductToDelete(product)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edição Completa */}
      {isEditModalOpen && productToEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Editar Produto e Preços</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProduct} className="space-y-5">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Título do Produto:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Dimensões:</label>
                  <input
                    type="text"
                    value={editDimensions}
                    onChange={(e) => setEditDimensions(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">URL da Imagem:</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-900"
                />
              </div>

              {/* Tabela de Preços por Tiragem */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3">
                  Tabela de Preços Unitários por Tiragem (R$/un):
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">25 und:</label>
                    <input
                      type="text"
                      value={editP25}
                      onChange={(e) => setEditP25(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">50 und:</label>
                    <input
                      type="text"
                      value={editP50}
                      onChange={(e) => setEditP50(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">100 und:</label>
                    <input
                      type="text"
                      value={editP100}
                      onChange={(e) => setEditP100(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">250 und:</label>
                    <input
                      type="text"
                      value={editP250}
                      onChange={(e) => setEditP250(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">500 und:</label>
                    <input
                      type="text"
                      value={editP500}
                      onChange={(e) => setEditP500(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">1000 und:</label>
                    <input
                      type="text"
                      value={editP1000}
                      onChange={(e) => setEditP1000(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Taxas de Serviços de Design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Taxa Criação de Arte (R$):</label>
                  <input
                    type="text"
                    value={editArtFee}
                    onChange={(e) => setEditArtFee(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Digite 0 para não cobrar.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Taxa Revisão Técnica (R$):</label>
                  <input
                    type="text"
                    value={editReviewFee}
                    onChange={(e) => setEditReviewFee(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-900 font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Digite 0 para não cobrar.</span>
                </div>
              </div>

              {/* Gestor de Bonificações / Combos de Upsell */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                      Combo Promocional / Bonificação de Upsell
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editUpsellActive}
                      onChange={(e) => setEditUpsellActive(e.target.checked)}
                      className="rounded text-[#28397a]"
                    />
                    <span>Ativar Oferta</span>
                  </label>
                </div>
                {editUpsellActive && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Texto da Oferta / Combo:</label>
                      <input
                        type="text"
                        value={editUpsellTitle}
                        onChange={(e) => setEditUpsellTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-900"
                        placeholder="Ex: Adicionar 100 Tags Couché 300g"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Valor do Combo (R$):</label>
                      <input
                        type="text"
                        value={editUpsellPrice}
                        onChange={(e) => setEditUpsellPrice(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-900 font-bold"
                        placeholder="89.00 (ou 0 para grátis)"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#28397a] hover:bg-blue-900 text-white text-xs font-black rounded-xl flex items-center gap-2"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Novo Produto */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Cadastrar Novo Produto B2B</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Título do Produto:</label>
                  <input
                    type="text"
                    placeholder="Ex: Sacola Média E3"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Dimensões:</label>
                  <input
                    type="text"
                    placeholder="Ex: 18 x 24 x 8 cm"
                    value={newDimensions}
                    onChange={(e) => setNewDimensions(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Tabela de Preços por Tiragem */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3">
                  Defina os Preços Unitários por Tiragem (R$/un):
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">25 und:</label>
                    <input
                      type="text"
                      value={p25}
                      onChange={(e) => setP25(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">50 und:</label>
                    <input
                      type="text"
                      value={p50}
                      onChange={(e) => setP50(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">100 und:</label>
                    <input
                      type="text"
                      value={p100}
                      onChange={(e) => setP100(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">250 und:</label>
                    <input
                      type="text"
                      value={p250}
                      onChange={(e) => setP250(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">500 und:</label>
                    <input
                      type="text"
                      value={p500}
                      onChange={(e) => setP500(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">1000 und:</label>
                    <input
                      type="text"
                      value={p1000}
                      onChange={(e) => setP1000(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Taxas de Design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Taxa Criação de Arte (R$):</label>
                  <input
                    type="text"
                    value={newArtFee}
                    onChange={(e) => setNewArtFee(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Taxa Revisão Técnica (R$):</label>
                  <input
                    type="text"
                    value={newReviewFee}
                    onChange={(e) => setNewReviewFee(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-900 font-bold"
                  />
                </div>
              </div>

              {/* Combo de Bonificação / Upsell */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                      Combo Promocional de Upsell
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUpsellActive}
                      onChange={(e) => setNewUpsellActive(e.target.checked)}
                      className="rounded text-[#28397a]"
                    />
                    <span>Ativar Oferta</span>
                  </label>
                </div>
                {newUpsellActive && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Texto do Combo:</label>
                      <input
                        type="text"
                        value={newUpsellTitle}
                        onChange={(e) => setNewUpsellTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-900"
                        placeholder="Ex: Kit 100 Tags Personalizadas em Couché 300g"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Valor (R$):</label>
                      <input
                        type="text"
                        value={newUpsellPrice}
                        onChange={(e) => setNewUpsellPrice(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-slate-900 font-bold"
                        placeholder="89.00"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#28397a] hover:bg-blue-900 text-white text-xs font-black rounded-xl flex items-center gap-2"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{saving ? 'Gravando...' : 'Cadastrar Produto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gestão de Categorias */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Gerenciar Categorias</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Nova Categoria:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Caixas de Presente"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 text-slate-900"
                    required
                  />
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap">
                    Adicionar
                  </button>
                </div>
              </div>
            </form>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded-md">Ativa</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Confirmar Exclusão</h3>
            <p className="text-xs text-slate-500 mb-6">
              Tem certeza que deseja remover o produto <strong>{productToDelete.title}</strong> do banco de dados?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}