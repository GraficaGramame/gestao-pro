"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

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

export default function VitrineGeralDaLoja() {
  const [produtos, setProdutos] = useState<ProdutoVitrine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const whatsappNumber = "5583998474211";

  useEffect(() => {
    async function carregarCatalogo() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, base_price, slug, theme, tag, images, promotional_old_price')
          .eq('is_public', true)
          .order('name', { ascending: true });

        if (error) {
          console.error("Erro ao buscar catálogo:", error);
          return;
        }

        if (data) {
          setProdutos(data as ProdutoVitrine[]);
        }
      } catch (error) {
        console.error("Falha na requisição do catálogo:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarCatalogo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-400 rounded-full animate-spin"></div>
      </div>
    );
  }

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
      <a href={`https://wa.me/${whatsappNumber}?text=Oi%2C%20estou%20no%20catálogo%20do%20site%20e%20quero%20uma%20ajuda`} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-lime-400 text-slate-950 rounded-full shadow-[0_0_30px_rgba(163,230,53,0.5)] hover:scale-110 transition-transform duration-300 group" aria-label="Falar no WhatsApp">
        <span className="absolute inset-0 rounded-full border-2 border-lime-400 animate-ping opacity-75 duration-1000"></span>
        <svg className="w-8 h-8 relative z-10" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      </a>

      {/* HEADER OFICIAL */}
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

        {/* CABEÇALHO DO CATÁLOGO (NEON) */}
        <div className="relative overflow-hidden pt-20 pb-16">
          <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-4">
              Catálogo <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">Gramame</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
              Personalize seu material com a melhor qualidade de impressão e recorte. Escolha o seu produto abaixo para configurar e comprar.
            </p>
          </div>
        </div>

        {/* GRADE DE PRODUTOS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
          
          {produtos.length === 0 ? (
            <div className="text-center py-24 bg-slate-900/40 backdrop-blur-sm rounded-[3rem] border border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <svg className="w-16 h-16 text-slate-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Vitrine em Construção</h2>
              <p className="text-slate-500 font-medium">Nenhum produto marcado como público no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {produtos.map((produto) => {
                const precoBase = Number(produto.base_price) || 0;
                const precoAntigo = Number(produto.promotional_old_price) || precoBase;
                const descontoPercentual = precoAntigo > precoBase ? Math.round(((precoAntigo - precoBase) / precoAntigo) * 100) : 0;

                return (
                  <Link href={`/produto/${produto.slug}`} key={produto.id} className="group flex flex-col bg-slate-900/40 backdrop-blur-sm rounded-[2rem] overflow-hidden border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)] hover:border-cyan-500/50 transition-all duration-500 transform hover:-translate-y-2">
                    
                    {/* IMAGEM DO CARD */}
                    <div className="relative aspect-square bg-slate-950 overflow-hidden m-3 rounded-[1.5rem] border border-slate-800/50">
                      {descontoPercentual > 0 && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-md z-10 shadow-md">
                          -{descontoPercentual}%
                        </div>
                      )}
                      {produto.images && produto.images.length > 0 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          src={produto.images[0]} 
                          alt={produto.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700 font-black uppercase tracking-widest text-[10px]">
                          Sem Foto
                        </div>
                      )}
                    </div>

                    {/* INFO DO CARD */}
                    <div className="p-5 pt-2 flex flex-col flex-1">
                      {produto.tag && (
                        <span className="self-start bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-3">
                          {produto.tag}
                        </span>
                      )}
                      
                      <h3 className="text-xl font-black text-white leading-tight mb-1 group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {produto.name}
                      </h3>
                      
                      {produto.theme && (
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-4">
                          {produto.theme}
                        </p>
                      )}

                      <div className="mt-auto pt-4 border-t border-slate-800/50 flex flex-col gap-3">
                        <div className="flex flex-col">
                          {precoAntigo > precoBase && (
                            <span className="text-xs text-slate-500 line-through font-medium mb-0.5">
                              R$ {precoAntigo.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                          <span className="text-2xl font-black text-white tracking-tight">
                            <span className="text-xs text-slate-400 mr-1">R$</span>{precoBase.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-950 text-lime-400 font-black uppercase text-[10px] tracking-widest py-3 rounded-xl border border-lime-400/20 text-center group-hover:bg-lime-400 group-hover:text-slate-950 transition-all duration-300 shadow-[0_0_15px_rgba(163,230,53,0)] group-hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                          Configurar e Comprar
                        </div>
                      </div>
                    </div>

                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </main>

      {/* FOOTER OFICIAL */}
      <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900 mt-auto">
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
                @graficagramame
              </a>
            </div>
          </div>
          
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-600 text-xs font-mono gap-4 uppercase tracking-widest">
            <p>© {new Date().getFullYear()} Gráfica Gramame.</p>
            <p>Tecnologia por <span className="text-cyan-400 font-black">Fabio Souza</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}