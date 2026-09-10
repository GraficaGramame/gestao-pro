'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { B2BProduct, B2BCategoryType } from '@/types/b2b';
import { ProductConfigurator } from '@/components/b2b/ProductConfigurator';
import { supabase } from '@/lib/supabase/client';
import { Search, ShoppingBag, Tag, Sticker, ChevronDown, MessageCircle, Loader2, Package } from 'lucide-react';

const INITIAL_FALLBACK_PRODUCTS: B2BProduct[] = [
  {
    id: '1',
    slug: 'sacola-minizinha-01',
    title: 'Sacola Minizinha 01',
    category: 'sacolas',
    dimensions: '11 x 14 x 4 cm',
    description: 'Ideal para joalherias, bijuterias, relógios e pequenos mimos.',
    imageUrl: '/assets/img-adesivos.webp',
    galleryUrls: [],
    isActive: true,
    artFee: 45.90,
    reviewFee: 5.00,
    upsellActive: true,
    upsellTitle: 'Kit 100 Tags Personalizadas adesivas',
    upsellPrice: 45.00,
    variants: [
      { id: 'v1', name: 'Offset Branca', paperType: 'Offset 180g', colorType: 'Branca', handleType: 'Cordão', isActive: true },
      { id: 'v2', name: 'Offset Colorida', paperType: 'Offset 180g', colorType: 'Colorida', handleType: 'Gorgurão', isActive: true },
    ],
    pricingTiers: [
      { id: 't1', minQuantity: 25, unitPrice: 3.80 },
      { id: 't2', minQuantity: 50, unitPrice: 2.50 },
      { id: 't3', minQuantity: 100, unitPrice: 2.00 },
      { id: 't4', minQuantity: 250, unitPrice: 1.70 },
      { id: 't5', minQuantity: 500, unitPrice: 1.60 },
      { id: 't6', minQuantity: 1000, unitPrice: 1.50 },
    ],
    additionalServices: [
      { id: 's1', name: 'Criação Profissional da Arte', price: 45.90 },
      { id: 's2', name: 'Revisão Técnica do Arquivo PDF', price: 5.00 },
    ],
  },
  {
    id: '2',
    slug: 'tag-surpresa-vip',
    title: 'Tag Surpresa VIP (Lacre Premiado 3D)',
    category: 'tags',
    dimensions: '5 x 9 cm',
    description: 'Cartão interativo com raspadinha para gamificação e aumento de recompra de clientes.',
    imageUrl: '/assets/img-cartoes.webp',
    galleryUrls: [],
    isActive: true,
    artFee: 85.90,
    reviewFee: 21.90,
    upsellActive: true,
    upsellTitle: 'Kit 100 Adesivos Vinil Impermeáveis 4x4cm',
    upsellPrice: 45.00,
    variants: [
      { id: 'v3', name: 'Base Offset Prata', paperType: 'Offset 240g', colorType: 'Branca', isActive: true },
      { id: 'v4', name: 'Base Lamicote Ouro', paperType: 'Lamicote 250g', colorType: 'Lamicote Ouro', isActive: true },
    ],
    pricingTiers: [
      { id: 't7', minQuantity: 100, unitPrice: 1.29 },
      { id: 't8', minQuantity: 250, unitPrice: 1.09 },
      { id: 't9', minQuantity: 500, unitPrice: 0.89 },
    ],
    additionalServices: [
      { id: 's3', name: 'Criação Profissional da Arte', price: 85.90 },
      { id: 's4', name: 'Revisão Técnica do Arquivo PDF', price: 21.90 },
    ],
  },
  {
    id: '3',
    slug: 'adesivo-vinil-impermeavel',
    title: 'Adesivo Vinil Impermeável 4x4 cm',
    category: 'adesivos',
    dimensions: '4 x 4 cm',
    description: 'Adesivo em Vinil impermeável com meio-corte para lacres de sacolas e embalagens de delivery.',
    imageUrl: '/assets/img-adesivos.webp',
    galleryUrls: [],
    isActive: true,
    artFee: 45.90,
    reviewFee: 5.00,
    upsellActive: true,
    upsellTitle: 'Kit 50 Sacolas Minizinha',
    upsellPrice: 125.00,
    variants: [
      { id: 'v5', name: 'Vinil Brilho', paperType: 'Vinil 0.08mm', colorType: 'Transparente / Branco', isActive: true },
      { id: 'v6', name: 'Papel Glossy', paperType: 'Papel Glossy 135g', colorType: 'Brilho', isActive: true },
    ],
    pricingTiers: [
      { id: 't10', minQuantity: 100, unitPrice: 0.45 },
      { id: 't11', minQuantity: 250, unitPrice: 0.35 },
      { id: 't12', minQuantity: 500, unitPrice: 0.25 },
      { id: 't13', minQuantity: 1000, unitPrice: 0.18 },
    ],
    additionalServices: [
      { id: 's5', name: 'Criação Profissional da Arte', price: 45.90 },
      { id: 's6', name: 'Revisão Técnica do Arquivo PDF', price: 5.00 },
    ],
  },
  {
    id: '4',
    slug: 'caixa-personalizada-doces',
    title: 'Caixa para Doces e Confeitaria',
    category: 'caixas',
    dimensions: '15 x 15 x 6 cm',
    description: 'Caixa reforçada com tampa e visor para docerias, confeitarias e presentes especiais.',
    imageUrl: '/assets/img-cartoes.webp',
    galleryUrls: [],
    isActive: true,
    artFee: 85.90,
    reviewFee: 21.90,
    upsellActive: true,
    upsellTitle: 'Kit 100 Tags Couché 300g',
    upsellPrice: 45.00,
    variants: [
      { id: 'v7', name: 'Duplex 300g', paperType: 'Papel Cartão Duplex 300g', colorType: 'Branca', isActive: true },
      { id: 'v8', name: 'Kraft 280g', paperType: 'Kraft Natural 280g', colorType: 'Kraft Rústico', isActive: true },
    ],
    pricingTiers: [
      { id: 't14', minQuantity: 50, unitPrice: 4.20 },
      { id: 't15', minQuantity: 100, unitPrice: 3.50 },
      { id: 't16', minQuantity: 250, unitPrice: 2.90 },
      { id: 't17', minQuantity: 500, unitPrice: 2.50 },
    ],
    additionalServices: [
      { id: 's7', name: 'Criação Profissional da Arte', price: 85.90 },
      { id: 's8', name: 'Revisão Técnica do Arquivo PDF', price: 21.90 },
    ],
  },
];

