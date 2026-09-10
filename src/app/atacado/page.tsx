'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import {
  MessageCircle,
  Truck,
  Clock,
  ShieldCheck,
  UploadCloud,
  ChevronDown,
  Info,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  Package,
} from 'lucide-react';

interface PricingTier {
  id: string;
  minQuantity: number;
  unitPrice: number;
}

interface ProductItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  dimensions: string;
  material: string;
  imageUrl: string;
  pricingTiers: PricingTier[];
}

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: '1',
    slug: 'sacola-sc1',
    title: 'Sacola Personalizada SC1 - 10x8x3cm',
    category: 'sacolas',
    dimensions: '10 x 8 x 3 cm',
    material: 'Offset Fosco Matte 180g',
    imageUrl: '/assets/img-adesivos.webp',
    pricingTiers: [
      { id: 't25', minQuantity: 25, unitPrice: 3.39 },
      { id: 't50', minQuantity: 50, unitPrice: 2.80 },
      { id: 't100', minQuantity: 100, unitPrice: 2.20 },
      { id: 't250', minQuantity: 250, unitPrice: 1.80 },
      { id: 't500', minQuantity: 500, unitPrice: 1.50 },
      { id: 't1000', minQuantity: 1000, unitPrice: 1.30 },
    ],
  },
  {
    id: '2',
    slug: 'combo-sacola-caixa',
    title: 'Combo: 25 Sacolas PP + 25 Caixas Gaveta (50 itens)',
    category: 'combos',
    dimensions: 'Sacola 10x9x4,5cm / Caixa 7x7x2,5cm',
    material: 'Offset Fosco Matte 180g',
    imageUrl: '/assets/img-cartoes.webp',
    pricingTiers: [
      { id: 't25c', minQuantity: 25, unitPrice: 4.15 },
      { id: 't50c', minQuantity: 50, unitPrice: 3.60 },
      { id: 't100c', minQuantity: 100, unitPrice: 3.20 },
    ],
  },
  {
    id: '3',
    slug: 'tags-couche',
    title: 'Tags Personalizadas em Couché 300g com Furo',
    category: 'tags',
    dimensions: '5 x 9 cm',
    material: 'Papel Couché 300g com Verniz',
    imageUrl: '/assets/img-cartoes.webp',
    pricingTiers: [
      { id: 't100t', minQuantity: 100, unitPrice: 0.49 },
      { id: 't250t', minQuantity: 250, unitPrice: 0.35 },
      { id: 't500t', minQuantity: 500, unitPrice: 0.25 },
      { id: 't1000t', minQuantity: 1000, unitPrice: 0.19 },
    ],
  },
  {
    id: '4',
    slug: 'lacres-adesivos',
    title: 'Lacres Adesivos Vinil Impermeáveis 6x3cm',
    category: 'adesivos',
    dimensions: '6 x 3 cm',
    material: 'Vinil Adesivo Brilho com Meio-Corte',
    imageUrl: '/assets/img-adesivos.webp',
    pricingTiers: [
      { id: 't100a', minQuantity: 100, unitPrice: 0.45 },
      { id: 't250a', minQuantity: 250, unitPrice: 0.32 },
      { id: 't500a', minQuantity: 500, unitPrice: 0.22 },
      { id: 't1000a', minQuantity: 1000, unitPrice: 0.16 },
    ],
  },
];

