import { createClient } from '@/lib/supabase/server';
import { InviteCollaboratorForm } from '@/components/admin/invite-collaborator-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ClientRow } from '@/lib/supabase/types';

export const metadata = { title: 'Convidar Colaborador | Bound Admin' };

export default async function InviteCollaboratorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from('clients')
    .select('id, name, primary_color')
    .order('name', { ascending: true });

  const clients = (data ?? []) as Pick<ClientRow, 'id' | 'name' | 'primary_color'>[];

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/${locale}/admin/collaborators`} className="back-btn" aria-label="Voltar">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title" style={{ fontSize: 26 }}>Convidar <span className="gradient-text">Colaborador</span></h1>
            <p className="page-subtitle">O colaborador receberá um link de acesso por e-mail</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 600 }}>
        <InviteCollaboratorForm clients={clients} locale={locale} />
      </div>


    </div>
  );
}
