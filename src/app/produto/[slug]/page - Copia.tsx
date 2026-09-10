"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface CustomField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
}

interface ProdutoDB {
  id: string;
  name: string;
  base_price: number;
  slug: string;
  description: string;
  theme: string;
  tag: string;
  images: string[];
  promotional_old_price: number;
  vitrine_custom_fields: CustomField[];
}

// Função utilitária para identificar links de vídeo diretos
const isVideo = (url: string) => {
  if (!url) return false;
  return url.toLowerCase().match(/\.(mp4|webm|ogg)$/) != null;
};

export default function PaginaDinamicaDoProduto() {
  const params = useParams();
  const slug = params?.slug as string;

  // Estados Globais do Layout
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const whatsappNumber = "5583998474211";

  // Estados do Produto
  const [produto, setProduto] = useState<ProdutoDB | null>(null);
  const [produtosRelacionados, setProdutosRelacionados] = useState<ProdutoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagemAtiva, setImagemAtiva] = useState('');

  // Estados de Compra
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [quantidade, setQuantidade] = useState(1);
  const [revisaoArte, setRevisaoArte] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      if (!slug) return;
      try {
        // CORREÇÃO: Forçando a tipagem explícita para o TypeScript não reclamar
        const { data: mainProduct, error } = await supabase
          .from('products')
          .select('*')
          .eq('slug', slug)
          .eq('is_public', true)
          .maybeSingle() as { data: ProdutoDB | null; error: any };

        if (error) {
          console.error("Erro interno do Supabase:", error);
          return;
        }

        if (mainProduct) {
          setProduto(mainProduct);
          if (mainProduct.images && mainProduct.images.length > 0) {
            setImagemAtiva(mainProduct.images[0]);
          }

          // CORREÇÃO: Forçando a tipagem explícita aqui também
          const { data: relatedProducts } = await supabase
            .from('products')
            .select('*')
            .eq('is_public', true)
            .neq('id', mainProduct.id)
            .limit(4) as { data: ProdutoDB[] | null; error: any };
            
          if (relatedProducts) {
            setProdutosRelacionados(relatedProducts);
          }
        }
      } catch (error) {
        console.error("Falha na requisição:", error);
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-black text-white mb-2">Ops! Produto não encontrado.</h1>
        <p className="text-slate-400 mb-6 font-medium">Parece que esse link não existe ou o produto saiu de linha.</p>
        <Link href="/" className="px-6 py-3 bg-fuchsia-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-fuchsia-500 transition-colors shadow-[0_0_20px_rgba(217,70,239,0.3)]">
          Voltar para a Loja
        </Link>
      </div>
    );
  }

  const precoBase = Number(produto.base_price) || 0;
  const precoAntigo = Number(produto.promotional_old_price) || precoBase;
  const descontoPercentual = precoAntigo > precoBase ? Math.round(((precoAntigo - precoBase) / precoAntigo) * 100) : 0;
  const valorTotal = (precoBase + (revisaoArte ? 5.00 : 0)) * quantidade;

  const handleInputValueChange = (fieldId: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleFazerPedido = () => {
    let missingField = false;
    const camposPreenchidosTexto: string[] = [];

    (produto.vitrine_custom_fields || []).forEach(field => {
      const valor = customValues[field.id] || '';
      if (field.required && !valor.trim()) {
        missingField = true;
      }
      if (valor.trim()) {
        camposPreenchidosTexto.push(`- ${field.label}: ${valor.trim()}`);
      }
    });

    if (missingField) {
      alert("⚠️ Ops! Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }
    
    const temaTexto = produto.theme ? ` (${produto.theme})` : '';
    const mensagem = `*NOVO PEDIDO: ${produto.name.toUpperCase()}${temaTexto}* 🚀\n\n` +
      `*1. Dados da Personalização:*\n` +
      (camposPreenchidosTexto.length > 0 ? camposPreenchidosTexto.join('\n') + '\n' : 'Sem personalização\n') +
      `- Revisão VIP (+R$ 5): ${revisaoArte ? 'Sim' : 'Não'}\n\n` +
      `*2. Resumo:*\n` +
      `- Quantidade: ${quantidade} un.\n` +
      `- *Valor Total: R$ ${valorTotal.toFixed(2).replace('.', ',')}*\n\n` +
      `Olá, Gráfica Gramame! Vim da página de ofertas e quero finalizar meu pedido.`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 overflow-x-hidden selection:bg-fuchsia-500 selection:text-white pt-20">
      
      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-infinite-scroll {
          animation: scroll 25s linear infinite;
        }
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Botão WhatsApp Flutuante */}
      <a href={`https://wa.me/${whatsappNumber}?text=Oi%2C%20estou%20na%20página%20do%20produto%20${produto.name}%20e%20tenho%20uma%20dúvida`} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-lime-400 text-slate-950 rounded-full shadow-[0_0_30px_rgba(163,230,53,0.5)] hover:scale-110 transition-transform duration-300 group" aria-label="Falar no WhatsApp">
        <span className="absolute inset-0 rounded-full border-2 border-lime-400 animate-ping opacity-75 duration-1000"></span>
        <svg className="w-8 h-8 relative z-10" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      </a>

      {/* HEADER NEON GLASSMORPHISM */}
      <header className="fixed top-0 z-40 w-full h-20 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            <div className="flex-shrink-0 hover:opacity-80 transition-opacity cursor-pointer">
              <Link href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/logo.png" alt="Gráfica Gramame" className="h-10 w-auto brightness-0 invert" />
              </Link>
            </div>

            <nav className="hidden md:flex space-x-10">
              <Link href="/#inicio" className="text-slate-300 hover:text-cyan-400 font-black uppercase text-[11px] tracking-widest transition-colors">Início</Link>
              <Link href="/#servicos" className="text-slate-300 hover:text-cyan-400 font-black uppercase text-[11px] tracking-widest transition-colors">Produtos</Link>
              <Link href="/blog" className="text-slate-300 hover:text-cyan-400 font-black uppercase text-[11px] tracking-widest transition-colors">Blog</Link>
              <Link href="/#rastreio" className="text-slate-300 hover:text-cyan-400 font-black uppercase text-[11px] tracking-widest transition-colors">Rastrear Pedido</Link>
            </nav>

            <div className="hidden md:flex">
              <a href={`https://wa.me/${whatsappNumber}?text=Quero%20um%20orçamento`} className="bg-fuchsia-600 text-white px-6 py-2.5 rounded-full font-black uppercase text-[11px] tracking-widest hover:bg-fuchsia-500 hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all transform hover:-translate-y-0.5 border border-fuchsia-400/50">
                Fazer Orçamento
              </a>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-cyan-400 p-2">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-3xl border-t border-slate-800 absolute w-full shadow-2xl">
            <div className="px-4 pt-4 pb-8 space-y-2">
              <Link href="/#inicio" onClick={() => setIsMenuOpen(false)} className="block px-4 py-4 text-sm font-black uppercase tracking-widest text-cyan-400 hover:bg-slate-800 rounded-xl">Início</Link>
              <Link href="/#servicos" onClick={() => setIsMenuOpen(false)} className="block px-4 py-4 text-sm font-black uppercase tracking-widest text-cyan-400 hover:bg-slate-800 rounded-xl">Produtos</Link>
              <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="block px-4 py-4 text-sm font-black uppercase tracking-widest text-cyan-400 hover:bg-slate-800 rounded-xl">Blog</Link>
              <Link href="/#rastreio" onClick={() => setIsMenuOpen(false)} className="block px-4 py-4 text-sm font-black uppercase tracking-widest text-cyan-400 hover:bg-slate-800 rounded-xl">Rastrear Pedido</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* FAIXA ANIMADA */}
        <div className="relative w-full bg-fuchsia-600 text-white py-3 overflow-hidden flex whitespace-nowrap z-20 border-b border-fuchsia-400/30 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-fuchsia-600 to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-fuchsia-600 to-transparent z-10"></div>
          <div className="animate-infinite-scroll flex w-[200%] cursor-default">
            <div className="w-1/2 flex justify-around items-center text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">
               <span className="opacity-70 text-cyan-300">•</span>
               <span>✨ Frete Grátis na Zona Sul para pedidos acima de R$100</span>
               <span className="opacity-70 text-cyan-300">•</span>
               <span>🚀 Produção Ágil e Alta Qualidade</span>
               <span className="opacity-70 text-cyan-300">•</span>
            </div>
            <div className="w-1/2 flex justify-around items-center text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">               
               <span className="opacity-70 text-cyan-300">•</span>
               <span>✨ Frete Grátis na Zona Sul para pedidos acima de R$100</span>
               <span className="opacity-70 text-cyan-300">•</span>
               <span>🚀 Produção Ágil e Alta Qualidade</span>
               <span className="opacity-70 text-cyan-300">•</span>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Breadcrumb Otimizado para Dark Theme */}
          <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
            <Link href="/" className="hover:text-white transition-colors">Início</Link> 
            <span className="text-slate-700">/</span> 
            <Link href="/produto" className="hover:text-white transition-colors">Catálogo</Link> 
            <span className="text-slate-700">/</span> 
            <span className="text-fuchsia-500 bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">
              {produto.theme || 'Detalhes'}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* COLUNA ESQUERDA: VIEWER SUPORTANDO VÍDEO NATIVO */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4 sticky top-28 h-fit">
              <div className="relative rounded-3xl bg-slate-900 border border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden aspect-square group">
                {descontoPercentual > 0 && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full z-10 shadow-[0_0_15px_rgba(34,211,238,0.4)] transform -rotate-2">
                    -{descontoPercentual}% OFF
                  </div>
                )}
                
                {imagemAtiva ? (
                  isVideo(imagemAtiva) ? (
                    <video 
                      src={imagemAtiva} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={imagemAtiva} alt={produto.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 font-medium text-xs tracking-widest uppercase">Sem mídia configurada</div>
                )}
              </div>
              
              {/* GALERIA DE MINIATURAS INTELIGENTE */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {(produto.images || []).map((img, index) => (
                  <button key={index} onClick={() => setImagemAtiva(img)} className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden transition-all border-2 relative ${imagemAtiva === img ? 'ring-4 ring-cyan-500/30 border-cyan-400 opacity-100' : 'border-slate-800 opacity-50 hover:opacity-100'}`}>
                    {isVideo(img) ? (
                      <>
                        <video src={img} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white opacity-85" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={img} alt={`Detalhe ${index + 1}`} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* COLUNA DIREITA: INFORMAÇÕES E FORMULÁRIO */}
            <div className="w-full lg:w-1/2 flex flex-col">
              <div className="mb-8">
                {produto.tag && (
                  <span className="inline-block bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 text-[11px] font-black px-3 py-1 rounded-md uppercase tracking-widest mb-4">
                    {produto.tag}
                  </span>
                )}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tighter">
                  {produto.name} <br/>
                  {produto.theme && <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">Tema {produto.theme}</span>}
                </h1>
                {produto.description && (
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-medium whitespace-pre-line">{produto.description}</p>
                )}
              </div>

              {/* Preço Style Neon */}
              <div className="bg-slate-900/60 backdrop-blur-sm rounded-3xl p-6 border border-slate-800 shadow-sm mb-8">
                <div className="flex items-end gap-4">
                  <span className="text-5xl font-black text-white tracking-tighter"><span className="text-2xl mr-1 text-slate-500">R$</span>{precoBase.toFixed(2).replace('.', ',')}</span>
                  {precoAntigo > precoBase && <span className="text-lg text-slate-500 line-through font-medium mb-1.5">R$ {precoAntigo.toFixed(2).replace('.', ',')}</span>}
                </div>
              </div>

              {/* RENDERIZAÇÃO DOS CAMPOS DINÂMICOS */}
              {(produto.vitrine_custom_fields && produto.vitrine_custom_fields.length > 0) && (
                <div className="mb-8 space-y-5 bg-slate-900/60 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-sm">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-slate-800 pb-4 mb-5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Dados da Personalização
                  </h3>
                  
                  {produto.vitrine_custom_fields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        {field.label} {field.required && <span className="text-fuchsia-500">*</span>}
                      </label>
                      <input 
                        type="text" 
                        value={customValues[field.id] || ''}
                        onChange={(e) => handleInputValueChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-slate-950 border border-slate-800 text-white p-4 rounded-2xl text-sm font-semibold focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10 transition-all placeholder:font-normal placeholder:text-slate-600"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Upsell Revisão VIP */}
              <div className="mb-8">
                <label className={`flex items-start gap-4 cursor-pointer p-5 rounded-3xl border-2 transition-all ${revisaoArte ? 'border-fuchsia-500 bg-fuchsia-500/10' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'}`}>
                  <input type="checkbox" checked={revisaoArte} onChange={(e) => setRevisaoArte(e.target.checked)} className="mt-1 w-5 h-5 accent-fuchsia-500 rounded cursor-pointer" />
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white">Revisão VIP pela Gramame (+R$ 5,00)</span>
                    <span className="text-xs text-slate-400 mt-1.5 font-medium">Garantimos o ajuste perfeito do nome na arte antes do recorte.</span>
                  </div>
                </label>
              </div>

              {/* CHECKOUT COM BOTÃO LIME */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center justify-between bg-slate-950 rounded-2xl w-full sm:w-40 h-16 px-2 border border-slate-800">
                    <button className="w-12 h-12 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-black text-xl transition-colors" onClick={() => setQuantidade(q => Math.max(1, q - 1))}>-</button>
                    <span className="font-black text-white text-xl">{quantidade}</span>
                    <button className="w-12 h-12 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-black text-xl transition-colors" onClick={() => setQuantidade(q => q + 1)}>+</button>
                  </div>
                  <button onClick={handleFazerPedido} className="flex-1 h-16 bg-lime-400 hover:bg-lime-300 text-slate-950 font-black uppercase text-xs tracking-widest rounded-2xl shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    Garantir Meu Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO "COMBINA COM" ADAPTADA PARA VÍDEOS */}
          {produtosRelacionados.length > 0 && (
            <div className="mt-32 pt-20 border-t border-slate-800">
              <h2 className="text-3xl font-black text-white mb-10 flex items-center gap-4 tracking-tighter">
                Combina com 
                <span className="text-[10px] font-black bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 px-3 py-1.5 rounded-md uppercase tracking-widest">Leve junto</span>
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {produtosRelacionados.map((relacionado) => (
                  <Link href={`/produto/${relacionado.slug}`} key={relacionado.id} className="group bg-slate-900/40 backdrop-blur-sm rounded-[2rem] p-3 hover:shadow-[0_0_30px_-10px_rgba(34,211,238,0.2)] transition-all duration-500 border border-slate-800 hover:border-cyan-500/50 flex flex-col h-full">
                    <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-slate-950 mb-4 border border-slate-800/50 relative">
                      {relacionado.images && relacionado.images.length > 0 ? (
                        isVideo(relacionado.images[0]) ? (
                          <video src={relacionado.images[0]} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={relacionado.images[0]} alt={relacionado.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs font-black uppercase tracking-widest">Sem Mídia</div>
                      )}
                    </div>
                    <div className="px-2 pb-2 flex flex-col flex-1">
                      <h3 className="font-black text-white leading-tight group-hover:text-cyan-400 transition-colors line-clamp-2 text-lg mb-1">{relacionado.name}</h3>
                      {relacionado.theme && <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-3">{relacionado.theme}</p>}
                      <div className="mt-auto pt-3 border-t border-slate-800/50 font-black text-xl text-white">
                        <span className="text-xs text-slate-500 mr-1">R$</span>{Number(relacionado.base_price).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER OFICIAL */}
      <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 text-center md:text-left mb-16">
            <div className="md:col-span-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="Gráfica Gramame" className="h-10 w-auto mx-auto md:mx-0 mb-8 brightness-0 invert opacity-90" />
              <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto md:mx-0">Impressão profissional, DTF, Serigrafia e Comunicação Visual com agilidade para a Zona Sul de João Pessoa.</p>
            </div>
            
            <div className="md:col-span-3 md:col-start-7 flex flex-col items-center md:items-start">
              <h4 className="text-white font-black text-[11px] mb-6 uppercase tracking-widest opacity-50">Navegação</h4>
              <ul className="space-y-4">
                <li><Link href="/#inicio" className="text-slate-400 hover:text-cyan-400 transition-colors font-bold">Início</Link></li>
                <li><Link href="/#servicos" className="text-slate-400 hover:text-cyan-400 transition-colors font-bold">Nossos Produtos</Link></li>
                <li><Link href="/blog" className="text-slate-400 hover:text-cyan-400 transition-colors font-bold">Nosso Blog</Link></li>
                <li><Link href="/#rastreio" className="text-slate-400 hover:text-cyan-400 transition-colors font-bold">Rastrear Pedido</Link></li>
              </ul>
            </div>
            
            <div className="md:col-span-3 flex flex-col items-center md:items-start">
              <h4 className="text-white font-black text-[11px] mb-6 uppercase tracking-widest opacity-50">Contato</h4>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-lime-400 mb-4 font-bold flex items-center gap-3 transition-colors group">
                <svg className="w-5 h-5 text-slate-600 group-hover:text-lime-400 transition-colors" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                (83) 99847-4211
              </a>
              <a href="https://instagram.com/graficagramame" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-fuchsia-500 font-bold flex items-center gap-3 transition-colors group">
                <svg className="w-5 h-5 text-slate-600 group-hover:text-fuchsia-500 transition-colors" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                @graficagramame
              </a>
            </div>
          </div>
          
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-600 text-xs font-mono gap-4 uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Gráfica Gramame.</p>
            <p>Tecnologia por <span className="text-cyan-400 font-black">Gestão Pro</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}