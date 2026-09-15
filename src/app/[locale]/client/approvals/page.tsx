import { createClient } from '@/lib/supabase/server';
import { ApprovalCards, type Delivery } from '@/components/client/approval-cards';
import { CheckSquare } from 'lucide-react';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Aprovações' };

export default async function ApprovalsPage({
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

  const { data: clientUserData } = await supabase
    .from('client_users')
    .select('client_id')
    .eq('profile_id', user.id)
    .maybeSingle();
  
  const clientUser = clientUserData as { client_id: string } | null;

  let deliveries: Delivery[] = [];
  if (clientUser?.client_id) {
    const { data: rawDeliveries } = await supabase
      .from('deliveries')
      .select(`*, tasks!inner(id, title, type, client_id), delivery_files(id, file_name, file_url, file_size, mime_type), profiles:reviewed_by(full_name)`)
      .eq('tasks.client_id', clientUser.client_id)
      .order('created_at', { ascending: false });

    deliveries = (rawDeliveries ?? []) as unknown as Delivery[];
  }


  const pending  = deliveries?.filter(d => d.status === 'pending') ?? [];
  const approved = deliveries?.filter(d => d.status === 'approved') ?? [];
  const revision = deliveries?.filter(d => d.status === 'revision_requested') ?? [];

  return (
    <div className="approvals-page animate-fade-in">
      <div className="page-header">
        <div className="page-header-icon" style={{ background: 'hsl(var(--brand-primary) / 0.12)', color: 'hsl(var(--brand-primary))' }}>
          <CheckSquare size={22} />
        </div>
        <div>
          <h1 className="page-title">Aprovações</h1>
          <p className="page-subtitle">Revise e aprove as entregas da sua equipe</p>
        </div>
      </div>

      <div className="status-summary">
        <div className="status-chip status-pending">
          <span className="chip-count">{pending.length}</span>
          <span>Aguardando</span>
        </div>
        <div className="status-chip status-approved">
          <span className="chip-count">{approved.length}</span>
          <span>Aprovados</span>
        </div>
        <div className="status-chip status-revision">
          <span className="chip-count">{revision.length}</span>
          <span>Ajustes</span>
        </div>
      </div>

      <ApprovalCards pending={pending} approved={approved} revision={revision} />
    </div>
  );
}
