import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';
import type { ProfileRow } from '@/lib/supabase/types';

export default async function CollaboratorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/pt/login');

  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const profile = data as Pick<ProfileRow, 'role'> | null;
  if (profile?.role !== 'collaborator') redirect('/pt/login');

  return (
    <div className="app-layout">
      <Sidebar role="collaborator" />
      <div className="app-main">
        <Navbar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
