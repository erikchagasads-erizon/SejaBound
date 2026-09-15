'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createTaskAction, updateTaskAction } from '@/app/actions/tasks';
import type { TaskRow, ClientRow, KanbanColumnRow, ProfileRow } from '@/lib/supabase/types';
import type { TaskType, TaskPriority } from '@/lib/supabase/database.types';

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'design',       label: 'Design' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'traffic',      label: 'Tráfego' },
  { value: 'content',      label: 'Conteúdo' },
  { value: 'web',          label: 'Web' },
  { value: 'video',        label: 'Vídeo' },
  { value: 'photo',        label: 'Foto' },
  { value: 'report',       label: 'Relatório' },
  { value: 'other',        label: 'Outro' },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'low',    label: '🟢 Baixa' },
  { value: 'medium', label: '🟡 Média' },
  { value: 'high',   label: '🟠 Alta' },
  { value: 'urgent', label: '🔴 Urgente' },
];

const schema = z.object({
  title:       z.string().min(3, 'Título obrigatório (mín. 3 caracteres)'),
  description: z.string().optional(),
  type:        z.enum(['design','social_media','traffic','content','web','video','photo','report','other'] as [TaskType, ...TaskType[]]),
  client_id:   z.string().min(1, 'Selecione um cliente'),
  column_id:   z.string().min(1, 'Selecione uma coluna'),
  assignee_id: z.string().optional(),
  due_date:    z.string().optional(),
  priority:    z.enum(['low','medium','high','urgent'] as [TaskPriority, ...TaskPriority[]]),
  sprint_week: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TaskFormProps {
  initialData?: TaskRow;
  clients: Pick<ClientRow, 'id' | 'name'>[];
  columns: Pick<KanbanColumnRow, 'id' | 'name'>[];
  collaborators: Pick<ProfileRow, 'id' | 'full_name'>[];
  locale: string;
}

export function TaskForm({ initialData, clients, columns, collaborators, locale }: TaskFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:       initialData?.title ?? '',
      description: initialData?.description ?? '',
      type:        initialData?.type as TaskType ?? 'design',
      client_id:   initialData?.client_id ?? '',
      column_id:   initialData?.column_id ?? '',
      assignee_id: initialData?.assignee_id ?? '',
      due_date:    initialData?.due_date?.slice(0, 10) ?? '',
      priority:    initialData?.priority as TaskPriority ?? 'medium',
      sprint_week: initialData?.sprint_week ?? '',
    },
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      const result = initialData
        ? await updateTaskAction(initialData.id, values)
        : await createTaskAction(values);

      if (result?.error) {
        setServerError(result.error);
      } else {
        router.push(`/${locale}/admin/tasks`);
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="task-form" noValidate>
      {serverError && (
        <div className="form-error-banner" role="alert">{serverError}</div>
      )}

      <Input
        id="task-title"
        label="Título da Tarefa"
        required
        placeholder="Ex: Criar posts semana 32"
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        id="task-description"
        label="Descrição"
        placeholder="Descreva o que precisa ser feito..."
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="form-grid-2">
        <Select
          id="task-type"
          label="Tipo"
          required
          options={TASK_TYPES}
          error={errors.type?.message}
          {...register('type')}
        />

        <Select
          id="task-priority"
          label="Prioridade"
          required
          options={PRIORITIES}
          error={errors.priority?.message}
          {...register('priority')}
        />
      </div>

      <div className="form-grid-2">
        <Select
          id="task-client"
          label="Cliente"
          required
          placeholder="Selecione..."
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.client_id?.message}
          {...register('client_id')}
        />

        <Select
          id="task-column"
          label="Coluna / Status"
          required
          placeholder="Selecione..."
          options={columns.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.column_id?.message}
          {...register('column_id')}
        />
      </div>

      <div className="form-grid-2">
        <Select
          id="task-assignee"
          label="Responsável"
          placeholder="Sem atribuição"
          options={[
            { value: '', label: '— Sem atribuição —' },
            ...collaborators.map((c) => ({ value: c.id, label: c.full_name ?? c.id })),
          ]}
          error={errors.assignee_id?.message}
          {...register('assignee_id')}
        />

        <Input
          id="task-due-date"
          label="Prazo"
          type="date"
          error={errors.due_date?.message}
          {...register('due_date')}
        />
      </div>

      <Input
        id="task-sprint"
        label="Sprint Week"
        placeholder="Ex: 2025-W32"
        hint="Formato ISO: YYYY-Www"
        error={errors.sprint_week?.message}
        {...register('sprint_week')}
      />

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={() => router.back()} disabled={isPending}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={isPending} id="task-form-submit">
          {isPending ? <Loader2 size={16} className="spin" /> : null}
          {initialData ? 'Salvar alterações' : 'Criar tarefa'}
        </button>
      </div>

      <style jsx>{`
        .task-form { display: flex; flex-direction: column; gap: 20px; }

        .form-error-banner {
          padding: 12px 16px; background: hsl(var(--error) / 0.1);
          border: 1px solid hsl(var(--error) / 0.3); border-radius: var(--radius-md);
          color: hsl(var(--error)); font-size: 14px;
        }

        .form-grid-2 {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        @media (max-width: 600px) { .form-grid-2 { grid-template-columns: 1fr; } }

        .form-actions {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 10px; padding-top: 4px;
        }

        .btn-ghost {
          padding: 9px 18px; border-radius: var(--radius-md);
          background: transparent; border: 1px solid hsl(var(--border-default));
          color: hsl(var(--text-secondary)); font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-ghost:hover:not(:disabled) { background: hsl(var(--bg-elevated)); }
        .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-primary {
          display: flex; align-items: center; gap: 8px; padding: 9px 20px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          border: none; color: white; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        :global(.spin) { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
}
