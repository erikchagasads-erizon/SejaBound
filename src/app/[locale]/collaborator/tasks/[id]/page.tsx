import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeliveryPanel } from '@/components/collaborator/delivery-panel';
import { TaskActivityTimeline } from '@/components/collaborator/task-activity-timeline';
import type { TaskRow, ClientRow, KanbanColumnRow, DeliveryRow, DeliveryFileRow, TaskActivityRow, ProfileRow } from '@/lib/supabase/types';
import type { TaskPriority, TaskType } from '@/lib/supabase/database.types';

export const metadata = { title: 'Detalhe da Tarefa | Bound' };

type DeliveryWithFiles = DeliveryRow & { delivery_files: DeliveryFileRow[] };
type ActivityWithActor = TaskActivityRow & { profiles: Pick<ProfileRow, 'full_name'> | null };

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const [
    { data: task },
    { data: deliveries },
    { data: activity },
  ] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, clients(name, primary_color), kanban_columns(name, color), profiles!tasks_assignee_id_fkey(full_name)')
      .eq('id', id)
      .single(),
    supabase
      .from('deliveries')
      .select('*, delivery_files(*)')
      .eq('task_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('task_activity')
      .select('*, profiles(full_name)')
      .eq('task_id', id)
      .order('created_at', { ascending: false }),
  ]);

  if (!task) notFound();

  const t = task as TaskRow & {
    clients: Pick<ClientRow, 'name' | 'primary_color'> | null;
    kanban_columns: Pick<KanbanColumnRow, 'name' | 'color'> | null;
    profiles: Pick<ProfileRow, 'full_name'> | null;
  };

  const deliveryList = (deliveries ?? []) as DeliveryWithFiles[];
  const activityList = (activity ?? []) as ActivityWithActor[];

  return (
    <div className="dashboard animate-fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/${locale}/collaborator/tasks`} className="back-btn" aria-label="Voltar">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="task-badges">
              <Badge value={t.type as TaskType} variant="type" />
              <Badge value={t.priority as TaskPriority} variant="priority" />
            </div>
            <h1 className="page-title" style={{ fontSize: 22, marginTop: 4 }}>{t.title}</h1>
          </div>
        </div>
      </div>

      <div className="task-layout">
        {/* Main content */}
        <div className="task-main">
          {/* Task info card */}
          <div className="card" style={{ padding: 24 }}>
            <div className="task-meta-grid">
              {t.clients && (
                <div className="meta-item">
                  <span className="meta-label">Cliente</span>
                  <span className="meta-value" style={{ color: t.clients.primary_color ?? undefined }}>
                    {t.clients.name}
                  </span>
                </div>
              )}
              {t.kanban_columns && (
                <div className="meta-item">
                  <span className="meta-label">Status</span>
                  <div className="meta-value meta-col">
                    <span
                      className="col-dot"
                      style={{ background: t.kanban_columns.color ?? '#6B7280' }}
                    />
                    {t.kanban_columns.name}
                  </div>
                </div>
              )}
              {t.profiles && (
                <div className="meta-item">
                  <span className="meta-label"><User size={12} /> Responsável</span>
                  <span className="meta-value">{t.profiles.full_name}</span>
                </div>
              )}
              {t.due_date && (
                <div className="meta-item">
                  <span className="meta-label"><Calendar size={12} /> Prazo</span>
                  <span className={`meta-value ${new Date(t.due_date) < new Date() ? 'overdue' : ''}`}>
                    {new Date(t.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              )}
              {t.sprint_week && (
                <div className="meta-item">
                  <span className="meta-label"><Clock size={12} /> Sprint</span>
                  <span className="meta-value">{t.sprint_week}</span>
                </div>
              )}
            </div>

            {t.description && (
              <div className="task-description">
                <h3 className="desc-label">Descrição</h3>
                <p className="desc-text">{t.description}</p>
              </div>
            )}
          </div>

          {/* Deliveries */}
          <div className="card" style={{ padding: 24 }}>
            <DeliveryPanel taskId={t.id} initialDeliveries={deliveryList} />
          </div>
        </div>

        {/* Sidebar: activity timeline */}
        <aside className="task-sidebar">
          <div className="card" style={{ padding: 20 }}>
            <h3 className="sidebar-title">Histórico</h3>
            <TaskActivityTimeline activities={activityList} />
          </div>
        </aside>
      </div>

    </div>
  );
}
