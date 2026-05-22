'use client';

import { usePathname } from 'next/navigation';
// Ajuste o import do Sidebar consoante a sua estrutura de pastas
import Sidebar from '@/components/ui/sidebar'; 

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // LÓGICA DE ROUTING INTELIGENTE
  // Se for o site (/), o rastreio, o login OU a página pública do blog (/blog e /blog/slug), 
  // MAS NÃO for o estúdio de administração do blog (/blog-admin)...
  const isPublicRoute = 
    pathname === '/' || 
    pathname.startsWith('/rastreio') || 
    pathname === '/login' ||
    (pathname.startsWith('/blog') && !pathname.startsWith('/blog-admin'));

  if (isPublicRoute) {
    return <div className="flex-1 w-full bg-slate-50">{children}</div>;
  }

  // Layout do Sistema Administrativo (CRM / Gestão Pro)
  return (
    <div className="flex w-full min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}