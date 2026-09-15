'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface SaveReportInput {
  clientId: string;
  title: string;
  periodStart?: string;
  periodEnd?: string;
  data: Record<string, unknown>;
}

export async function saveReportSnapshotAction(input: SaveReportInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  if (!input.title?.trim()) return { error: 'Título obrigatório' };
  if (!input.clientId) return { error: 'Cliente obrigatório' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: report, error } = await (supabase as any).from('reports').insert({
    client_id: input.clientId,
    title: input.title.trim(),
    period_start: input.periodStart || null,
    period_end: input.periodEnd || null,
    data: input.data || {},
    created_by: user.id,
  }).select('id').single();

  if (error) return { error: error.message };

  revalidatePath('/admin/reports');
  return { success: true, id: report.id };
}

export async function getSavedReportsAction(clientId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  let query = supabase
    .from('reports')
    .select('*, clients(name), profiles:created_by(full_name)')
    .order('created_at', { ascending: false });

  if (clientId && clientId !== 'all') {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };

  return { success: true, reports: data ?? [] };
}

export async function deleteReportSnapshotAction(reportId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { error } = await supabase.from('reports').delete().eq('id', reportId);
  if (error) return { error: error.message };

  revalidatePath('/admin/reports');
  return { success: true };
}
