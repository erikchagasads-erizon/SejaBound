import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, preferred_lang')
        .eq('id', data.user.id)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profile = profileData as any;
      const locale = (profile?.preferred_lang as string | undefined) ?? 'pt';
      const role = profile?.role as string | undefined;

      const redirectPath =
        role === 'admin' ? `/${locale}/admin/dashboard`
        : role === 'collaborator' ? `/${locale}/collaborator/dashboard`
        : `/${locale}/client/dashboard`;

      return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/pt/login?error=auth_callback_failed', requestUrl.origin));
}
