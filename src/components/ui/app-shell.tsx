'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/ui/sidebar'; 

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Adicionamos a rota '/atacado' na lista de páginas públicas do seu sistema
  const isPublicRoute = 
    pathname === '/' || 
    pathname.startsWith('/rastreio') || 
    pathname === '/login' ||
    pathname.startsWith('/links') ||
    pathname.startsWith('/orcamento') ||
    pathname.startsWith('/etiquetas') ||
    pathname.startsWith('/produto') ||
    pathname.startsWith('/atacado') || // <--- NOSSA NOVA REGRA DO MÓDULO B2B AQUI
    (pathname.startsWith('/blog') && !pathname.startsWith('/blog-admin'));

  if (isPublicRoute) {
    // Quando for público, renderiza apenas o conteúdo em tela cheia, sem a Sidebar
    return <div className="flex-1 w-full bg-slate-950">{children}</div>;
  }

  // Daqui para baixo é o sistema fechado (Gramame Pro)
  return (
    <div className="flex w-full min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}