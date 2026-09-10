'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { B2BProduct } from '@/types/b2b';
import { supabase } from '@/lib/supabase/client';
import {
  Search,
  Edit2,
  Trash2,
  Power,
  Layers,
  PackagePlus,
  X,
  Loader2,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'c1', name: 'Sacolas', slug: 'sacolas', isActive: true },
  { id: 'c2', name: 'Caixas & Combos', slug: 'caixas', isActive: true },
  { id: 'c3', name: 'Tags & Cards', slug: 'tags', isActive: true },
  { id: 'c4', name: 'Adesivos & Lacres', slug: 'adesivos', isActive: true },
];

export default function AdminB2BPage() {
  const router = useRouter();
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
  const [newDimensions, setNewDimensions] = useState('10 x 8 x 3 cm');
  const [newImageUrl, setNewImageUrl] = useState('/assets/img-adesivos.webp');
  const [p25, setP25] = useState('4.50');
  const [p50, setP50] = useState('3.20');
  const [p100, setP100] = useState('2.40');
  const [p250, setP250] = useState('1.90');
  const [p500, setP500] = useState('1.60');
  const [p1000, setP1000] = useState('1.30');

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
            const { data: tiers } = await (supabase.from('b2b_pricing_tiers') as any)
              .select('*')
              .eq('product_id', p.id)
              .order('min_quantity', { ascending: true });

            return {
              id: p.id,
              slug: p.slug,
              title: p.title,
              category: p.category || 'sacolas',
              dimensions: p.dimensions || '',
              description: p.description || '',
              imageUrl: p.image_url || '/assets/img-adesivos.webp',
              galleryUrls: p.gallery_urls || [],
              isActive: p.is_active,
              artFee: 0,
              reviewFee: 0,
              upsellActive: p.upsell_active ?? true,
              upsellTitle: p.upsell_title || 'Kit 100 Tags Couché 300g',
              upsellPrice: Number(p.upsell_price ?? 45.0),
              pricingTiers: (tiers && tiers.length > 0)
                ? tiers.map((t: any) => ({
                    id: t.id,
                    minQuantity: t.min_quantity,
                    unitPrice: Number(t.unit_price),
                  }))
                : [],
            };
          })
        );
        setProducts(formatted);
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
    const checkAuthAndLoad = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login?redirectTo=/atacado/admin');
        return;
      }
      await loadAdminData();
    };

    checkAuthAndLoad();
  }, [router]);

  // 2. Alternar Status do Produto
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
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }
  };

  // 3. Abrir Modal de Edição
  const openEditModal = (product: B2BProduct) => {
    setProductToEdit(product);
    setEditTitle(product.title);
    setEditCategory(product.category || 'sacolas');
    setEditDimensions(product.dimensions);
    setEditImageUrl(product.imageUrl);

    const t25 = product.pricingTiers?.find((t) => t.minQuantity === 25)?.unitPrice || 4.50;
    const t50 = product.pricingTiers?.find((t) => t.minQuantity === 50)?.unitPrice || 3.20;
    const t100 = product.pricingTiers?.find((t) => t.minQuantity === 100)?.unitPrice || 2.40;
    const t250 = product.pricingTiers?.find((t) => t.minQuantity === 250)?.unitPrice || 1.90;
    const t500 = product.pricingTiers?.find((t) => t.minQuantity === 500)?.unitPrice || 1.60;
    const t1000 = product.pricingTiers?.find((t) => t.minQuantity === 1000)?.unitPrice || 1.30;

    setEditP25(t25.toString());
    setEditP50(t50.toString());
    setEditP100(t100.toString());
    setEditP250(t250.toString());
    setEditP500(t500.toString());
    setEditP1000(t1000.toString());

    setIsEditModalOpen(true);
  };

  // 4. Salvar Alterações de Edição
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productToEdit || !editTitle.trim()) return;

    setSaving(true);
    try {
      const { error: updateErr } = await (supabase.from('b2b_products') as any)
        .update({
          title: editTitle,
          slug: editTitle.toLowerCase().replace(/\s+/g, '-'),
          category: editCategory,
          dimensions: editDimensions || 'Padrão',
          image_url: editImageUrl,
        })
        .eq('id', productToEdit.id);

      if (updateErr) {
        alert(`Erro ao atualizar: ${updateErr.message}`);
      } else {
        await (supabase.from('b2b_pricing_tiers') as any)
          .delete()
          .eq('product_id', productToEdit.id);

        await (supabase.from('b2b_pricing_tiers') as any).insert([
          { product_id: productToEdit.id, min_quantity: 25, unit_price: parseFloat(editP25) || 4.50 },
          { product_id: productToEdit.id, min_quantity: 50, unit_price: parseFloat(editP50) || 3.20 },
          { product_id: productToEdit.id, min_quantity: 100, unit_price: parseFloat(editP100) || 2.40 },
          { product_id: productToEdit.id, min_quantity: 250, unit_price: parseFloat(editP250) || 1.90 },
          { product_id: productToEdit.id, min_quantity: 500, unit_price: parseFloat(editP500) || 1.60 },
          { product_id: productToEdit.id, min_quantity: 1000, unit_price: parseFloat(editP1000) || 1.30 },
        ]);

        alert('Produto e preços atualizados com sucesso!');
        await loadAdminData();
        setIsEditModalOpen(false);
        setProductToEdit(null);
      }
    } catch (err) {
      console.error('Erro ao atualizar:', err);
    } finally {
      setSaving(false);
    }
  };

  // 5. Cadastrar Novo Produto
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSaving(true);
    const newSlug = newTitle.toLowerCase().replace(/\s+/g, '-');

    try {
      const { data: inserted, error: prodErr } = await (supabase.from('b2b_products') as any)
        .insert({
          tenant_id: '00000000-0000-0000-0000-000000000000',
          title: newTitle,
          slug: newSlug,
          category: newCategory,
          dimensions: newDimensions || 'Padrão',
          image_url: newImageUrl,
          is_active: true,
        })
        .select()
        .single();

      if (prodErr) {
        alert(`Erro ao cadastrar: ${prodErr.message}`);
      } else if (inserted) {
        await (supabase.from('b2b_pricing_tiers') as any).insert([
          { product_id: inserted.id, min_quantity: 25, unit_price: parseFloat(p25) || 4.50 },
          { product_id: inserted.id, min_quantity: 50, unit_price: parseFloat(p50) || 3.20 },
          { product_id: inserted.id, min_quantity: 100, unit_price: parseFloat(p100) || 2.40 },
          { product_id: inserted.id, min_quantity: 250, unit_price: parseFloat(p250) || 1.90 },
          { product_id: inserted.id, min_quantity: 500, unit_price: parseFloat(p500) || 1.60 },
          { product_id: inserted.id, min_quantity: 1000, unit_price: parseFloat(p1000) || 1.30 },
        ]);

        alert('Produto cadastrado com sucesso!');
        await loadAdminData();
        setIsProductModalOpen(false);
        setNewTitle('');
      }
    } catch (err) {
      console.error('Erro ao cadastrar:', err);
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
        alert(`Erro: ${catErr.message}`);
      } else {
        alert('Categoria criada com sucesso!');
        await loadAdminData();
        setNewCatName('');
        setIsCategoryModalOpen(false);
      }
    } catch (err) {
      console.error('Erro ao criar categoria:', err);
    }
  };

  // 7. Excluir Produto
  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const { error } = await (supabase.from('b2b_products') as any).delete().eq('id', productToDelete.id);
      if (!error) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
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
      {/* Navegação Superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <Link
          href="/painel"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel Geral</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ambiente Autenticado</span>
          </span>
          <Link
            href="/atacado"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[#28397a] hover:text-blue-900 font-bold bg-blue-50 px-3 py-2 rounded-xl border border-blue-200 transition-all"
          >
            <span>Ver Catálogo Público B2B</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Painel Administrativo B2B</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestão simplificada de preços, tiragens (25 a 1.000 un) e produtos da Gráfica Gramame.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Layers className="w-4 h-4" />
            <span>Categorias</span>
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="bg-[#28397a] hover:bg-blue-900 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#28397a] focus:outline-none bg-white text-slate-900"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategoryFilter('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedCategoryFilter === 'todas' ? 'bg-[#28397a] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id || cat.slug}
              onClick={() => setSelectedCategoryFilter(cat.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategoryFilter === cat.slug ? 'bg-[#28397a] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 text-[#28397a] animate-spin" />
            <span className="ml-3 text-xs font-bold text-slate-700">Carregando dados...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Dimensões</th>
                  <th className="p-4">Preço 25 un</th>
                  <th className="p-4">Preço 1.000 un</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const p25Val = product.pricingTiers?.find((t) => t.minQuantity === 25)?.unitPrice || 0;
                  const p1000Val = product.pricingTiers?.find((t) => t.minQuantity === 1000)?.unitPrice || 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 p-1 shrink-0 flex items-center justify-center">
                          <img src={product.imageUrl} alt={product.title} className="max-h-full max-w-full object-contain" />
                        </div>
                        <span>{product.title}</span>
                      </td>
                      <td className="p-4 capitalize">{product.category}</td>
                      <td className="p-4">{product.dimensions}</td>
                      <td className="p-4 font-black text-slate-900">
                        {p25Val > 0 ? `R$ ${p25Val.toFixed(2)}/un` : '—'}
                      </td>
                      <td className="p-4 font-black text-[#28397a]">
                        {p1000Val > 0 ? `R$ ${p1000Val.toFixed(2)}/un` : '—'}
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
                          title="Editar Preços e Tiragens"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {isEditModalOpen && productToEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Editar Produto e Preços</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Título do Produto:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Categoria:</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 text-slate-900 font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Dimensões:</label>
                  <input
                    type="text"
                    value={editDimensions}
                    onChange={(e) => setEditDimensions(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">URL da Imagem:</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 text-slate-900"
                />
              </div>

              {/* Tabela de Preços por Tiragem */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-extrabold uppercase text-slate-800 mb-3">Preços Unitários por Tiragem (R$/un):</h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">25 un:</label>
                    <input
                      type="text"
                      value={editP25}
                      onChange={(e) => setEditP25(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">50 un:</label>
                    <input
                      type="text"
                      value={editP50}
                      onChange={(e) => setEditP50(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">100 un:</label>
                    <input
                      type="text"
                      value={editP100}
                      onChange={(e) => setEditP100(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">250 un:</label>
                    <input
                      type="text"
                      value={editP250}
                      onChange={(e) => setEditP250(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">500 un:</label>
                    <input
                      type="text"
                      value={editP500}
                      onChange={(e) => setEditP500(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">1000 un:</label>
                    <input
                      type="text"
                      value={editP1000}
                      onChange={(e) => setEditP1000(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
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

      {/* Modal de Cadastro */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Cadastrar Novo Produto B2B</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Título do Produto:</label>
                <input
                  type="text"
                  placeholder="Ex: Sacola SC1 - 10x8x3cm"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Categoria:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 text-slate-900 font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Dimensões:</label>
                  <input
                    type="text"
                    placeholder="Ex: 10 x 8 x 3 cm"
                    value={newDimensions}
                    onChange={(e) => setNewDimensions(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">URL da Imagem:</label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 text-slate-900"
                />
              </div>

              {/* Tabela de Preços */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-extrabold uppercase text-slate-800 mb-3">Preços Unitários por Tiragem (R$/un):</h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">25 un:</label>
                    <input
                      type="text"
                      value={p25}
                      onChange={(e) => setP25(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">50 un:</label>
                    <input
                      type="text"
                      value={p50}
                      onChange={(e) => setP50(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">100 un:</label>
                    <input
                      type="text"
                      value={p100}
                      onChange={(e) => setP100(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">250 un:</label>
                    <input
                      type="text"
                      value={p250}
                      onChange={(e) => setP250(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">500 un:</label>
                    <input
                      type="text"
                      value={p500}
                      onChange={(e) => setP500(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">1000 un:</label>
                    <input
                      type="text"
                      value={p1000}
                      onChange={(e) => setP1000(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-lg text-xs bg-white text-center font-bold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
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
                  <span>{saving ? 'Gravando...' : 'Cadastrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Categorias */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-900">Categorias</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4 mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nova categoria..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-slate-50 text-slate-900"
                  required
                />
                <button type="submit" className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap">
                  Adicionar
                </button>
              </div>
            </form>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((cat) => (
                <div key={cat.id || cat.slug} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded-md">Ativa</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Confirmar Exclusão</h3>
            <p className="text-xs text-slate-500 mb-6">
              Remover <strong>{productToDelete.title}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}