export default function AtacadoPage() {
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(DEFAULT_PRODUCTS[0]);
  const [selectedTier, setSelectedTier] = useState<PricingTier>(DEFAULT_PRODUCTS[0].pricingTiers[0]);
  const [selectedPaperColor, setSelectedPaperColor] = useState<string>('Branco');
  const [selectedHandleColor, setSelectedHandleColor] = useState<string>('Alça Branca');
  const [lotMultiplier, setLotMultiplier] = useState<number>(1);

  // Campos de personalização
  const [hasLogo, setHasLogo] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [instagram, setInstagram] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Compre Junto (Upsell)
  const [upsellSeda, setUpsellSeda] = useState(false);
  const [upsellLacres, setUpsellLacres] = useState(false);
  const [upsellTags, setUpsellTags] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data: prods } = await (supabase.from('b2b_products') as any)
          .select('*')
          .eq('is_active', true);

        if (prods && prods.length > 0) {
          const loaded: ProductItem[] = await Promise.all(
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
                dimensions: p.dimensions || '10 x 8 x 3 cm',
                material: 'Offset Fosco Matte 180g',
                imageUrl: p.image_url || '/assets/img-adesivos.webp',
                pricingTiers:
                  tiers && tiers.length > 0
                    ? tiers.map((t: any) => ({
                        id: t.id,
                        minQuantity: Number(t.min_quantity),
                        unitPrice: Number(t.unit_price),
                      }))
                    : DEFAULT_PRODUCTS[0].pricingTiers,
              };
            })
          );
          setProducts(loaded);
          setSelectedProduct(loaded[0]);
          setSelectedTier(loaded[0].pricingTiers[0]);
        }
      } catch (e) {
        console.error('Erro ao carregar produtos:', e);
      }
    }
    loadProducts();
  }, []);

  const handleSelectProduct = (prod: ProductItem) => {
    setSelectedProduct(prod);
    setSelectedTier(prod.pricingTiers[0]);
    setLotMultiplier(1);
  };

  // Cálculos de Preço
  const basePrice = (selectedTier.unitPrice || 0) * (selectedTier.minQuantity || 0) * lotMultiplier;
  const upsellTotal =
    (upsellSeda ? 65.0 : 0) + (upsellLacres ? 45.0 : 0) + (upsellTags ? 49.0 : 0);
  const grandTotal = basePrice + upsellTotal;
  const pixDiscount = grandTotal * 0.95;
  const installment = grandTotal / 3;

  const handleWhatsAppCheckout = () => {
    const upsellList: string[] = [];
    if (upsellSeda) upsellList.push('Papel de Seda 50 un (+R$ 65,00)');
    if (upsellLacres) upsellList.push('100 Lacres Adesivos (+R$ 45,00)');
    if (upsellTags) upsellList.push('100 Tags Couché 300g (+R$ 49,00)');

    const lines = [
      `*PEDIDO ATACADO - GRÁFICA GRAMAME*`,
      `---------------------------------`,
      `*Produto:* ${selectedProduct.title}`,
      `*Medidas:* ${selectedProduct.dimensions}`,
      `*Quantidade:* ${selectedTier.minQuantity * lotMultiplier} unidades`,
      `*Cor/Fundo:* ${selectedPaperColor}`,
      `*Alça:* ${selectedHandleColor}`,
      `*Valor Total:* R$ ${grandTotal.toFixed(2)} (ou R$ ${pixDiscount.toFixed(2)} via Pix)`,
      ``,
      `*DADOS PARA A ARTE:*`,
      instagram ? `• Instagram: ${instagram}` : '',
      whatsapp ? `• WhatsApp: ${whatsapp}` : '',
      hasLogo ? `• Logo: Anexada pelo site (${fileName})` : '• Logo: Vou enviar aqui pelo WhatsApp',
      notes ? `• Observações: ${notes}` : '',
      upsellList.length > 0 ? `\n*COMPRE JUNTO:*\n• ${upsellList.join('\n• ')}` : '',
      `---------------------------------`,
      `Aguardo a prévia da arte em até 2 dias úteis para aprovação!`,
    ].filter(Boolean);

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/5583998474211?text=${message}`, '_blank');
  };

  return (
    <div className="w-full space-y-8">
      {/* ================= NAVBAR PRINCIPAL ================= */}
      <header className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/atacado">
            <img src="/assets/logo.png" alt="Gráfica Gramame" className="h-8 w-auto object-contain" />
          </Link>
          <span className="bg-[#28397a] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
            Atacado B2B
          </span>
        </div>

        <nav className="flex items-center gap-4 sm:gap-6 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <a href="#produtos" className="hover:text-[#28397a] transition-colors">Produtos</a>
          <a href="#faq" className="hover:text-[#28397a] transition-colors">Dúvidas</a>
        </nav>

        <a
          href="https://wa.me/5583998474211?text=Olá!%20Vim%20pelo%20site%20Atacado%20Gramame"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25d366] hover:bg-[#20bd5a] text-white text-xs font-black px-5 py-2.5 rounded-full uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>(83) 99847-4211</span>
        </a>
      </header>

      {/* ================= CARROSSEL DE SELEÇÃO RÁPIDA DE PRODUTO ================= */}
      <div id="produtos" className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-[#28397a]" />
            <span>Escolha o Modelo de Embalagem:</span>
          </h3>
          <span className="text-[11px] text-slate-400">Clique para configurar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {products.map((p) => {
            const isSelected = selectedProduct.id === p.id;
            const startingPrice = p.pricingTiers[0]?.unitPrice || 0;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProduct(p)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#28397a] bg-blue-50/50 ring-2 ring-[#28397a] shadow-sm'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                }`}
              >
                <div className="aspect-video w-full bg-white rounded-lg p-2 mb-2 flex items-center justify-center border border-slate-100">
                  <img src={p.imageUrl} alt={p.title} className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.title}</h4>
                  <p className="text-[10px] text-slate-500">{p.dimensions}</p>
                  <p className="text-[11px] font-black text-[#28397a] mt-1">
                    A partir de R$ {startingPrice.toFixed(2)}/un
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= TELA PRINCIPAL DO PRODUTO (PDP ESTILO MADIE) ================= */}
      <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* COLUNA ESQUERDA: FOTO GRANDE E SELOS */}
          <div className="lg:col-span-5 space-y-5">
            <div className="relative w-full aspect-square bg-[#f8fafc] rounded-2xl border border-slate-200 flex items-center justify-center p-8 overflow-hidden">
              <span className="absolute top-4 left-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md">
                LANÇAMENTO
              </span>
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Selos de Confiança */}
            <div className="grid grid-cols-3 gap-2 text-center text-slate-700">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <Truck className="w-4 h-4 text-[#28397a] mx-auto mb-1" />
                <p className="text-[10px] font-bold text-slate-900">Zona Sul JP</p>
                <p className="text-[9px] text-slate-500">Entrega até 7km</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <Clock className="w-4 h-4 text-[#28397a] mx-auto mb-1" />
                <p className="text-[10px] font-bold text-slate-900">Prévia em 2 dias</p>
                <p className="text-[9px] text-slate-500">No seu WhatsApp</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                <p className="text-[10px] font-bold text-slate-900">Garantia 100%</p>
                <p className="text-[9px] text-slate-500">Offset 180g</p>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: CONFIGURAÇÕES E FORMULÁRIO */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Título e Preço */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#28397a] bg-blue-50 px-2.5 py-1 rounded">
                Ref: B2B-{selectedProduct.slug}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                {selectedProduct.title}
              </h1>

              {/* Bloco de Preço */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900">
                    R$ {grandTotal.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    (R$ {selectedTier.unitPrice.toFixed(2)} / unidade)
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-bold mt-1">
                  Ou em até <strong>3x de R$ {installment.toFixed(2)}</strong> sem juros no cartão
                </p>
                <p className="text-xs text-emerald-700 font-black mt-0.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>R$ {pixDiscount.toFixed(2)} (5% de desconto à vista via Pix)</span>
                </p>
              </div>

              {/* Ficha Técnica Rápida */}
              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <p><strong>MATERIAL:</strong> {selectedProduct.material}</p>
                <p><strong>MEDIDAS:</strong> {selectedProduct.dimensions}</p>
              </div>
            </div>

            {/* 1. SELETOR DE QUANTIDADE (PÍLULAS) */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                QUANTIDADE (UNIDADES):
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {selectedProduct.pricingTiers.map((tier) => {
                  const isSelected = selectedTier.minQuantity === tier.minQuantity;
                  return (
                    <button
                      key={tier.id || tier.minQuantity}
                      type="button"
                      onClick={() => setSelectedTier(tier)}
                      className={`py-3 px-2 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#28397a] text-white border-[#28397a] shadow-md scale-[1.02]'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-sm font-black">{tier.minQuantity}</div>
                      <div className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        R$ {tier.unitPrice.toFixed(2)}/un
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. PAPEL / FUNDO */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                PAPEL / COR DO FUNDO: <span className="text-[#28397a]">{selectedPaperColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {['Branco', 'Colorido', 'Kraft'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedPaperColor(color)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedPaperColor === color
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. COR DA ALÇA */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                COR DA ALÇA: <span className="text-[#28397a]">{selectedHandleColor}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Alça Branca', 'Alça Preta', 'Gorgurão'].map((handle) => (
                  <button
                    key={handle}
                    type="button"
                    onClick={() => setSelectedHandleColor(handle)}
                    className={`p-2.5 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                      selectedHandleColor === handle
                        ? 'bg-blue-50 border-[#28397a] text-[#28397a] ring-2 ring-[#28397a]/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {handle}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. ANEXAR LOGO & DADOS DA ARTE */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                Personalização com a sua Logo:
              </label>

              <div className="relative border-2 border-dashed border-slate-300 hover:border-[#28397a] bg-white rounded-xl p-4 text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf,.cdr,.ai"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setHasLogo(true);
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-800">
                  {hasLogo ? `Arquivo: ${fileName}` : 'Clique para anexar sua logo (PDF, PNG, JPG)'}
                </p>
                <p className="text-[10px] text-slate-400">Ou nos envie diretamente pelo WhatsApp após o pedido</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="@Instagram para a arte (opcional)"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900"
                />
                <input
                  type="text"
                  placeholder="WhatsApp para a arte (opcional)"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900"
                />
              </div>

              <input
                type="text"
                placeholder="Outras informações / Frase / Endereço para a arte (opcional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900"
              />
            </div>

            {/* Aviso de Prazo */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                <strong>PRÉVIA EM ATÉ 2 DIAS:</strong> Enviamos o modelo digital no seu WhatsApp antes de rodar a produção. Só imprimimos com a sua aprovação.
              </p>
            </div>

            {/* 5. MULTIPLICADOR DE LOTES E BOTÃO WHATSAPP */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1 w-full sm:w-auto justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setLotMultiplier((prev) => Math.max(1, prev - 1))}
                  className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-xs font-black text-slate-900">
                  {lotMultiplier} {lotMultiplier === 1 ? 'Lote' : 'Lotes'} ({selectedTier.minQuantity * lotMultiplier} un)
                </span>
                <button
                  type="button"
                  onClick={() => setLotMultiplier((prev) => prev + 1)}
                  className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppCheckout}
                className="w-full bg-[#25d366] hover:bg-[#20bd5a] text-white font-black py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 text-base cursor-pointer active:scale-[0.99] border-0"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Pedir no WhatsApp</span>
              </button>
            </div>

            {/* 6. COMPRE JUNTO (UPSELL) */}
            <div className="pt-6 border-t border-slate-200">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#28397a]" />
                <span>Compre Junto (Aproveite o mesmo frete):</span>
              </h3>

              <div className="space-y-2">
                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${upsellSeda ? 'bg-blue-50 border-[#28397a]' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={upsellSeda}
                      onChange={(e) => setUpsellSeda(e.target.checked)}
                      className="w-4 h-4 rounded text-[#28397a]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Papel de Seda com sua Logo (50 folhas)</p>
                      <p className="text-[10px] text-slate-500">Folha 30x37cm personalizada</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-800">+R$ 65,00</span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${upsellLacres ? 'bg-blue-50 border-[#28397a]' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={upsellLacres}
                      onChange={(e) => setUpsellLacres(e.target.checked)}
                      className="w-4 h-4 rounded text-[#28397a]"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">100 Lacres Adesivos Vinil (6x3cm)</p>
                      <p className="text-[10px] text-slate-500">Impermeáveis com meio-corte</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-800">+R$ 45,00</span>
                </label>
              </div>
            </div>

            {/* 7. ACORDEÕES DE DÚVIDAS */}
            <div className="pt-6 border-t border-slate-200 space-y-2">
              <details className="group border border-slate-200 rounded-xl p-3.5 bg-white [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex justify-between items-center font-bold text-xs text-slate-800 cursor-pointer">
                  <span>DESCRIÇÃO TÉCNICA DO PRODUTO</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="text-xs text-slate-600 mt-2 space-y-1">
                  <p>• <strong>Papel:</strong> Papel Offset 180g de alta resistência e alvura.</p>
                  <p>• <strong>Dimensões:</strong> {selectedProduct.dimensions}</p>
                  <p>• <strong>Impressão:</strong> Digital sem limite de cores.</p>
                </div>
              </details>

              <details className="group border border-slate-200 rounded-xl p-3.5 bg-white [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex justify-between items-center font-bold text-xs text-slate-800 cursor-pointer">
                  <span>PRAZOS E ENTREGA EM JOÃO PESSOA (ZONA SUL)</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Produção de 5 a 8 dias úteis após aprovação da arte. Entrega por motoboy na Zona Sul (Colinas do Sul, Mangabeira, Bancários, Valentina, Geisel, Gramame) ou retirada gratuita no balcão da Rua do Arco, 872.
                </p>
              </details>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}