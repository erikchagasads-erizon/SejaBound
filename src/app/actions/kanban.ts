'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function createColumnAction(data: {
  name: string;
  color: string;
  position: number;
  is_final: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('kanban_columns').insert({
    name: data.name.trim(),
    color: data.color || null,
    position: data.position,
    is_final: data.is_final,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/settings');
  revalidatePath('/admin/kanban');
  return { success: true };
}

export async function updateColumnAction(id: string, data: {
  name?: string;
  color?: string | null;
  position?: number;
  is_final?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const updatePayload: Record<string, unknown> = {};
  if (data.name !== undefined)     updatePayload.name     = data.name.trim();
  if (data.color !== undefined)    updatePayload.color    = data.color;
  if (data.position !== undefined) updatePayload.position = data.position;
  if (data.is_final !== undefined) updatePayload.is_final = data.is_final;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('kanban_columns').update(updatePayload).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/settings');
  revalidatePath('/admin/kanban');
  return { success: true };
}

export async function deleteColumnAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('kanban_columns').delete().eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/settings');
  revalidatePath('/admin/kanban');
  return { success: true };
}

/** Bulk reorder — called after a drag-and-drop sort */
export async function reorderColumnsAction(ordered: { id: string; position: number }[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const updates = ordered.map(({ id, position }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from('kanban_columns').update({ position }).eq('id', id)
  );

  await Promise.all(updates);

  revalidatePath('/admin/settings');
  revalidatePath('/admin/kanban');
  return { success: true };
}
