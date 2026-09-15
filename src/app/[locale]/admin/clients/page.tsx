import { createClient } from '@/lib/supabase/server';
import { ClientsTable } from '@/components/admin/clients-table';
import { Users } from 'lucide-react';
import type { ClientRow } from '@/lib/supabase/types';

export const metadata = { title: 'Clientes | Bound Admin' };

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  const clients = (data ?? []) as ClientRow[];

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            <Users size={26} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            <span className="gradient-text">Clientes</span>
          </h1>
          <p className="page-subtitle">{clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <ClientsTable clients={clients} locale={locale} />
      </div>
    </div>
  );
}
