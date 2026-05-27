"use client";

import React from "react";
import Link from "next/link";

export default function InstagramLinks() {
  const whatsappNumber = "5583988474211";

  // Ícones e cores para os produtos (Fuchsia Neon)
  const linksProdutos = [
    {
      titulo: "Adesivos e Vinil",
      subtitulo: "Recorte Especial e Alta Qualidade",
      msgZap: "Orçamento de Adesivos",
      icone: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      )
    },
    {
      titulo: "Banners e Lonas",
      subtitulo: "Fachadas e Eventos",
      msgZap: "Orçamento de Banners",
      icone: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      titulo: "Camisas e Uniformes",
      subtitulo: "Impressão DTF e Serigrafia",
      msgZap: "Orçamento de Camisas e DTF",
      icone: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      titulo: "Canecas e Brindes",
      subtitulo: "Sublimação para sua Marca",
      msgZap: "Orçamento de Canecas e Brindes",
      icone: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative overflow-hidden flex flex-col items-center justify-between p-4 selection:bg-fuchsia-500 selection:text-white">
      
      {/* Orbes de Luz Neon de Fundo Reforçadas (Amostra Visual) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[10s]"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-fuchsia-500/15 rounded-full blur-[130px] pointer-events-none animate-pulse duration-[12s]"></div>

      {/* Container Principal Mobile-First */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center pt-10 pb-6 z-10">
        
        {/* Avatar com Logotipo e Borda Neon Verde Pulsante */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-lime-400 animate-pulse opacity-70 shadow-[0_0_20px_#a3e635]"></div>
          <div className="w-24 h-24 rounded-full border-2 border-lime-400 bg-slate-900 p-1 flex items-center justify-center overflow-hidden shadow-[0_0_25px_rgba(163,230,53,0.5)]">
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

        {/* Textos de Identificação */}
        <h1 className="text-3xl font-black text-white tracking-tighter mb-1.5 drop-shadow-[0_0_5px_#ffffff]">Gráfica Gramame</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Zona Sul | João Pessoa</p>

        {/* BOTÃO 1: ORÇAMENTO URGENTE (Fundo Sólido Lime - Neon Forte) */}
        <a
          href={`https://wa.me/${whatsappNumber}?text=Oi%2C%20estou%20no%20Instagram%20e%20preciso%20de%20análise%20de%20um%20orçamento%20urgente`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4.5 bg-lime-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 transform shadow-[0_0_40px_rgba(163,230,53,0.6)] border border-lime-300/60 mb-10 hover:shadow-[0_0_50px_#ffffff] hover:scale-[1.03] active:scale-95 group"
        >
          {/* Ícone Whats Sólido */}
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          <span className="group-hover:drop-shadow-[0_0_5px_#ffffff]">Solicitar Orçamento Urgente</span>
        </a>

        {/* Título da Seção 1 (Fuchsia) */}
        <div className="w-full flex flex-col gap-1.5 mb-2 font-mono text-[9px] uppercase tracking-widest text-fuchsia-500 font-bold text-center drop-shadow-[0_0_3px_#d946ef]">
          Produtos Campeões
        </div>

        {/* CONTAINER PRODUTOS: Fuchsia Neon Inteiro */}
        <div className="w-full flex flex-col gap-4.5 mb-10">
          {linksProdutos.map((prod, idx) => (
            <a
              key={idx}
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(prod.msgZap)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-4.5 bg-slate-900/50 backdrop-blur-md rounded-2xl border-2 border-fuchsia-600 shadow-[0_0_20px_rgba(217,70,239,0.5)] flex items-center gap-4.5 transition-all duration-300 group hover:border-white hover:shadow-[0_0_35px_rgba(255,255,255,0.7)] hover:-translate-y-1 active:scale-98"
            >
              {/* Ícone com Neon Fuchsia Sólido -> Branco no hover */}
              <div className="w-11 h-11 rounded-xl bg-fuchsia-600/15 border border-fuchsia-500 flex items-center justify-center text-fuchsia-400 shadow-[0_0_10px_#d946ef] group-hover:text-white group-hover:border-white group-hover:shadow-[0_0_15px_#ffffff] transition-all">
                {prod.icone}
              </div>
              
              {/* Textos -> Brancos no Hover */}
              <div className="flex-1 text-left">
                <h3 className="text-[15px] font-black text-white group-hover:text-white uppercase tracking-tight group-hover:drop-shadow-[0_0_3px_#ffffff] transition-colors">{prod.titulo}</h3>
                <p className="text-[11px] text-slate-400 font-medium leading-tight group-hover:text-slate-100 transition-colors">{prod.subtitulo}</p>
              </div>
              
              {/* Seta -> Branca no Hover */}
              <span className="text-fuchsia-500 group-hover:text-white transition-colors text-lg font-black group-hover:drop-shadow-[0_0_3px_#ffffff]">→</span>
            </a>
          ))}
        </div>

        {/* Título da Seção 2 (Geral) */}
        <div className="w-full flex flex-col gap-1.5 mb-2 font-mono text-[9px] uppercase tracking-widest text-slate-500 font-bold text-center">
          Utilidades & Ferramentas
        </div>

        {/* BOTÕES UTILIDADES: Outlined Neon Reativo */}
        <div className="w-full flex flex-col gap-4">
          
          {/* Link Rastreio: Ciano Neon Inteiro -> Branco no Hover */}
          <Link
            href="/#rastreio"
            className="w-full py-4.5 bg-slate-900/60 backdrop-blur-md rounded-xl border-2 border-cyan-500 text-center text-xs font-black uppercase tracking-widest text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all duration-300 flex items-center justify-center gap-2.5 group hover:border-white hover:text-white hover:shadow-[0_0_30px_#ffffff] active:scale-98"
          >
            <span className="text-cyan-500 group-hover:text-white transition-colors text-base group-hover:drop-shadow-[0_0_3px_#ffffff]">🔍</span>
            <span className="group-hover:drop-shadow-[0_0_3px_#ffffff]">Acompanhar meu Pedido (Rastreio)</span>
          </Link>

          {/* Link Localização: Lime Neon Outlined -> Branco no Hover */}
          <a
            href="https://maps.app.goo.gl/7tSbTyTbKexVSNpm9" // URL do Maps aqui futuramente
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4.5 bg-slate-900/60 backdrop-blur-md rounded-xl border-2 border-lime-500 text-center text-xs font-black uppercase tracking-widest text-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.4)] transition-all duration-300 flex items-center justify-center gap-2.5 group hover:border-white hover:text-white hover:shadow-[0_0_30px_#ffffff] active:scale-98"
          >
            <span className="text-lime-500 group-hover:text-white transition-colors text-base group-hover:drop-shadow-[0_0_3px_#ffffff]">📍</span>
            <span className="group-hover:drop-shadow-[0_0_3px_#ffffff]">Nossa Loja Física (Como Chegar)</span>
          </a>
        </div>

      </div>

      {/* FOOTER MÍNIMO */}
      <footer className="w-full text-center py-5 text-[9px] font-mono text-slate-700 uppercase tracking-widest z-10">
        <p>© {new Date().getFullYear()} Gráfica Gramame. | Tecnologia <span className="text-lime-400 font-black drop-shadow-[0_0_2px_#a3e635]">Gestão Pro</span></p>
      </footer>

    </div>
  );
}