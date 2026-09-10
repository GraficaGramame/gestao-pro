'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  ShoppingBag,
  Share2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

// ================= TIPAGEM 100% DINÂMICA =================
export interface ProductAccordionItem {
  id: string;
  title: string;
  content: string;
}

export interface RelatedProductItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number;
  installmentsText: string;
  imageUrl: string;
  badge?: string;
}

export interface DynamicProductDetail {
  id: string;
  slug: string;
  sku: string;
  badge?: string;
  title: string;
  price: number;
  originalPrice?: number;
  installmentsText: string;
  material: string;
  dimensions: string;
  imageUrl: string;
  galleryUrls?: string[];
  accordions: ProductAccordionItem[];
  relatedProducts: RelatedProductItem[];
}

interface ProductPageProps {
  product?: DynamicProductDetail;
  onAddToCart?: (product: DynamicProductDetail, quantity: number) => void;
  onWhatsAppClick?: (product: DynamicProductDetail, quantity: number) => void;
}

export default function ProductDetailPage({
  product,
  onAddToCart,
  onWhatsAppClick,
}: ProductPageProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  // Fallback seguro caso os dados ainda estejam sendo carregados do Supabase
  if (!product) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
        Carregando produto...
      </div>
    );
  }

  const toggleAccordion = (id: string) => {
    setActiveAccordion((prev) => (prev === id ? null : id));
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      navigator.share({
        title: product.title,
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#faf8f5] text-slate-900 font-sans antialiased">
      
      {/* ================= 1. MARQUEE / FAIXA SUPERIOR ================= */}
      <div className="bg-[#e2886c] text-white py-1.5 px-4 text-center text-[10px] sm:text-xs font-black uppercase tracking-widest overflow-hidden whitespace-nowrap">
        <span>TRANSFORMANDO SONHOS EM ARTE — DO IMPRESSO AO DIGITAL • GRÁFICA GRAMAME</span>
      </div>

      {/* ================= 2. CABEÇALHO / NAVBAR ================= */}
      <header className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between border-b border-stone-200/60 bg-[#faf8f5]">
        <button
          type="button"
          aria-label="Abrir Menu"
          className="p-1 text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/atacado" className="flex flex-col items-center">
          <img
            src="/assets/logo.png"
            alt="Gráfica Gramame"
            className="h-8 w-auto object-contain"
          />
        </Link>

        <button
          type="button"
          aria-label="Sacola de Compras"
          className="p-1 text-slate-700 hover:text-slate-900 relative cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="absolute -top-1 -right-1.5 bg-[#e2886c] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            0
          </span>
        </button>
      </header>

      {/* ================= 3. BARRA DE NAVEGAÇÃO INTERNA ================= */}
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-600">
        <Link
          href="/atacado"
          className="inline-flex items-center gap-1 hover:text-[#e2886c] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>VOLTAR PARA COLEÇÃO</span>
        </Link>
        <button
          type="button"
          onClick={handleShare}
          className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
          title="Compartilhar"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* ================= 4. CORPO DO PRODUTO (CONTAINER CENTRAL) ================= */}
      <main className="max-w-md mx-auto px-4 py-4 space-y-6">
        
        {/* Foto Principal com Badge Dinâmico */}
        <div className="relative w-full aspect-square bg-[#ece6df] rounded-2xl overflow-hidden shadow-sm flex items-center justify-center p-4">
          {product.badge && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded shadow-sm">
              {product.badge}
            </span>
          )}
          <img
            src={product.imageUrl}
            alt={product.title}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Informações Principais */}
        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-black text-[#e2886c] uppercase tracking-wide leading-snug">
            {product.title}
          </h1>
          {product.sku && (
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              REF: {product.sku}
            </p>
          )}

          {/* Preço e Parcelamento */}
          <div className="pt-1">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </div>
            {product.installmentsText && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {product.installmentsText}
              </p>
            )}
          </div>
        </div>

        {/* Ficha Técnica Dinâmica */}
        <div className="border-t border-stone-200/80 pt-4 space-y-3 text-xs">
          <div>
            <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
              MATERIAL
            </span>
            <span className="font-bold text-slate-800">{product.material}</span>
          </div>
          <div>
            <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
              MEDIDAS
            </span>
            <span className="font-bold text-slate-800">{product.dimensions}</span>
          </div>
        </div>

        {/* Seletor de Quantidade [- 1 +] */}
        <div className="flex items-center justify-between border border-stone-300 rounded-lg bg-white px-3 py-2 w-full">
          <button
            type="button"
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
            aria-label="Diminuir quantidade"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-black text-sm text-slate-900">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((prev) => prev + 1)}
            className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
            aria-label="Aumentar quantidade"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Botão de Ação Principal */}
        <button
          type="button"
          onClick={() => {
            if (onAddToCart) onAddToCart(product, quantity);
            if (onWhatsAppClick) onWhatsAppClick(product, quantity);
          }}
          className="w-full bg-[#e2886c] hover:bg-[#d5775b] text-white font-extrabold py-3.5 px-6 rounded-lg uppercase tracking-wider text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] border-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>ADICIONAR À SACOLA</span>
        </button>

        {/* ================= 5. ACORDEÕES DINÂMICOS ================= */}
        <div className="border-t border-stone-200/80 pt-4 space-y-2">
          {product.accordions && product.accordions.map((acc) => {
            const isOpen = activeAccordion === acc.id;
            return (
              <div
                key={acc.id}
                className="border-b border-stone-200/60 pb-2"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(acc.id)}
                  className="w-full py-2 flex items-center justify-between text-left text-xs font-black text-slate-800 uppercase tracking-wider cursor-pointer"
                >
                  <span>{acc.title}</span>
                  <span className="text-base font-light text-slate-400">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <div className="py-2 text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {acc.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ================= 6. VOCÊ TAMBÉM PODE GOSTAR ================= */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <section className="pt-10 border-t border-stone-200/80">
            <h2 className="text-center text-sm sm:text-base font-black text-slate-800 uppercase tracking-widest mb-6">
              VOCÊ TAMBÉM PODE GOSTAR
            </h2>

            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                {product.relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    className="bg-white border border-stone-200 rounded-xl p-3 flex flex-col justify-between"
                  >
                    <div className="aspect-square bg-[#f5f2eb] rounded-lg p-2 flex items-center justify-center mb-2">
                      <img
                        src={rel.imageUrl}
                        alt={rel.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[11px] font-bold text-[#e2886c] line-clamp-2 leading-tight">
                        {rel.title}
                      </h3>
                      <div className="text-xs font-black text-slate-900">
                        R$ {rel.price.toFixed(2).replace('.', ',')}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {rel.installmentsText}
                      </p>
                    </div>

                    <Link
                      href={`/atacado/produto/${rel.slug}`}
                      className="mt-3 w-full bg-[#e2886c] hover:bg-[#d5775b] text-white text-[10px] font-black py-2 rounded text-center uppercase tracking-wider transition-all block"
                    >
                      COMPRAR
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>

      {/* ================= 7. RODAPÉ INSTITUCIONAL ================= */}
      <footer className="mt-16 bg-[#faf8f5] border-t border-stone-200 py-12 px-6 text-slate-700 text-xs">
        <div className="max-w-md mx-auto space-y-8">
          {/* Logo e Missão */}
          <div className="space-y-3 text-center sm:text-left">
            <img
              src="/assets/logo.png"
              alt="Gráfica Gramame"
              className="h-7 w-auto object-contain mx-auto sm:mx-0"
            />
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Transformando sonhos em arte do impresso ao digital. Valorizamos e apoiamos empreendedores, facilitando a quantidade mínima para o seu negócio decolar.
            </p>
          </div>

          {/* Links de Navegação */}
          <div>
            <h4 className="font-black uppercase tracking-wider text-slate-900 mb-2">
              NAVEGAÇÃO
            </h4>
            <ul className="space-y-1.5 text-slate-600 font-medium">
              <li><Link href="/" className="hover:underline">Início</Link></li>
              <li><Link href="/atacado" className="hover:underline">Lançamentos</Link></li>
              <li><Link href="/sobre" className="hover:underline">Quem Somos</Link></li>
              <li><Link href="/politica-loja" className="hover:underline">Política da Loja</Link></li>
              <li><Link href="/privacidade" className="hover:underline">Política de Privacidade</Link></li>
            </ul>
          </div>

          {/* Categorias */}
          <div>
            <h4 className="font-black uppercase tracking-wider text-slate-900 mb-2">
              CATEGORIAS
            </h4>
            <ul className="space-y-1.5 text-slate-600 font-medium uppercase text-[11px]">
              <li><a href="#embalagens" className="hover:underline">EMBALAGENS</a></li>
              <li><a href="#papelaria" className="hover:underline">PAPELARIA</a></li>
              <li><a href="#kits" className="hover:underline">KITS PROMOCIONAIS</a></li>
              <li><a href="#catalogo" className="hover:underline">CATÁLOGO/LOJA VIRTUAL</a></li>
              <li><a href="#caixas" className="hover:underline">CAIXAS</a></li>
              <li><a href="#cores" className="hover:underline">CATÁLOGO DE CORES</a></li>
            </ul>
          </div>

          {/* Atendimento */}
          <div className="space-y-2.5">
            <h4 className="font-black uppercase tracking-wider text-slate-900 mb-2">
              ATENDIMENTO
            </h4>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-[#e2886c]" />
              <span>(83) 99847-4211</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-3.5 h-3.5 text-[#e2886c]" />
              <span>contato@graficagramame.com.br</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-[#e2886c]" />
              <span>João Pessoa - PB (Enviamos para todo Brasil)</span>
            </div>
          </div>
        </div>

        {/* Direitos e CNPJ */}
        <div className="max-w-md mx-auto border-t border-stone-200 mt-8 pt-6 text-center text-[10px] text-slate-400 space-y-1">
          <p>© 2026 DESENVOLVIDO PARA GRÁFICA GRAMAME. TODOS OS DIREITOS RESERVADOS.</p>
          <p>CNPJ: 00.000.000/0001-00</p>
        </div>
      </footer>

      {/* ================= 8. BOTÃO FLUTUANTE WHATSAPP ================= */}
      <a
        href="https://wa.me/5583998474211?text=Olá!%20Gostaria%20de%20tirar%20uma%20dúvida%20sobre%20as%20embalagens"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 bg-[#25d366] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
      </a>

    </div>
  );
}