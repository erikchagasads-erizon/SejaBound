import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TaskForm } from '@/components/admin/task-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { TaskRow, ClientRow, KanbanColumnRow, ProfileRow } from '@/lib/supabase/types';

export const metadata = { title: 'Editar Tarefa | Bound Admin' };

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const [
    { data: task },
    { data: clients },
    { data: columns },
    { data: collaborators },
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('id', id).single(),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('kanban_columns').select('id, name').order('position'),
    supabase.from('profiles').select('id, full_name').eq('role', 'collaborator').order('full_name'),
  ]);

  if (!task) notFound();

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/${locale}/admin/tasks`} className="back-btn" aria-label="Voltar">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title" style={{ fontSize: 22 }}>Editar <span className="gradient-text">{(task as TaskRow).title}</span></h1>
            <p className="page-subtitle">Atualize os detalhes da tarefa</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 760 }}>
        <TaskForm
          initialData={task as TaskRow}
          clients={(clients ?? []) as Pick<ClientRow, 'id' | 'name'>[]}
          columns={(columns ?? []) as Pick<KanbanColumnRow, 'id' | 'name'>[]}
          collaborators={(collaborators ?? []) as Pick<ProfileRow, 'id' | 'full_name'>[]}
          locale={locale}
        />
      </div>


    </div>
  );
}
