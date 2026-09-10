/**
 * src/middleware.ts
 * Proteção de rotas administrativas e sincronização de sessão Supabase SSR.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as CookieOptions)
        );
      },
    },
  });

  // Validação segura do usuário/sessão no Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedAdminRoute =
    pathname.startsWith('/painel') || pathname.startsWith('/atacado/admin');
  const isLoginRoute = pathname.startsWith('/login');

  // 1. Redireciona usuários não autenticados tentando acessar áreas administrativas
  if (isProtectedAdminRoute && !user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Redireciona usuários já autenticados ao acessar a tela de login
  if (isLoginRoute && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    const destination = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/painel';
    return NextResponse.redirect(new URL(destination, request.url));
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