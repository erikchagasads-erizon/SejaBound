import { createClient } from '@/lib/supabase/server';
import { BriefingList } from '@/components/client/briefing-list';
import { ClipboardList } from 'lucide-react';
import { redirect } from 'next/navigation';
import type { BriefingRow } from '@/lib/supabase/types';

export const metadata = { title: 'Pedidos' };

export default async function ClientBriefingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clientUserData } = await (supabase as any)
    .from('client_users')
    .select('client_id')
    .eq('profile_id', user.id)
    .maybeSingle();

  const clientUser = clientUserData as { client_id: string } | null;

  // Cliente vê "Pedidos"/"Requests". Internamente o recurso é "briefing".
  const title = locale === 'en' ? 'My Requests' : 'Meus Pedidos';
  const subtitle = locale === 'en'
    ? 'Submit new requests and track their status'
    : 'Envie novos pedidos e acompanhe o status';

  let briefings: BriefingRow[] = [];
  if (clientUser?.client_id) {
    const { data: rawBriefings } = await supabase
      .from('briefings')
      .select('*')
      .eq('client_id', clientUser.client_id)
      .order('created_at', { ascending: false });

    briefings = (rawBriefings ?? []) as BriefingRow[];
  }

  return (
    <div className="briefings-page animate-fade-in">
      <div className="page-header">
        <div className="page-header-icon" style={{ background: 'hsl(var(--brand-accent) / 0.14)', color: 'hsl(var(--brand-accent))' }}>
          <ClipboardList size={22} />
        </div>
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{subtitle}</p>
        </div>
      </div>

      <BriefingList
        briefings={briefings}
        clientId={clientUser?.client_id ?? ''}
        userId={user.id}
      />
    </div>
  );
}
