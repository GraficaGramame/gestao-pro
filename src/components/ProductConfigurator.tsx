'use client';

import React, { useState, useEffect } from 'react';
import { B2BProduct, PricingTier } from '@/types/b2b';
import { formatCurrency, generateWhatsAppLink } from '@/lib/utils';
import {
  UploadCloud,
  Clock,
  Truck,
  ChevronDown,
  Info,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface ProductConfiguratorProps {
  product: B2BProduct;
  whatsappNumber?: string;
}

interface CrossSellItem {
  id: string;
  title: string;
  quantityText: string;
  price: number;
  imageUrl: string;
  selected: boolean;
}

interface BundleCombo {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  image1: string;
  image2: string;
}

export function ProductConfigurator({
  product,
  whatsappNumber = '5583998474211',
}: ProductConfiguratorProps) {
  // 1. Tiragens disponíveis
  const availableTiers: PricingTier[] = product.pricingTiers && product.pricingTiers.length > 0
    ? product.pricingTiers
    : [
        { id: 't25', minQuantity: 25, unitPrice: 4.50 },
        { id: 't50', minQuantity: 50, unitPrice: 3.20 },
        { id: 't100', minQuantity: 100, unitPrice: 2.40 },
        { id: 't250', minQuantity: 250, unitPrice: 1.90 },
        { id: 't500', minQuantity: 500, unitPrice: 1.60 },
        { id: 't1000', minQuantity: 1000, unitPrice: 1.30 },
      ];

  const [selectedTier, setSelectedTier] = useState<PricingTier>(availableTiers[0]);
  const [selectedPaperColor, setSelectedPaperColor] = useState<'Branco' | 'Colorido'>('Branco');
  const [selectedHandleColor, setSelectedHandleColor] = useState<'Alça Branca' | 'Alça Preta'>('Alça Branca');
  const [lotMultiplier, setLotMultiplier] = useState<number>(1);

  // 2. Upload e Campos de Personalização da Arte
  const [hasLogoFile, setHasLogoFile] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [instagramHandle, setInstagramHandle] = useState<string>('');
  const [whatsappForArt, setWhatsappForArt] = useState<string>('');
  const [extraArtNotes, setExtraArtNotes] = useState<string>('');

  // 3. Módulo "Compre Junto" (Upsell Individual)
  const [crossSellItems, setCrossSellItems] = useState<CrossSellItem[]>([
    {
      id: 'cs1',
      title: 'Papel de Seda Personalizado com sua arte (30x37cm)',
      quantityText: '50 folhas',
      price: 65.00,
      imageUrl: '/assets/img-cartoes.webp',
      selected: false,
    },
    {
      id: 'cs2',
      title: 'Lacres Adesivos Vinil Impermeáveis (6x3cm)',
      quantityText: '100 unidades',
      price: 45.00,
      imageUrl: '/assets/img-adesivos.webp',
      selected: false,
    },
    {
      id: 'cs3',
      title: 'Adesivos Redondos Meio-Corte (4x4cm)',
      quantityText: '100 unidades',
      price: 35.00,
      imageUrl: '/assets/img-adesivos.webp',
      selected: false,
    },
    {
      id: 'cs4',
      title: 'Tags em Couché 300g com Furo (5x9cm)',
      quantityText: '100 unidades',
      price: 49.00,
      imageUrl: '/assets/img-cartoes.webp',
      selected: false,
    },
  ]);

  // 4. Módulo "Produtos que Fazem Sucesso" (Combos Prontos com Desconto)
  const bundleCombos: BundleCombo[] = [
    {
      id: 'bundle-1',
      title: 'Lacres Adesivos 6x3cm + Papel de Seda 30x37cm',
      description: '100 Lacres Adesivos Vinil + 50 Folhas de Seda Personalizadas',
      price: 98.00,
      originalPrice: 110.00,
      image1: '/assets/img-adesivos.webp',
      image2: '/assets/img-cartoes.webp',
    },
    {
      id: 'bundle-2',
      title: 'Lacres Adesivos 6x3cm + 100 Tags Couché 300g',
      description: '100 Lacres Adesivos + 100 Tags Personalizadas com furo',
      price: 84.00,
      originalPrice: 94.00,
      image1: '/assets/img-adesivos.webp',
      image2: '/assets/img-cartoes.webp',
    },
  ];

  // 5. UTM Tracking
  const [utmParams, setUtmParams] = useState<{ source?: string; campaign?: string }>({});

  useEffect(() => {
    if (availableTiers.length > 0) {
      setSelectedTier(availableTiers[0]);
    }
    setLotMultiplier(1);
  }, [product.id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setUtmParams({
        source: urlParams.get('utm_source') || undefined,
        campaign: urlParams.get('utm_campaign') || undefined,
      });
    }
  }, []);

  const toggleCrossSell = (id: string) => {
    setCrossSellItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setHasLogoFile(true);
      setFileName(e.target.files[0].name);
    }
  };

  // Cálculos de Preço
  const baseProductTotal = (selectedTier.unitPrice || 0) * (selectedTier.minQuantity || 0) * lotMultiplier;
  const crossSellTotal = crossSellItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.price, 0);

  const grandTotal = baseProductTotal + crossSellTotal;
  const pixDiscountTotal = grandTotal * 0.95; // 5% de desconto no Pix
  const installmentValue = grandTotal / 3; // 3x sem juros

  // Envio Estruturado para o WhatsApp
  const handleCheckout = (extraComboText?: string, extraComboPrice?: number) => {
    const selectedUpsells = crossSellItems
      .filter((i) => i.selected)
      .map((i) => `${i.title} (${i.quantityText}) - +${formatCurrency(i.price)}`);

    if (extraComboText && extraComboPrice) {
      selectedUpsells.push(`[COMBO ESPECIAL] ${extraComboText} (+${formatCurrency(extraComboPrice)})`);
    }

    const finalTotalValue = extraComboPrice ? grandTotal + extraComboPrice : grandTotal;

    const messagePayload = {
      productTitle: product.title,
      dimensions: product.dimensions || 'Conforme especificação',
      variantName: `Fundo: ${selectedPaperColor} | ${selectedHandleColor} (Cordão de Nylon)`,
      quantity: selectedTier.minQuantity * lotMultiplier,
      unitPrice: selectedTier.unitPrice,
      totalPrice: finalTotalValue,
      storeName: instagramHandle.trim() || 'Lojista B2B',
      neighborhood: 'Zona Sul de João Pessoa (PB)',
      selectedServices: [
        hasLogoFile ? `Arquivo anexado: ${fileName}` : 'Enviar logotipo pelo WhatsApp',
        whatsappForArt ? `WhatsApp para a arte: ${whatsappForArt}` : '',
        extraArtNotes ? `Observações da arte: ${extraArtNotes}` : '',
      ].filter(Boolean),
      upsellSelected: selectedUpsells.length > 0,
      upsellText: selectedUpsells.join(' + '),
      utmSource: utmParams.source,
      utmCampaign: utmParams.campaign,
    };

    const url = generateWhatsAppLink(messagePayload, whatsappNumber);
    window.open(url, '_blank');
  };

  return (
    <div className="relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden my-6 pb-24 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 p-6 sm:p-10">
        
        {/* ================= COLUNA ESQUERDA: FOTO, TAGS E BENEFÍCIOS ================= */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative w-full aspect-square bg-[#f8fafc] rounded-2xl border border-slate-200/80 flex items-center justify-center p-8 overflow-hidden group">
            <span className="absolute top-4 left-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-sm">
              LANÇAMENTO
            </span>
            <img
              src={product.imageUrl}
              alt={product.title}
              className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="absolute bottom-4 right-4 bg-[#fecf0a] text-[#28397a] text-xs font-black px-3.5 py-1 rounded-full shadow-sm">
              Direto da Fábrica
            </span>
          </div>

          {/* Selos de Confiança Rápidos */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <Truck className="w-4 h-4 text-[#28397a] mx-auto mb-1" />
              <p className="text-[10px] font-bold text-slate-800">Zona Sul JP</p>
              <p className="text-[9px] text-slate-500">Entrega rápida até 7km</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <Clock className="w-4 h-4 text-[#28397a] mx-auto mb-1" />
              <p className="text-[10px] font-bold text-slate-800">Prévia em 2 dias</p>
              <p className="text-[9px] text-slate-500">Aprovação via WhatsApp</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] font-bold text-slate-800">Garantia Total</p>
              <p className="text-[9px] text-slate-500">Offset Fosco 180g</p>
            </div>
          </div>
        </div>

        {/* ================= COLUNA DIREITA: ESTRUTURA IDÊNTICA À MADIE ================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Título e Bloco de Preço */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#28397a] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              Ref: B2B-{product.slug}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 leading-tight">
              {product.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Material: <strong className="text-slate-800">Offset Fosco Matte 180g</strong> • Medidas: <strong className="text-slate-800">{product.dimensions}</strong>
            </p>

            {/* Bloco de Preços e Condições */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {formatCurrency(grandTotal)}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({formatCurrency(selectedTier.unitPrice)} / unidade)
                </span>
              </div>
              <p className="text-xs text-slate-700 font-bold mt-1">
                3x de <strong className="text-slate-900">{formatCurrency(installmentValue)}</strong> sem juros no cartão
              </p>
              <p className="text-xs text-emerald-700 font-extrabold mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>5% de desconto pagando com Pix ({formatCurrency(pixDiscountTotal)})</span>
              </p>
            </div>
          </div>

          {/* 1. SELETOR DE QUANTIDADE (PÍLULAS) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
              QUANTIDADE (UN):
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {availableTiers.map((tier) => {
                const isSelected = selectedTier.minQuantity === tier.minQuantity;
                return (
                  <button
                    key={tier.id || tier.minQuantity}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`py-3 px-2 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#28397a] text-white border-[#28397a] shadow-md scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-black">{tier.minQuantity} un</div>
                    <div className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {formatCurrency(tier.unitPrice)}/un
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SELETOR DE FUNDO / PAPEL (APENAS BRANCO E COLORIDO) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
              Papel / Cor do Fundo: <span className="text-[#28397a] font-black">{selectedPaperColor}</span>
            </label>
            <div className="flex gap-2.5">
              {(['Branco', 'Colorido'] as const).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedPaperColor(color)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

          {/* 3. UPLOAD DO ARQUIVO DA ARTE */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
              Envie pelo menos 1 arquivo:
            </label>
            <div className="relative border-2 border-dashed border-slate-300 hover:border-[#28397a] bg-slate-50 hover:bg-white rounded-2xl p-5 text-center cursor-pointer transition-all">
              <input
                type="file"
                accept="image/*,.pdf,.ai,.cdr"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-7 h-7 text-[#28397a] mx-auto mb-1.5" />
              <p className="text-xs font-black text-slate-900">
                {hasLogoFile ? `Arquivo Selecionado: ${fileName}` : 'Clique aqui para anexar sua logo'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Imagem ou arte em PDF, CDR, PNG ou JPG (limite de até 50MB)
              </p>
            </div>
          </div>

          {/* 4. COR DA ALÇA (CORDÃO DE NYLON BRANCO OU PRETO - GORGURÃO EM STANDBY) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
              Cor da Alça: <span className="text-red-500 font-bold">*</span> <span className="text-[#28397a] font-black">{selectedHandleColor}</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Alça Branca', desc: 'Cordão de nylon maleável' },
                { name: 'Alça Preta', desc: 'Cordão de nylon maleável' },
              ].map((handle) => (
                <button
                  key={handle.name}
                  type="button"
                  onClick={() => setSelectedHandleColor(handle.name as any)}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedHandleColor === handle.name
                      ? 'bg-blue-50 border-[#28397a] ring-2 ring-[#28397a]/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-black text-slate-900">{handle.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{handle.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 5. CAMPOS OPCIONAIS PARA PERSONALIZAÇÃO DA ARTE */}
          <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Instagram para inserir na arte (opcional):
              </label>
              <input
                type="text"
                placeholder="@seu.instagram"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-2 focus:ring-[#28397a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                WhatsApp para inserir na arte (opcional):
              </label>
              <input
                type="text"
                placeholder="(83) 99999-9999"
                value={whatsappForArt}
                onChange={(e) => setWhatsappForArt(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-2 focus:ring-[#28397a] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Outras informações para inserir na arte (opcional):
              </label>
              <input
                type="text"
                placeholder="Site, frase personalizada, endereço físico, etc."
                value={extraArtNotes}
                onChange={(e) => setExtraArtNotes(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-2 focus:ring-[#28397a] focus:outline-none"
              />
            </div>
          </div>

          {/* 6. AVISOS DE ESPECIFICAÇÃO E APROVAÇÃO DIGITAL */}
          <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed border-l-4 border-[#28397a] bg-blue-50/40 p-4 rounded-r-2xl">
            <p className="font-semibold text-slate-800">
              • <strong>APROVAÇÃO DA ARTE:</strong> Após finalizar a compra, enviamos a prévia digital em até <strong>2 dias úteis pelo WhatsApp</strong>. Só enviamos para produção mediante sua aprovação.
            </p>
            <p className="text-[11px] text-slate-600">
              • <strong>ATENÇÃO ÀS MEDIDAS:</strong> Ao comprar este produto, confira sempre as dimensões exatas na descrição técnica para garantir que atenda aos seus itens.
            </p>
          </div>

          {/* 7. SELETOR DE LOTES E BOTÃO WHATSAPP */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center border border-slate-300 rounded-xl bg-white p-1 w-full sm:w-auto justify-between shrink-0">
              <button
                type="button"
                onClick={() => setLotMultiplier((prev) => Math.max(1, prev - 1))}
                className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer"
                title="Diminuir"
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
                title="Aumentar"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCheckout()}
              className="w-full bg-[#25d366] hover:bg-[#20bd5a] text-white font-black py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 text-base cursor-pointer active:scale-[0.99] border-0"
            >
              <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              <span>Pedir pelo WhatsApp</span>
            </button>
          </div>

          {/* ================= 8. COMPRE JUNTO (UPSELL) ================= */}
          <div className="pt-8 border-t border-slate-200">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#28397a]" />
              <span>Compre junto</span>
            </h3>

            <div className="space-y-3">
              {crossSellItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    item.selected
                      ? 'border-[#28397a] bg-blue-50/40 ring-1 ring-[#28397a]'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-200 p-1 flex items-center justify-center shrink-0">
                      <img src={item.imageUrl} alt={item.title} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h5>
                      <p className="text-[11px] text-slate-500">
                        {item.quantityText} por <strong className="text-slate-800 font-extrabold">{formatCurrency(item.price)}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCrossSell(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                      item.selected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.selected ? '✓ Adicionado' : '+ Adicionar'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ================= 9. PRODUTOS QUE FAZEM SUCESSO (COMBOS) ================= */}
          <div className="pt-8 border-t border-slate-200">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Produtos que fazem sucesso (Combos Prontos)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bundleCombos.map((combo) => (
                <div key={combo.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-3 bg-slate-50 p-2 rounded-xl">
                      <div className="w-14 h-14 bg-white rounded-lg p-1 border flex items-center justify-center">
                        <img src={combo.image1} alt="Item 1" className="max-h-full max-w-full object-contain" />
                      </div>
                      <span className="text-sm font-black text-slate-400">+</span>
                      <div className="w-14 h-14 bg-white rounded-lg p-1 border flex items-center justify-center">
                        <img src={combo.image2} alt="Item 2" className="max-h-full max-w-full object-contain" />
                      </div>
                    </div>
                    <h5 className="text-xs font-bold text-slate-900 leading-snug">{combo.title}</h5>
                    <p className="text-[11px] text-slate-500 mt-1">{combo.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 line-through block">{formatCurrency(combo.originalPrice)}</span>
                      <span className="text-sm font-black text-slate-900">{formatCurrency(combo.price)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCheckout(combo.title, combo.price)}
                      className="px-3 py-1.5 bg-[#28397a] hover:bg-blue-900 text-white text-[11px] font-black rounded-xl cursor-pointer"
                    >
                      Comprar os 2 Produtos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= 10. DESCRIÇÃO SANFONADA / ACORDEÕES ================= */}
          <div className="pt-6 border-t border-slate-200 space-y-2.5">
            <details className="group border border-slate-200 rounded-xl p-3.5 bg-white [&_summary::-webkit-details-marker]:hidden" open>
              <summary className="flex justify-between items-center font-bold text-xs text-slate-800 cursor-pointer">
                <span>DESCRIÇÃO TÉCNICA</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="text-xs text-slate-600 mt-2.5 leading-relaxed space-y-1.5">
                <p>• <strong>Papel:</strong> Papel Offset Fosco Matte 180g de alta resistência e alvura.</p>
                <p>• <strong>Tamanho:</strong> {product.dimensions}</p>
                <p>• <strong>Alça:</strong> Cordão de nylon maleável (tipo fio náutico) nas cores branca ou preta.</p>
                <p>• <strong>Prazo:</strong> 5 a 8 dias úteis para produção + prazo de entrega local.</p>
                <p>• <strong>Acabamento:</strong> Fundo reforçado, vincos industriais de alta precisão (sem laminação plástica).</p>
                <p className="text-[11px] text-slate-500 pt-1">
                  <em>Atenção:</em> Na impressão digital podem ocorrer sutis variações de tonalidade entre lotes.
                </p>
              </div>
            </details>

            <details className="group border border-slate-200 rounded-xl p-3.5 bg-white [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex justify-between items-center font-bold text-xs text-slate-800 cursor-pointer">
                <span>ENVIO DA LOGO E APROVAÇÃO DA ARTE</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Você pode anexar seu arquivo nesta tela ou enviá-lo pelo WhatsApp após confirmar seu pedido. Nossa equipe ajusta sua arte e envia a prova virtual em até 2 dias úteis para sua aprovação final.
              </p>
            </details>

            <details className="group border border-slate-200 rounded-xl p-3.5 bg-white [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex justify-between items-center font-bold text-xs text-slate-800 cursor-pointer">
                <span>ENTREGA LOCAL NA ZONA SUL DE JOÃO PESSOA</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Entrega rápida via motoboy para Colinas do Sul, Mangabeira, Bancários, Geisel, Valentina, Gramame e bairros em raio de até 7km. Você também pode retirar sem custo no balcão da fábrica (Rua do Arco, 872).
              </p>
            </details>

            <details className="group border border-slate-200 rounded-xl p-3.5 bg-white [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex justify-between items-center font-bold text-xs text-slate-800 cursor-pointer">
                <span>GARANTIA DE FABRICAÇÃO</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                Garantia total contra falhas de impressão, colagem ou corte em desacordo com o layout digital aprovado.
              </p>
            </details>
          </div>

        </div>
      </div>

      {/* ================= BARRA FLUTUANTE (STICKY CTA MOBILE) ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 px-4 flex items-center justify-between shadow-2xl lg:hidden">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Total ({selectedTier.minQuantity * lotMultiplier} un)
          </span>
          <span className="text-xl font-black text-[#28397a]">{formatCurrency(grandTotal)}</span>
        </div>
        <button
          type="button"
          onClick={() => handleCheckout()}
          className="bg-[#25d366] hover:bg-[#20bd5a] text-white font-black py-3 px-5 rounded-xl shadow-md transition-all flex items-center gap-2 text-sm cursor-pointer active:scale-95 border-0"
        >
          <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          <span>Pedir no WhatsApp</span>
        </button>
      </div>
    </div>
  );
}