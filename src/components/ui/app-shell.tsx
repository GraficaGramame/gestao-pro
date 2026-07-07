'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/ui/sidebar'; 

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Adicionamos a rota '/etiquetas' na lista de páginas públicas
  const isPublicRoute = 
    pathname === '/' || 
    pathname.startsWith('/rastreio') || 
    pathname === '/login' ||
    pathname.startsWith('/links') ||
    pathname.startsWith('/orcamento') ||
    pathname.startsWith('/etiquetas') || // <--- NOSSA NOVA REGRA AQUI
    pathname.startsWith('/produto') || // <--- NOSSA NOVA REGRA DE VITRINE AQUI
    (pathname.startsWith('/blog') && !pathname.startsWith('/blog-admin'));

  if (isPublicRoute) {
    // Quando for público, renderiza apenas o conteúdo, sem a Sidebar
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