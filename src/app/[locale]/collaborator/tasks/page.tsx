import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TaskRow, ClientRow, KanbanColumnRow } from '@/lib/supabase/types';
import type { TaskPriority, TaskType } from '@/lib/supabase/database.types';

export const metadata = { title: 'Minhas Tarefas | Bound' };

type TaskWithRelations = TaskRow & {
  clients: Pick<ClientRow, 'name' | 'primary_color'> | null;
  kanban_columns: Pick<KanbanColumnRow, 'name' | 'color'> | null;
};

export default async function CollaboratorTasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data } = await supabase
    .from('tasks')
    .select('*, clients(name, primary_color), kanban_columns(name, color)')
    .eq('assignee_id', user.id)
    .order('due_date', { ascending: true, nullsLast: true });

  const tasks = (data ?? []) as TaskWithRelations[];

  const overdue = tasks.filter((t) => t.due_date && new Date(t.due_date) < new Date());
  const upcoming = tasks.filter((t) => !t.due_date || new Date(t.due_date) >= new Date());

  const renderTaskRow = (task: TaskWithRelations) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
    return (
      <Link
        key={task.id}
        href={`/${locale}/collaborator/tasks/${task.id}`}
        className="task-row"
        id={`task-row-${task.id}`}
      >
        <div
          className="task-stripe"
          style={{ background: task.clients?.primary_color ?? 'hsl(var(--brand-primary))' }}
        />
        <div className="task-row-body">
          <div className="task-row-top">
            <Badge value={task.type as TaskType} variant="type" />
            <Badge value={task.priority as TaskPriority} variant="priority" />
          </div>
          <p className="task-row-title">{task.title}</p>
          <div className="task-row-meta">
            <span className="task-client">{task.clients?.name ?? '—'}</span>
            {task.kanban_columns && (
              <span className="task-col">
                <span
                  className="col-dot"
                  style={{ background: task.kanban_columns.color ?? '#6B7280' }}
                />
                {task.kanban_columns.name}
              </span>
            )}
          </div>
        </div>
        <div className="task-row-right">
          {task.due_date && (
            <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>
              <Clock size={12} />
              {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
          <span className="task-arrow">→</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            <FileText size={26} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            <span className="gradient-text">Minhas Tarefas</span>
          </h1>
          <p className="page-subtitle">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} atribuída{tasks.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="section">
          <div className="section-header overdue-header">
            <AlertCircle size={16} />
            <h2 className="section-title">Atrasadas ({overdue.length})</h2>
          </div>
          <div className="task-list overdue-list">
            {overdue.map(renderTaskRow)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="section">
        {overdue.length > 0 && (
          <div className="section-header">
            <h2 className="section-title">Pendentes ({upcoming.length})</h2>
          </div>
        )}
        {upcoming.length === 0 && overdue.length === 0 ? (
          <div className="card empty-state-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🎉</div>
            <p style={{ color: 'hsl(var(--text-muted))', marginTop: 12 }}>Nenhuma tarefa atribuída a você.</p>
          </div>
        ) : (
          <div className="task-list">
            {upcoming.map(renderTaskRow)}
          </div>
        )}
      </div>

    </div>
  );
}
