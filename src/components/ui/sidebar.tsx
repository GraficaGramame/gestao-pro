'use client';

import Link from 'next/link';

export default function Sidebar() {
  const menuItems = [
    { name: 'Painel Geral', icon: '📊', path: '/painel' },
    { name: 'Novo Pedido', icon: '🛒', path: '/vendas' },
    { name: 'Clientes', icon: '👤', path: '/clientes' },
    { name: 'Produção', icon: '🏭', path: '/producao' },
    { name: 'Pedidos', icon: '📋', path: '/pedidos' },
    { name: 'Marketing', icon: '🎯', path: '/marketing' },
    { name: 'Blog & SEO', icon: '✍️', path: '/blog-admin' }, // O NOVO MOTOR DE AUDIÊNCIA
    { name: 'Financeiro', icon: '💰', path: '/financeiro' },
    { name: 'Custos Fixos', icon: '📉', path: '/custos' },
    { name: 'Relatórios', icon: '📈', path: '/relatorios' },
    { name: 'Produtos', icon: '📦', path: '/produtos' },
    { name: 'Configurações', icon: '⚙️', path: '/configuracoes' },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-8">
        <h2 className="text-xl font-black text-green-500 tracking-tighter uppercase">Gramame Pro</h2>
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.path}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-green-500 transition-all group font-bold text-[11px] uppercase tracking-tight"
          >
            <span className="text-lg grayscale group-hover:grayscale-0">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="p-6 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-green-600 flex items-center justify-center font-black text-slate-950">F</div>
          <div className="text-[10px]">
            <p className="font-black text-slate-100 uppercase tracking-tighter">ADMIN</p>
            <p className="text-slate-500 font-bold uppercase tracking-widest opacity-70">Gramame PB</p>
          </div>
        </div>
      </div>
    </aside>
  );
}