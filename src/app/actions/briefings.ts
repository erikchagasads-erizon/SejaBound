'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { BriefingStatus } from '@/lib/supabase/database.types';

export interface CreateBriefingInput {
  clientId: string;
  title: string;
  description: string;
  category?: string | null;
  attachments?: unknown;
}

export async function createBriefingAction(data: CreateBriefingInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  if (!data.title?.trim()) return { error: 'Título obrigatório' };
  if (!data.description?.trim()) return { error: 'Descrição obrigatória' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: briefing, error } = await (supabase as any).from('briefings').insert({
    client_id: data.clientId,
    submitted_by: user.id,
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category?.trim() || null,
    attachments: data.attachments ?? [],
    status: 'open',
  }).select('id').single();

  if (error) return { error: error.message };

  // Dispatch notification to admins
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const webhookSecret = process.env.NOTIFICATION_WEBHOOK_SECRET;
  if (webhookSecret) {
    fetch(`${baseUrl}/api/notifications/briefing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${webhookSecret}`,
      },
      body: JSON.stringify({ briefing_id: briefing.id }),
    }).catch((err) => console.error('[Failed to dispatch briefing notification]', err));
  } else {
    console.warn('[briefings] NOTIFICATION_WEBHOOK_SECRET ausente — notificação de briefing não enviada.');
  }

  revalidatePath('/client/briefings');
  revalidatePath('/collaborator/briefings');
  revalidatePath('/admin/dashboard');
  return { success: true, id: briefing.id };
}

export async function updateBriefingStatusAction(id: string, status: BriefingStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('briefings').update({
    status,
  }).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/client/briefings');
  revalidatePath('/collaborator/briefings');
  return { success: true };
}
