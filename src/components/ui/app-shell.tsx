'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/ui/sidebar'; 

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isPublicRoute = 
    pathname === '/' || 
    pathname.startsWith('/rastreio') || 
    pathname === '/login' ||
    pathname.startsWith('/links') ||
    pathname.startsWith('/orcamento') ||
    (pathname.startsWith('/blog') && !pathname.startsWith('/blog-admin'));

  if (isPublicRoute) {
    return <div className="flex-1 w-full bg-slate-950">{children}</div>;
  }

  return (
    <div className="flex w-full min-h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}