import { createClient } from '@/lib/supabase/server';
import { TaskForm } from '@/components/admin/task-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ClientRow, KanbanColumnRow, ProfileRow } from '@/lib/supabase/types';

export const metadata = { title: 'Nova Tarefa | Bound Admin' };

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const [
    { data: clients },
    { data: columns },
    { data: collaborators },
  ] = await Promise.all([
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('kanban_columns').select('id, name').order('position'),
    supabase.from('profiles').select('id, full_name').eq('role', 'collaborator').order('full_name'),
  ]);

  return (
    <div className="dashboard animate-fade-in">
      <div className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href={`/${locale}/admin/tasks`} className="back-btn" aria-label="Voltar">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title" style={{ fontSize: 26 }}>Nova <span className="gradient-text">Tarefa</span></h1>
            <p className="page-subtitle">Preencha os detalhes da tarefa</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 28, maxWidth: 760 }}>
        <TaskForm
          clients={(clients ?? []) as Pick<ClientRow, 'id' | 'name'>[]}
          columns={(columns ?? []) as Pick<KanbanColumnRow, 'id' | 'name'>[]}
          collaborators={(collaborators ?? []) as Pick<ProfileRow, 'id' | 'full_name'>[]}
          locale={locale}
        />
      </div>


    </div>
  );
}
