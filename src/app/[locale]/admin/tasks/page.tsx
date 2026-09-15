import { createClient } from '@/lib/supabase/server';
import { TasksTable } from '@/components/admin/tasks-table';
import { FileText } from 'lucide-react';
import type { TaskRow, ClientRow, ProfileRow, KanbanColumnRow } from '@/lib/supabase/types';

export const metadata = { title: 'Tarefas | Bound Admin' };

type TaskWithRelations = TaskRow & {
  clients: Pick<ClientRow, 'name'> | null;
  profiles: Pick<ProfileRow, 'full_name'> | null;
  kanban_columns: Pick<KanbanColumnRow, 'name'> | null;
};

export default async function TasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('tasks')
    .select('*, clients(name), profiles!tasks_assignee_id_fkey(full_name), kanban_columns(name)')
    .order('created_at', { ascending: false });

  const tasks = (data ?? []) as unknown as TaskWithRelations[];

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            <FileText size={26} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            <span className="gradient-text">Tarefas</span>
          </h1>
          <p className="page-subtitle">{tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} no total</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <TasksTable tasks={tasks} locale={locale} />
      </div>
    </div>
  );
}
