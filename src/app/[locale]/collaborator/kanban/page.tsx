import { createClient } from '@/lib/supabase/server';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { KanbanSquare } from 'lucide-react';

import { redirect } from 'next/navigation';

export const metadata = { title: 'Kanban' };

export default async function CollaboratorKanbanPage({
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

  const [{ data: columns }, { data: tasks }] = await Promise.all([
    supabase.from('kanban_columns').select('*').order('position'),
    supabase
      .from('tasks')
      .select('*, clients(name), profiles:assignee_id(full_name, avatar_url)')
      .eq('assignee_id', user.id)
      .order('updated_at', { ascending: false }),
  ]);

  return (
    <div className="kanban-page animate-fade-in">
      <div className="page-header">
        <div className="page-header-icon" style={{ background: 'hsl(var(--brand-primary) / 0.12)', color: 'hsl(var(--brand-primary))' }}>
          <KanbanSquare size={22} />
        </div>
        <div>
          <h1 className="page-title">Meu Kanban</h1>
          <p className="page-subtitle">Arraste as tarefas entre as colunas para atualizar o status</p>
        </div>
      </div>

      <KanbanBoard columns={columns ?? []} tasks={tasks ?? []} />
    </div>
  );
}
