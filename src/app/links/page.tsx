"use client";

import React from "react";
import Link from "next/link";

export default function InstagramLinks() {
  const whatsappNumber = "5583988474211";

  // Grid de Produtos 100% Horizontal (Sem divisões no meio)
  const linksProdutos = [
    {
      titulo: "Cartões de Visita",
      subtitulo: "A primeira impressão do seu negócio",
      msgZap: "Orçamento de Cartões de Visita",
      imgUrl: "https://images.unsplash.com/photo-1589025068461-269661e56911?auto=format&fit=crop&q=80&w=600",
      gradient: "from-blue-600/90 to-indigo-900/90",
    },
    {
      titulo: "Adesivos",
      subtitulo: "Recorte Especial em Vinil",
      msgZap: "Orçamento de Adesivos",
      imgUrl: "https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&q=80&w=600",
      gradient: "from-pink-500/90 to-rose-800/90",
    },
    {
      titulo: "Panfletos",
      subtitulo: "Alta Tiragem e Velocidade",
      msgZap: "Orçamento de Panfletos",
      imgUrl: "https://images.unsplash.com/photo-1621245051410-b97cda0cf72d?auto=format&fit=crop&q=80&w=600",
      gradient: "from-emerald-500/90 to-teal-900/90",
    },
    {
      titulo: "Camisas e Uniformes",
      subtitulo: "Impressão DTF Premium e Serigrafia",
      msgZap: "Orçamento de Camisas e DTF",
      imgUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600",
      gradient: "from-amber-500/90 to-orange-800/90",
    },
    {
      titulo: "Canecas",
      subtitulo: "Brindes Exclusivos",
      msgZap: "Orçamento de Canecas",
      imgUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=600",
      gradient: "from-fuchsia-500/90 to-purple-900/90",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden flex flex-col items-center justify-between p-4 sm:p-6 selection:bg-lime-500 selection:text-slate-900">
      
      {/* Background Animado Dinâmico */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-900 to-transparent"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-lime-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[8s]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-[12s]"></div>
      </div>

      {/* Container Principal */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center pt-8 pb-6 z-10">
        
        {/* Avatar e Identidade Visual */}
        <div className="relative mb-5 group cursor-pointer">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-lime-400 to-emerald-600 animate-spin-slow opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="w-28 h-28 rounded-full bg-slate-900 p-1 relative z-10 flex items-center justify-center overflow-hidden border-2 border-slate-800">
            <img 
              src="/assets/logo-redondo.svg" 
              alt="Gráfica Gramame" 
              className="w-full h-full object-contain brightness-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://placehold.co/150x150/0f172a/a3e635?text=GG";
              }}
            />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tighter mb-1 drop-shadow-md text-center">Gráfica Gramame</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 text-center flex items-center gap-2">
          <span className="w-8 h-[1px] bg-slate-700"></span>
          Zona Sul | João Pessoa
          <span className="w-8 h-[1px] bg-slate-700"></span>
        </p>

        {/* CTA Principal - Orçamento Rápido */}
        <a
          href={`https://wa.me/${whatsappNumber}?text=Oi%2C%20estou%20no%20Instagram%20e%20preciso%20de%20análise%20de%20um%20orçamento%20urgente`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4.5 bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-black rounded-2xl text-[13px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 transform shadow-[0_10px_30px_rgba(163,230,53,0.3)] hover:shadow-[0_15px_40px_rgba(163,230,53,0.5)] hover:-translate-y-1 active:scale-95 mb-10"
        >
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          Solicitar Orçamento
        </a>

        {/* Título do Catálogo Atualizado */}
        <div className="w-full text-left mb-5">
          <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">Itens Mais Vendidos</h2>
          <div className="w-12 h-1 bg-lime-400 mt-2 rounded-full"></div>
        </div>

        {/* GRID DE PRODUTOS 100% HORIZONTAL */}
        <div className="w-full flex flex-col gap-3.5 mb-12">
          {linksProdutos.map((prod, idx) => (
            <a
              key={idx}
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(prod.msgZap)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden rounded-2xl flex flex-col justify-end p-5 min-h-[135px] group transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/20 border border-slate-800/80 hover:border-white/40"
            >
              {/* Imagem de Fundo */}
              <img 
                src={prod.imgUrl} 
                alt={prod.titulo}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              
              {/* Overlay de Gradiente com Cor Vibrante */}
              <div className={`absolute inset-0 bg-gradient-to-t ${prod.gradient} opacity-85 group-hover:opacity-95 transition-opacity duration-300`}></div>
              
              {/* Conteúdo do Card */}
              <div className="relative z-10 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-white leading-tight drop-shadow-md">{prod.titulo}</h3>
                  <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-sm">
                    →
                  </span>
                </div>
                <p className="text-xs font-semibold text-white/90 leading-snug drop-shadow-sm">{prod.subtitulo}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Links Úteis Secundários */}
        <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-2.5 flex flex-col gap-2">
          <Link
            href="/#rastreio"
            className="w-full py-4 px-5 rounded-xl flex items-center justify-between text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-xl">🔍</span>
              <span className="text-xs font-black uppercase tracking-wider transition-colors">Acompanhar meu Pedido</span>
            </div>
            <span className="text-slate-600 group-hover:text-cyan-400 transition-colors font-black">→</span>
          </Link>

          <div className="w-full h-[1px] bg-slate-800/60"></div>

          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-5 rounded-xl flex items-center justify-between text-slate-300 hover:bg-slate-800 hover:text-lime-400 transition-colors group"
          >
            <div className="flex items-center gap-3.5">
              <span className="text-xl">📍</span>
              <span className="text-xs font-black uppercase tracking-wider transition-colors">Como Chegar na Loja</span>
            </div>
            <span className="text-slate-600 group-hover:text-lime-400 transition-colors font-black">→</span>
          </a>
        </div>

      </div>

      <footer className="w-full text-center py-8 text-[10px] font-mono text-slate-600 uppercase tracking-widest z-10">
        <p>© {new Date().getFullYear()} Gráfica Gramame. <br className="mb-1.5"/> Feito com <span className="text-lime-500 font-bold drop-shadow-[0_0_5px_#a3e635]">Gestão Pro</span></p>
      </footer>

    </div>
  );
}