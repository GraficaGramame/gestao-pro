"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

// Tipagem para os produtos do banco
interface ProdutoVitrine {
  id: string;
  name: string;
  base_price: number;
  slug: string;
  theme: string;
  tag: string;
  images: string[];
  promotional_old_price: number;
}

// Função utilitária para identificar links de vídeo diretos
const isVideo = (url: string) => {
  if (!url) return false;
  return url.toLowerCase().match(/\.(mp4|webm|ogg)$/) != null;
};

export default function HomeSite() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  
  // Estado para os produtos dinâmicos do banco
  const [produtosDinamicos, setProdutosDinamicos] = useState<ProdutoVitrine[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);

  const router = useRouter();
  const whatsappNumber = "5583998474211";

  // Busca os produtos no banco ao carregar a página
  useEffect(() => {
    async function carregarCatalogo() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, base_price, slug, theme, tag, images, promotional_old_price')
          .eq('is_public', true)
          .order('name', { ascending: true })
          .limit(6); // Pega os 6 primeiros para não quebrar o layout da home

        if (error) {
          console.error("Erro ao buscar catálogo:", error);
          return;
        }

        if (data) {
          setProdutosDinamicos(data as ProdutoVitrine[]);
        }
      } catch (error) {
        console.error("Falha na requisição do catálogo:", error);
      } finally {
        setLoadingProdutos(false);
      }
    }

    carregarCatalogo();
  }, []);

  const handleTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setIsSearching(true);

    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trackingNumber.trim());
      if (isUUID) {
        router.push(`/rastreio/${trackingNumber.trim()}`);
        return;
      }

      const cleanPhone = trackingNumber.replace(/\D/g, '');
      if (cleanPhone.length < 8) {
        alert("Por favor, digite um número de WhatsApp válido ou o código do pedido.");
        setIsSearching(false);
        return;
      }

      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .like('whatsapp', `%${cleanPhone}%`)
        .limit(1)
        .maybeSingle() as { data: { id: string } | null };

      if (customerData?.id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('id')
          .eq('customer_id', customerData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle() as { data: { id: string } | null };

        if (orderData?.id) {
          router.push(`/rastreio/${orderData.id}`);
          return;
        }
      }
      alert("Nenhum pedido ativo encontrado para este número.");
    } catch (error) {
      console.error("Erro na busca:", error);
      alert("Erro ao buscar o pedido. Tente novamente mais tarde.");
    } finally {
      setIsSearching(false);
    }
  };

  // Produtos fallback (se o banco estiver vazio, mostra estes)
  const produtosEstaticos = [
    { titulo: "Adesivos em Vinil", descricao: "Impressão de alta resolução e recorte eletrônico. Ideal para rótulos e vitrines.", img: "/assets/img-adesivos.webp", msgZap: "Orçamento de Adesivos" },
    { titulo: "Cartões de Visita", descricao: "O primeiro contato importa. Opções em couchê, fosco e verniz para máxima credibilidade.", img: "/assets/img-cartoes.webp", msgZap: "Orçamento de Cartões" },
    { titulo: "Panfletos e Flyers", descricao: "Impressão em massa com velocidade. O material perfeito para ações de marketing local.", img: "/assets/img-panfletos.png", msgZap: "Orçamento de Panfletos" },
    { titulo: "Camisas e Uniformes", descricao: "Uniformes e camisas promocionais com impressão DTF, serigrafia e sublimação de última geração.", img: "/assets/img-camisas.png", msgZap: "Orçamento de Camisas e DTF" },
    { titulo: "Banners e Lonas", descricao: "Comunicação visual de impacto para fachadas. Acabamento impecável com ilhós e madeira.", img: "/assets/img-banners.png", msgZap: "Orçamento de Banners" },
    { titulo: "Canecas e Brindes", descricao: "Canecas de porcelana e brindes corporativos via sublimação com cores fiéis à sua marca.", img: "/assets/img-canecas.webp", msgZap: "Orçamento de Canecas e Brindes" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 overflow-x-hidden selection:bg-fuchsia-500 selection:text-white">
      
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
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>

      {/* Botão WhatsApp Flutuante */}
      <a href={`https://wa.me/${whatsappNumber}?text=Oi%2C%20vim%20do%20site%20e%20quero%20um%20orçamento`} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-lime-400 text-slate-950 rounded-full shadow-[0_0_30px_rgba(163,230,53,0.5)] hover:scale-110 transition-transform duration-300 group" aria-label="Falar no WhatsApp">
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
        {/* FAIXA ANIMADA INFINITA */}
        <div className="relative w-full mt-20 bg-fuchsia-600 text-white py-3 overflow-hidden flex whitespace-nowrap z-20 border-b border-fuchsia-400/30 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
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

        {/* HERO SECTION */}
        <section id="inicio" className="relative pt-20 pb-16 sm:pt-28 sm:pb-24 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-fuchsia-600/30 rounded-full blur-[120px] pointer-events-none -z-10"></div>
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] bg-cyan-500/20 rounded-full blur-[150px] pointer-events-none -z-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-lime-400/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center px-5 py-2 rounded-full bg-slate-900/50 backdrop-blur-md border border-slate-700 shadow-sm text-cyan-400 font-bold text-[10px] sm:text-[11px] uppercase tracking-widest mb-8">
              <span className="mr-2 text-lg sm:text-xl">🚀</span> Rápido, prático e sem burocracia
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter mb-6 leading-[1.05] max-w-5xl">
              Imprima sua marca com <br className="hidden sm:block" />
              <span className="relative inline-block mt-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-lime-400">Impacto e Agilidade</span>
              </span>
            </h1>
            
            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-xl text-slate-400 mb-12 font-medium leading-relaxed px-4">
              A <strong className="text-white">Gráfica Gramame</strong> entrega qualidade visual para o seu negócio vender mais. Cartões, Adesivos, Banners, DTF e Comunicação Visual na Zona Sul de João Pessoa.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 w-full sm:w-auto">
              <a
                href={`https://wa.me/${whatsappNumber}?text=Quero%20um%20orçamento%20agora`}
                className="group relative w-full sm:w-auto px-10 py-5 bg-lime-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-3 overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_rgba(163,230,53,0.4)]"
              >
                <div className="absolute inset-0 w-full h-full bg-white/30 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                <span>Fazer Orçamento pelo WhatsApp</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </a>
            </div>
          </div>
        </section>

        {/* VITRINE / SERVIÇOS (HÍBRIDO: DINÂMICO + FALLBACK) */}
        <section id="servicos" className="pt-16 pb-24 relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tighter">O que fazemos de melhor</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">Materiais impressos de altíssima qualidade desenvolvidos para dar destaque e profissionalismo ao seu negócio.</p>
            </div>

            {loadingProdutos ? (
              <div className="flex justify-center"><div className="w-12 h-12 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full animate-spin"></div></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* 1. SE TIVER PRODUTOS NO BANCO, RENDERIZA ELES COM DESIGN NEON */}
                {produtosDinamicos.length > 0 ? (
                  produtosDinamicos.map((produto) => {
                    const precoBase = Number(produto.base_price) || 0;
                    const precoAntigo = Number(produto.promotional_old_price) || precoBase;
                    
                    return (
                      <Link href={`/produto/${produto.slug}`} key={produto.id} className="group bg-slate-900/40 backdrop-blur-sm rounded-[2rem] p-4 hover:shadow-[0_0_40px_-10px_rgba(217,70,239,0.2)] transition-all duration-500 border border-slate-800 hover:border-fuchsia-500/50 flex flex-col h-full hover:-translate-y-2">
                        <div className="h-64 bg-slate-950 rounded-[1.5rem] relative overflow-hidden flex-shrink-0 mb-6 border border-slate-800/50">
                          {produto.images && produto.images.length > 0 ? (
                            isVideo(produto.images[0]) ? (
                              <video src={produto.images[0]} autoPlay loop muted playsInline className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-90 group-hover:opacity-100" />
                            ) : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={produto.images[0]} alt={produto.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-90 group-hover:opacity-100" />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-700">Sem Mídia</div>
                          )}
                        </div>
                        <div className="px-4 pb-4 flex flex-col flex-grow">
                          {produto.tag && (
                            <span className="self-start bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider mb-3">
                              {produto.tag}
                            </span>
                          )}
                          <h3 className="text-2xl font-black text-white mb-2">{produto.name}</h3>
                          {produto.theme && <p className="text-cyan-400 text-sm mb-4 font-medium uppercase tracking-wider">{produto.theme}</p>}
                          
                          <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-800/50">
                             <div className="flex flex-col">
                                {precoAntigo > precoBase && <span className="text-xs text-slate-500 line-through font-medium">R$ {precoAntigo.toFixed(2).replace('.', ',')}</span>}
                                <span className="text-xl font-black text-white tracking-tight"><span className="text-sm mr-1 text-slate-400">R$</span>{precoBase.toFixed(2).replace('.', ',')}</span>
                             </div>
                             <div className="inline-flex justify-center items-center px-4 py-2 bg-slate-950 text-lime-400 font-black rounded-lg border border-lime-400/20 group-hover:bg-lime-400 group-hover:text-slate-950 transition-all duration-300 uppercase text-[10px] tracking-widest">
                                Comprar
                             </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                ) : (
                  /* 2. SE NÃO TIVER NADA NO BANCO, USA OS ESTÁTICOS ANTIGOS */
                  produtosEstaticos.map((produto, index) => (
                    <div key={index} className="group bg-slate-900/40 backdrop-blur-sm rounded-[2rem] p-4 hover:shadow-[0_0_40px_-10px_rgba(217,70,239,0.2)] transition-all duration-500 border border-slate-800 hover:border-fuchsia-500/50 flex flex-col h-full hover:-translate-y-2">
                      <div className="h-64 bg-slate-950 rounded-[1.5rem] relative overflow-hidden flex-shrink-0 mb-6 border border-slate-800/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={produto.img} 
                          alt={produto.titulo} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out opacity-90 group-hover:opacity-100" 
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/600x400/0f172a/334155?text=${encodeURIComponent(produto.titulo)}` }}
                        />
                      </div>
                      <div className="px-4 pb-4 flex flex-col flex-grow">
                        <h3 className="text-2xl font-black text-white mb-3">{produto.titulo}</h3>
                        <p className="text-slate-400 mb-8 flex-grow leading-relaxed">{produto.descricao}</p>
                        <a 
                          href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(produto.msgZap)}`} 
                          className="w-full inline-flex justify-center items-center py-4 px-6 bg-slate-950 text-lime-400 font-black rounded-xl border border-lime-400/20 group-hover:bg-lime-400 group-hover:text-slate-950 transition-all duration-300 uppercase text-[11px] tracking-widest"
                        >
                          Fazer Orçamento
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {/* Botão Ver Catálogo Completo */}
            {produtosDinamicos.length > 0 && (
              <div className="mt-16 text-center">
                 <Link href="/produto" className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition-all">
                    Ver Catálogo Completo <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                 </Link>
              </div>
            )}
            
          </div>
        </section>

        {/* CAIXA DE RASTREIO */}
        <section id="rastreio" className="relative z-30 max-w-4xl mx-auto px-4 sm:px-6 mb-24">
          <div className="bg-slate-900/60 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(34,211,238,0.15)] p-6 sm:p-10 border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-8 animate-float">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-2xl mb-4 border border-cyan-500/20">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Acompanhe seu Pedido</h2>
              <p className="text-slate-400 text-sm">Digite seu WhatsApp com DDD para ver o status da produção em tempo real.</p>
            </div>
            
            <form onSubmit={handleTracking} className="flex-1 w-full flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Ex: 83998474211"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                disabled={isSearching}
                className="w-full px-5 py-4 bg-slate-950 border border-slate-800 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent font-mono text-lg disabled:opacity-50 transition-all placeholder:text-slate-600"
                required
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 min-w-[140px] uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
              >
                {isSearching ? 'Buscando...' : 'Rastrear'}
              </button>
            </form>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24 bg-slate-900 relative overflow-hidden m-4 sm:m-8 rounded-[3rem] border border-slate-800 shadow-[0_0_50px_rgba(217,70,239,0.1)]">
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#d946ef 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
             <div className="inline-flex items-center justify-center w-16 h-16 bg-fuchsia-600/20 text-fuchsia-500 border border-fuchsia-500/30 rounded-full mb-8 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-[1.1] tracking-tighter">Precisa de material com <span className="text-fuchsia-500">urgência?</span></h2>
            <p className="text-slate-400 text-base sm:text-xl mb-12 font-medium max-w-2xl mx-auto px-4">Nossa equipe tem capacidade para atender prazos curtos sem abrir mão da qualidade Gramame.</p>
            <a
              href={`https://wa.me/${whatsappNumber}?text=Tenho%20urgência%20num%20material`}
              className="inline-block w-full sm:w-auto px-12 py-5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.4)] transition-transform hover:scale-105 text-sm uppercase tracking-widest border border-fuchsia-400/50"
            >
              Falar direto com a Produção
            </a>
          </div>
        </section>

        {/* LOCALIZAÇÃO */}
        <section id="localizacao" className="py-32 relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1 lg:pr-12 text-center lg:text-left">
                <span className="text-cyan-400 font-black uppercase text-[11px] tracking-widest mb-4 block">Endereço Físico</span>
                <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tighter">Converse com a gente</h2>
                <p className="text-xl text-slate-400 mb-10 leading-relaxed">Nossa loja física está preparada para receber você. Veja amostras de materiais e converse com nossos especialistas para alinhar seu projeto.</p>
                
                <div className="flex items-start gap-6 justify-center lg:justify-start">
                  <div className="w-16 h-16 bg-slate-900 border border-slate-800 shadow-[0_0_20px_rgba(34,211,238,0.1)] text-cyan-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-black text-white text-2xl mb-2">Loja Matriz</h4>
                    <p className="text-slate-400 text-lg leading-relaxed">Rua do Arco, 872 – Loja B<br />Colinas do Sul, João Pessoa - PB</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 w-full">
                <div className="bg-slate-900 p-4 rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-800 h-[500px]">
                  <iframe 
                    src="https://maps.google.com/maps?q=Rua%20do%20Arco,%20872%20-%20Colinas%20do%20Sul,%20Jo%C3%A3o%20Pessoa%20-%20PB&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                    width="100%" 
                    height="100%" 
                    className="rounded-[2rem] w-full h-full invert-[90%] grayscale-[20%] contrast-125 hue-rotate-[180deg]"
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mapa Gráfica Gramame"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900">
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
                <li><a href="#inicio" className="text-slate-400 hover:text-cyan-400 transition-colors font-bold">Início</a></li>
                <li><a href="#servicos" className="text-slate-400 hover:text-cyan-400 transition-colors font-bold">Nossos Produtos</a></li>
                <li><Link href="/blog" className="text-slate-400 hover:text-cyan-400 transition-colors font-bold">Nosso Blog</Link></li>
                <li><a href="#rastreio" className="text-slate-400 hover:text-cyan-400 transition-colors font-bold">Rastrear Pedido</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-3 flex flex-col items-center md:items-start">
              <h4 className="text-white font-black text-[11px] mb-6 uppercase tracking-widest opacity-50">Contato</h4>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-lime-400 mb-4 font-bold flex items-center gap-3 transition-colors group">
                <svg className="w-5 h-5 text-slate-600 group-hover:text-lime-400 transition-colors" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
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