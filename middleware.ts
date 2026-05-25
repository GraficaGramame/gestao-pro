/**
 * src/middleware.ts
 * Proteção cirúrgica de rotas e leitura de Cookies do Supabase.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const isPainelRoute = request.nextUrl.pathname.startsWith('/painel');
  const isLoginRoute = request.nextUrl.pathname.startsWith('/login');

  // 1. O Bouncer: Se tentar entrar no /painel sem crachá, joga pro /login
  if (isPainelRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. O Atalho: Se já estiver com o crachá e abrir a tela de /login, joga direto pro /painel
  if (isLoginRoute && session) {
    return NextResponse.redirect(new URL('/painel', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Ignora arquivos estáticos e imagens para não sobrecarregar o servidor
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};