import { createClient } from '@/lib/supabase/server';
import { Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Meu Painel' };

interface CollabDashboardTask {
  id: string;
  title: string;
  due_date: string | null;
  clients?: { name: string } | null;
  kanban_columns?: { name: string; color: string | null } | null;
}

export default async function CollaboratorDashboard({
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
  const { data: profileData } = await (supabase as any)
    .from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const profile = profileData as { full_name: string | null } | null;

  const [
    { data: rawMyTasks },
    { count: pendingApprovals },
    { data: rawRecentBriefings },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, due_date, clients(name), kanban_columns(name, color)')
      .eq('assignee_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase
      .from('deliveries')
      .select('*, tasks!inner(assignee_id)', { count: 'exact', head: true })
      .eq('tasks.assignee_id', user.id)
      .eq('status', 'pending'),
    supabase
      .from('briefings')
      .select('*, clients(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const myTasks = (rawMyTasks ?? []) as unknown as CollabDashboardTask[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentBriefings = (rawRecentBriefings ?? []) as any[];

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            Olá, <span className="gradient-text">{profile?.full_name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="page-subtitle">Aqui estão suas tarefas do dia</p>
        </div>
      </div>

      <div className="stats-grid">
        <Link href={`/${locale}/collaborator/tasks`} className="stat-card card" id="collab-stat-tasks" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: 'hsl(var(--brand-primary) / 0.12)', color: 'hsl(var(--brand-primary))' }}>
            <FileText size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{myTasks?.length ?? 0}</span>
            <span className="stat-label">Minhas Tarefas</span>
          </div>
        </Link>
        <Link href={`/${locale}/collaborator/tasks`} className="stat-card card" id="collab-stat-pending" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38,92%,50%)' }}>
            <AlertCircle size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{pendingApprovals ?? 0}</span>
            <span className="stat-label">Entregas Aguardando</span>
          </div>
        </Link>
        <Link href={`/${locale}/collaborator/briefings`} className="stat-card card" id="collab-stat-briefings" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: 'hsl(var(--brand-accent) / 0.14)', color: 'hsl(var(--brand-accent))' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-body">
            <span className="stat-value">{recentBriefings?.length ?? 0}</span>
            <span className="stat-label">Briefings Recentes</span>
          </div>
        </Link>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="card-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Minhas Tarefas</h2>
          <Link href={`/${locale}/collaborator/kanban`} className="btn-link" style={{ color: 'hsl(var(--brand-primary))', textDecoration: 'none', fontWeight: 600, fontSize: 13.5 }}>
            Ver Kanban →
          </Link>
        </div>
        <div className="task-list">
          {myTasks.length === 0 ? (
            <p className="empty-state" style={{ color: 'hsl(var(--text-muted))', padding: 20, textAlign: 'center' }}>
              Nenhuma tarefa atribuída a você.
            </p>
          ) : (
            myTasks.map((task) => (
              <Link
                key={task.id}
                href={`/${locale}/collaborator/tasks/${task.id}`}
                className="task-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'hsl(var(--bg-elevated))',
                  border: '1px solid hsl(var(--border-subtle))',
                  textDecoration: 'none',
                  color: 'inherit',
                  marginBottom: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <div className="task-col-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: task.kanban_columns?.color ?? '#6B7280', flexShrink: 0 }} />
                <div className="task-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="task-title" style={{ fontSize: 14, fontWeight: 600, color: 'hsl(var(--text-primary))' }}>{task.title}</div>
                  <span className="task-client" style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>{task.clients?.name ?? '—'}</span>
                </div>
                <div className="task-meta" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="task-col" style={{ fontSize: 12, color: 'hsl(var(--text-secondary))' }}>{task.kanban_columns?.name}</span>
                  {task.due_date && (
                    <span className="task-due" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'hsl(var(--text-muted))' }}>
                      <Clock size={11} />
                      {new Date(task.due_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
