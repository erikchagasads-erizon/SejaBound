import { createClient } from '@/lib/supabase/server';
import { CollaboratorsTable } from '@/components/admin/collaborators-table';
import { UserCircle } from 'lucide-react';
import type { ProfileRow, ClientRow } from '@/lib/supabase/types';

export const metadata = { title: 'Colaboradores | Bound Admin' };

interface CollaboratorWithClients extends ProfileRow {
  clients: Pick<ClientRow, 'id' | 'name' | 'primary_color'>[];
}

export default async function CollaboratorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  // Load all collaborator profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'collaborator')
    .order('full_name', { ascending: true });

  const collaboratorProfiles = (profiles ?? []) as ProfileRow[];

  // Load all client associations for those collaborators
  const { data: links } = collaboratorProfiles.length > 0
    ? await supabase
        .from('collaborator_clients')
        .select('collaborator_id, client_id, clients(id, name, primary_color)')
        .in('collaborator_id', collaboratorProfiles.map((p: ProfileRow) => p.id))
    : { data: [] };

  // Build the extended type
  const collaborators: CollaboratorWithClients[] = collaboratorProfiles.map((profile) => {
    const profileLinks = ((links ?? []) as Array<{
      collaborator_id: string;
      client_id: string;
      clients: Pick<ClientRow, 'id' | 'name' | 'primary_color'> | null;
    }>).filter((l) => l.collaborator_id === profile.id);

    const clients = profileLinks
      .map((l) => l.clients)
      .filter(Boolean) as Pick<ClientRow, 'id' | 'name' | 'primary_color'>[];
    return { ...profile, clients };
  });

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            <UserCircle size={26} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            <span className="gradient-text">Colaboradores</span>
          </h1>
          <p className="page-subtitle">{collaborators.length} colaborador{collaborators.length !== 1 ? 'es' : ''} cadastrado{collaborators.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <CollaboratorsTable collaborators={collaborators} locale={locale} />
      </div>
    </div>
  );
}
