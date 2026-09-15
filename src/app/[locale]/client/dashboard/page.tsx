import { createClient } from '@/lib/supabase/server';
import { AlertCircle, Clock, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Minha Área' };

interface ClientDashboardTask {
  id: string;
  title: string;
  kanban_columns?: { name: string; color: string | null } | null;
}

interface ClientDashboardBriefing {
  id: string;
  title: string;
  status: string;
}

interface ClientDashboardDelivery {
  id: string;
  title: string;
  status: string;
}

export default async function ClientDashboard({
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

  // Labels client-facing. Internamente o recurso segue sendo "briefing".
  const labels = locale === 'en' ? {
    statLabel: 'Requests submitted',
    sectionTitle: 'My Requests',
    empty: 'No requests submitted yet.',
    newCta: '+ New Request',
  } : {
    statLabel: 'Pedidos enviados',
    sectionTitle: 'Meus Pedidos',
    empty: 'Nenhum pedido enviado ainda.',
    newCta: '+ Novo Pedido',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const profile = profileData as { full_name: string | null } | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clientUserData } = await (supabase as any)
    .from('client_users')
    .select('client_id, clients(name)')
    .eq('profile_id', user.id)
    .maybeSingle();
  const clientUser = clientUserData as { client_id: string; clients: { name: string } | null } | null;
  const clientId = clientUser?.client_id ?? '';

  let pendingDeliveries: ClientDashboardDelivery[] = [];
  let myBriefings: ClientDashboardBriefing[] = [];
  let myTasks: ClientDashboardTask[] = [];

  if (clientId) {
    const [
      { data: rawPendingDeliveries },
      { data: rawBriefings },
      { data: rawTasks },
    ] = await Promise.all([
      supabase.from('deliveries').select('id, title, status, tasks!inner(client_id, title)').eq('tasks.client_id', clientId).eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      supabase.from('briefings').select('id, title, status').eq('client_id', clientId).order('created_at', { ascending: false }).limit(3),
      supabase.from('tasks').select('id, title, kanban_columns(name, color)').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(5),
    ]);

    pendingDeliveries = (rawPendingDeliveries ?? []) as unknown as ClientDashboardDelivery[];
    myBriefings = (rawBriefings ?? []) as unknown as ClientDashboardBriefing[];
    myTasks = (rawTasks ?? []) as unknown as ClientDashboardTask[];
  }

  const clientName = clientUser?.clients?.name ?? 'Minha Empresa';

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            Olá, <span className="gradient-text">{profile?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="page-subtitle">{clientName} — Acompanhe seus projetos</p>
        </div>
      </div>

      <div className="stats-grid">
        <Link href={`/${locale}/client/approvals`} className="stat-card card" id="client-stat-pending" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: 'hsl(var(--brand-accent) / 0.14)', color: 'hsl(var(--brand-accent))' }}>
            <AlertCircle size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{pendingDeliveries.length}</span>
            <span className="stat-label">Aguardando sua aprovação</span>
          </div>
        </Link>
        <div className="stat-card card" id="client-stat-tasks">
          <div className="stat-icon" style={{ background: 'hsl(var(--brand-primary) / 0.12)', color: 'hsl(var(--brand-primary))' }}>
            <Clock size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{myTasks.length}</span>
            <span className="stat-label">Projetos em andamento</span>
          </div>
        </div>
        <Link href={`/${locale}/client/briefings`} className="stat-card card" id="client-stat-briefings" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: 'hsl(var(--brand-secondary) / 0.14)', color: 'hsl(var(--brand-secondary))' }}>
            <ClipboardList size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{myBriefings.length}</span>
            <span className="stat-label">{labels.statLabel}</span>
          </div>
        </Link>
      </div>

      {pendingDeliveries.length > 0 && (
        <div className="card approval-alert" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: 'hsl(var(--warning)/0.08)', border: '1px solid hsl(var(--warning)/0.3)', marginBottom: 20 }}>
          <div className="alert-icon" style={{ color: 'hsl(var(--warning))' }}><AlertCircle size={22} /></div>
          <div className="alert-content" style={{ flex: 1 }}>
            <div className="alert-title" style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
              Você tem {pendingDeliveries.length} entrega{pendingDeliveries.length > 1 ? 's' : ''} aguardando aprovação
            </div>
            <div className="alert-sub" style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>Clique para revisar e aprovar ou pedir ajustes</div>
          </div>
          <Link href={`/${locale}/client/approvals`} className="btn-primary-sm" style={{ padding: '8px 16px', background: 'hsl(var(--warning))', color: 'black', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
            Ver aprovações →
          </Link>
        </div>
      )}

      <div className="grid-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h2 className="card-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Projetos Recentes</h2>
          </div>
          <div className="task-list">
            {myTasks.length === 0 ? (
              <p className="empty-state" style={{ color: 'hsl(var(--text-muted))', padding: 20, textAlign: 'center' }}>Nenhum projeto ainda.</p>
            ) : (
              myTasks.map((task) => (
                <div key={task.id} className="task-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'hsl(var(--bg-elevated))', border: '1px solid hsl(var(--border-subtle))', marginBottom: 8 }}>
                  <div className="task-col-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: task.kanban_columns?.color ?? '#6B7280', flexShrink: 0 }} />
                  <span className="task-name" style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{task.title}</span>
                  <span className="task-status-badge" style={{ fontSize: 12, color: 'hsl(var(--text-secondary))' }}>{task.kanban_columns?.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="card-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{labels.sectionTitle}</h2>
            <Link href={`/${locale}/client/briefings`} className="btn-link" style={{ color: 'hsl(var(--brand-primary))', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>
              Ver todos →
            </Link>
          </div>
          <div className="briefing-list">
            {myBriefings.length === 0 ? (
              <p className="empty-state" style={{ color: 'hsl(var(--text-muted))', padding: 20, textAlign: 'center' }}>{labels.empty}</p>
            ) : (
              myBriefings.map((b) => (
                <div key={b.id} className="briefing-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'hsl(var(--bg-elevated))', border: '1px solid hsl(var(--border-subtle))', marginBottom: 8 }}>
                  <span className="briefing-title" style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{b.title}</span>
                  <span className={`status-badge status-${b.status}`}>{b.status}</span>
                </div>
              ))
            )}
            <Link href={`/${locale}/client/briefings`} id="client-new-briefing" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border-default))', color: 'hsl(var(--text-primary))', textDecoration: 'none', fontSize: 13, fontWeight: 600, marginTop: 8 }}>
              {labels.newCta}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
