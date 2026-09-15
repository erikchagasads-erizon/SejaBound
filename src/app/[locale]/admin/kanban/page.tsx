import { createClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/admin/kanban-board';
import { KanbanSquare, Plus } from 'lucide-react';
import Link from 'next/link';
import { TrelloImportButton } from '@/components/admin/trello-import-button';
import type { KanbanColumnRow, TaskRow, ProfileRow, ClientRow } from '@/lib/supabase/types';

export const metadata = { title: 'Kanban | Bound Admin' };

type TaskWithRelations = TaskRow & {
  profiles: Pick<ProfileRow, 'full_name'> | null;
  clients: Pick<ClientRow, 'name' | 'primary_color'> | null;
};

export default async function KanbanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const [{ data: columns }, { data: tasks }, { data: { user } }, { data: clients }] = await Promise.all([
    supabase.from('kanban_columns').select('*').order('position', { ascending: true }),
    supabase
      .from('tasks')
      .select('*, profiles!tasks_assignee_id_fkey(full_name), clients(name, primary_color)')
      .order('created_at', { ascending: false }),
    supabase.auth.getUser(),
    supabase.from('clients').select('id, name, primary_color').order('name', { ascending: true }),
  ]);

  // Buscar role do usuário para saber se mostra o botão de import
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase as any).from('profiles').select('role').eq('id', user.id).single()
    : { data: null };
  const isAdmin = (profileData as { role?: string } | null)?.role === 'admin';

  const columnList = (columns ?? []) as KanbanColumnRow[];
  const taskList = (tasks ?? []) as unknown as TaskWithRelations[];

  // Group tasks by column_id
  const tasksByColumn: Record<string, TaskWithRelations[]> = {};
  for (const col of columnList) {
    tasksByColumn[col.id] = [];
  }
  for (const task of taskList) {
    if (tasksByColumn[task.column_id]) {
      tasksByColumn[task.column_id].push(task);
    }
  }

  const totalTasks = taskList.length;

  return (
    <div className="dashboard animate-fade-in" style={{ overflow: 'hidden' }}>
      <div className="dashboard-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>
            <KanbanSquare size={26} style={{ display: 'inline', marginRight: 10, verticalAlign: 'middle' }} />
            <span className="gradient-text">Kanban Global</span>
          </h1>
          <p className="page-subtitle">
            {columnList.length} colunas · {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="header-actions">
          {isAdmin && clients && clients.length > 0 && (
            <TrelloImportButton clients={clients} />
          )}
          <Link href={`/${locale}/admin/settings`} className="btn-ghost-link" id="btn-manage-columns">
            Gerenciar colunas
          </Link>
          <Link href={`/${locale}/admin/tasks/new`} className="btn-primary-link" id="btn-new-task-kanban">
            <Plus size={16} />
            Nova Tarefa
          </Link>
        </div>
      </div>

      {columnList.length === 0 ? (
        <div className="card empty-board">
          <div className="empty-icon">🗂️</div>
          <h2 className="empty-title">Nenhuma coluna criada</h2>
          <p className="empty-desc">Crie colunas nas configurações para montar seu quadro Kanban.</p>
          <Link href={`/${locale}/admin/settings`} className="btn-primary">
            Criar colunas
          </Link>
        </div>
      ) : (
        <KanbanBoard
          columns={columnList}
          tasksByColumn={tasksByColumn}
          locale={locale}
        />
      )}

    </div>
  );
}
