import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Extract locale from pathname (e.g., /pt/admin or /en/client)
  const localeMatch = pathname.match(/^\/(pt|en)(\/.*)?$/);
  const locale = localeMatch?.[1] ?? 'pt';
  const pathWithoutLocale = localeMatch?.[2] ?? '/';

  // If not authenticated and trying to access protected route
  const isProtectedRoute =
    pathWithoutLocale.startsWith('/admin') ||
    pathWithoutLocale.startsWith('/collaborator') ||
    pathWithoutLocale.startsWith('/client');

  if (!user && isProtectedRoute) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated, check role-based access
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;

    const isAdminRoute = pathWithoutLocale.startsWith('/admin');
    const isCollabRoute = pathWithoutLocale.startsWith('/collaborator');
    const isClientRoute = pathWithoutLocale.startsWith('/client');

    const unauthorized =
      (isAdminRoute && role !== 'admin') ||
      (isCollabRoute && role !== 'collaborator') ||
      (isClientRoute && role !== 'client');

    if (unauthorized) {
      const dashboardPath = role === 'admin'
        ? `/${locale}/admin/dashboard`
        : role === 'collaborator'
        ? `/${locale}/collaborator/dashboard`
        : `/${locale}/client/dashboard`;

      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
  }

  // If authenticated and visiting login page, redirect to dashboard
  if (user && pathWithoutLocale === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    const dashboardPath = role === 'admin'
      ? `/${locale}/admin/dashboard`
      : role === 'collaborator'
      ? `/${locale}/collaborator/dashboard`
      : `/${locale}/client/dashboard`;

    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  // Apply i18n middleware
  const intlResponse = intlMiddleware(request);
  if (intlResponse) return intlResponse;

  return supabaseResponse;
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
