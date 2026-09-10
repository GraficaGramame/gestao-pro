import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Atacado B2B de Embalagens | Gráfica Gramame',
  description: 'Sacolas, Tags e Embalagens personalizadas em João Pessoa - PB.',
};

export default function AtacadoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Faixa Superior Única */}
      <div className="w-full bg-[#28397a] text-white py-2.5 px-4 text-center text-xs font-bold tracking-wide">
        🚀 ATACADO PARA LOJISTAS • Pedidos a partir de 25 unidades • Entrega na Zona Sul de João Pessoa
      </div>

      {/* Conteúdo Centralizado com Largura Ampla */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>

      {/* Rodapé Limpo */}
      <footer className="w-full border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 mt-16">
        <p className="font-bold text-slate-700">Gráfica Gramame — Rua do Arco, 872 - Colinas do Sul, João Pessoa - PB</p>
        <p className="mt-1">WhatsApp: (83) 99847-4211 • www.graficagramame.com.br</p>
      </footer>
    </div>
  );
}