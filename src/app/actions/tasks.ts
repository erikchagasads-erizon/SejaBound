'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { TaskType, TaskPriority } from '@/lib/supabase/database.types';

export interface TaskFormData {
  title: string;
  description?: string;
  type: TaskType;
  client_id: string;
  column_id: string;
  assignee_id?: string;
  due_date?: string;
  priority: TaskPriority;
  sprint_week?: string;
}

export async function createTaskAction(data: TaskFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: task, error } = await (supabase as any).from('tasks').insert({
    title: data.title.trim(),
    description: data.description?.trim() || null,
    type: data.type,
    client_id: data.client_id,
    column_id: data.column_id,
    assignee_id: data.assignee_id || null,
    due_date: data.due_date || null,
    priority: data.priority,
    sprint_week: data.sprint_week?.trim() || null,
    created_by: user.id,
  }).select('id').single();

  if (error) return { error: error.message };

  // Log activity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('task_activity').insert({
    task_id: task.id,
    actor_id: user.id,
    action: 'criou a tarefa',
    new_value: data.title,
  });

  revalidatePath('/admin/tasks');
  revalidatePath('/admin/kanban');
  return { success: true, id: task.id };
}

export async function updateTaskAction(id: string, data: Partial<TaskFormData>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const updatePayload: Record<string, unknown> = {};
  if (data.title)        updatePayload.title        = data.title.trim();
  if (data.description !== undefined) updatePayload.description = data.description?.trim() || null;
  if (data.type)         updatePayload.type         = data.type;
  if (data.client_id)    updatePayload.client_id    = data.client_id;
  if (data.column_id)    updatePayload.column_id    = data.column_id;
  if (data.assignee_id !== undefined) updatePayload.assignee_id = data.assignee_id || null;
  if (data.due_date !== undefined)    updatePayload.due_date    = data.due_date || null;
  if (data.priority)     updatePayload.priority     = data.priority;
  if (data.sprint_week !== undefined) updatePayload.sprint_week = data.sprint_week?.trim() || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('tasks').update(updatePayload).eq('id', id);
  if (error) return { error: error.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('task_activity').insert({
    task_id: id,
    actor_id: user.id,
    action: 'editou a tarefa',
    new_value: data.title ?? null,
  });

  revalidatePath('/admin/tasks');
  revalidatePath('/admin/kanban');
  return { success: true };
}

export async function deleteTaskAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('tasks').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/admin/tasks');
  revalidatePath('/admin/kanban');
  return { success: true };
}

/** Move task to another column (Kanban drag-and-drop) */
export async function moveTaskAction(taskId: string, newColumnId: string, columnName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('tasks')
    .update({ column_id: newColumnId })
    .eq('id', taskId);

  if (error) return { error: error.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('task_activity').insert({
    task_id: taskId,
    actor_id: user.id,
    action: 'moveu para',
    new_value: columnName,
  });

  revalidatePath('/admin/kanban');
  return { success: true };
}