export default function AtacadoPage() {
  const [products, setProducts] = useState<B2BProduct[]>(INITIAL_FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todas' | B2BCategoryType>('todas');
  const [selectedProduct, setSelectedProduct] = useState<B2BProduct | null>(INITIAL_FALLBACK_PRODUCTS[0]);

  const fetchProductsFromSupabase = useCallback(async () => {
    setLoading(true);
    try {
      const { data: prods, error: prodErr } = await (supabase.from('b2b_products') as any)
        .select('*')
        .eq('is_active', true);

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

            const categoryResolved: B2BCategoryType = p.category
              ? p.category
              : p.slug.includes('tag')
              ? 'tags'
              : p.slug.includes('adesivo')
              ? 'adesivos'
              : p.slug.includes('caixa')
              ? 'caixas'
              : 'sacolas';

            const artFee = p.art_fee !== null && p.art_fee !== undefined ? Number(p.art_fee) : 85.90;
            const reviewFee = p.review_fee !== null && p.review_fee !== undefined ? Number(p.review_fee) : 21.90;

            return {
              id: p.id,
              slug: p.slug,
              title: p.title,
              category: categoryResolved,
              dimensions: p.dimensions || '',
              description: p.description || '',
              imageUrl: p.image_url || '/assets/img-adesivos.webp',
              galleryUrls: p.gallery_urls || [],
              isActive: p.is_active,
              artFee: artFee,
              reviewFee: reviewFee,
              upsellActive: p.upsell_active ?? true,
              upsellTitle: p.upsell_title || 'Kit 100 Tags Personalizadas em Couché 300g',
              upsellPrice: Number(p.upsell_price ?? 89.00),
              variants: variants && variants.length > 0
                ? variants.map((v: any) => ({
                    id: v.id,
                    name: v.name,
                    paperType: v.paper_type,
                    colorType: v.color_type,
                    handleType: v.handle_type,
                    isActive: v.is_active ?? true,
                  }))
                : [
                    { id: 'v1', name: 'Offset Branca', paperType: 'Offset 180g', colorType: 'Branca', isActive: true },
                  ],
              pricingTiers: tiers && tiers.length > 0
                ? tiers.map((t: any) => ({
                    id: t.id,
                    minQuantity: Number(t.min_quantity),
                    unitPrice: Number(t.unit_price),
                  }))
                : [
                    { id: 't1', minQuantity: 50, unitPrice: 2.50 },
                  ],
              additionalServices: [
                { id: 's1', name: 'Criação Profissional da Arte', price: artFee },
                { id: 's2', name: 'Revisão Técnica do Arquivo PDF', price: reviewFee },
              ],
            };
          })
        );

        setProducts(formatted);
        if (formatted.length > 0) {
          setSelectedProduct((prev) => (prev ? formatted.find((f) => f.id === prev.id) || formatted[0] : formatted[0]));
        }
      } else {
        setProducts(INITIAL_FALLBACK_PRODUCTS);
        setSelectedProduct(INITIAL_FALLBACK_PRODUCTS[0]);
      }
    } catch (err) {
      console.error('Erro ao consultar Supabase:', err);
      setProducts(INITIAL_FALLBACK_PRODUCTS);
      setSelectedProduct(INITIAL_FALLBACK_PRODUCTS[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductsFromSupabase();
  }, [fetchProductsFromSupabase]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'todas' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive;
  });

  return (
    <div className="space-y-8 bg-[#f8fafc] min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Header Oficial B2B */}
      <header className="bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <img src="/assets/logo.png" alt="Gráfica Gramame" className="h-9 w-auto brightness-0 invert" />
          </Link>
          <span className="bg-fuchsia-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
            Atacado B2B
          </span>
        </div>
        <nav className="flex items-center gap-6 text-xs font-bold text-slate-300 uppercase tracking-widest">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Início</Link>
          <a href="#catalogo" className="hover:text-cyan-400 transition-colors">Produtos</a>
          <a href="#faq" className="hover:text-cyan-400 transition-colors">Dúvidas</a>
        </nav>
        <a
          href="https://wa.me/5583998474211?text=Olá!%20Vim%20pelo%20Atacado%20e%20quero%20um%20orçamento"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-black px-5 py-2.5 rounded-full uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Fazer Orçamento</span>
        </a>
      </header>

      {/* Faixa Animada Infinita */}
      <div className="relative w-full bg-fuchsia-600 text-white py-3 rounded-xl overflow-hidden shadow-md">
        <div className="flex whitespace-nowrap animate-infinite-scroll font-black text-xs uppercase tracking-widest gap-8">
          <span>🚀 PRODUÇÃO ÁGIL E ALTA QUALIDADE</span>
          <span>✨ FRETE GRÁTIS NA ZONA SUL ACIMA DE R$100</span>
          <span>📦 EMBALAGENS, TAGS E ADESIVOS B2B</span>
          <span>🚀 PRODUÇÃO ÁGIL E ALTA QUALIDADE</span>
          <span>✨ FRETE GRÁTIS NA ZONA SUL ACIMA DE R$100</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-slate-900 rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl overflow-hidden text-center sm:text-left">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Embalagens & Papelaria Personalizada
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Sua Marca em Embalagens de <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-lime-400">
              Alto Impacto e Agilidade
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
            Preços de atacado a partir de 25 unidades. Atendimento especializado para Joalherias, Relojoarias, Cosméticos, Confeitarias e Lojas com entrega local na Zona Sul de João Pessoa.
          </p>
        </div>
      </div>

      {/* Barra de Busca e Categorias */}
      <div id="catalogo" className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('todas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedCategory === 'todas' ? 'bg-[#28397a] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({filteredProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('sacolas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'sacolas' ? 'bg-[#28397a] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Sacolas
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('tags')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'tags' ? 'bg-[#28397a] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" /> Tags & Cards
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('adesivos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'adesivos' ? 'bg-[#28397a] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sticker className="w-4 h-4" /> Adesivos
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('caixas')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === 'caixas' ? 'bg-[#28397a] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Package className="w-4 h-4" /> Caixas
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar produto por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#28397a] focus:outline-none bg-white text-slate-900"
          />
        </div>
      </div>

      {/* Grid de Produtos */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 text-[#28397a] animate-spin" />
          <span className="ml-3 text-sm font-bold text-slate-700">Carregando catálogo do Supabase...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const lowestPrice =
              product.pricingTiers && product.pricingTiers.length > 0
                ? Math.min(...product.pricingTiers.map((t) => t.unitPrice))
                : 0;

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedProduct?.id === product.id
                    ? 'border-[#28397a] bg-blue-50/50 ring-2 ring-[#28397a]/30 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center justify-center shrink-0">
                    <img src={product.imageUrl} alt={product.title} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{product.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{product.dimensions}</p>
                    <p className="text-xs font-black text-[#28397a] mt-1.5">
                      A partir de R$ {lowestPrice.toFixed(2)}/un
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Configurador do Produto Selecionado */}
      {selectedProduct && (
        <ProductConfigurator key={selectedProduct.id} product={selectedProduct} />
      )}

      {/* FAQ Sanfonado */}
      <div id="faq" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-extrabold text-slate-900 mb-4">Perguntas Frequentes — Atacado Gráfica Gramame</h3>
        <div className="space-y-3">
          <details className="group border border-slate-200 rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex justify-between items-center font-bold text-sm text-slate-800 cursor-pointer">
              <span>Qual é a quantidade mínima para pedidos no atacado?</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              A quantidade mínima para o Kit Teste é de 25 unidades nas sacolas da linha Mini, e a partir de 50 unidades nos demais tamanhos e modelos.
            </p>
          </details>

          <details className="group border border-slate-200 rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex justify-between items-center font-bold text-sm text-slate-800 cursor-pointer">
              <span>Como funciona a entrega na Zona Sul de João Pessoa?</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              Oferecemos frete local rápido para bairros da Zona Sul (Colinas do Sul, Mangabeira, Bancários, Geisel, Valentina, Gramame) em raio de até 7km, além de retirada gratuita em nossa loja física na Rua do Arco, 872.
            </p>
          </details>

          <details className="group border border-slate-200 rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex justify-between items-center font-bold text-sm text-slate-800 cursor-pointer">
              <span>Como envio minha arte para impressão?</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
              Após configurar seu pedido e clicar no botão de WhatsApp, nossa equipe receberá as especificações e solicitará seu arquivo em PDF, CDR ou AI para revisão técnica ou iniciará a criação da arte caso o serviço tenha sido selecionado.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}