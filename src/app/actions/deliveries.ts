'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface DeliveryFormData {
  task_id: string;
  title: string;
  description?: string;
}

export async function createDeliveryAction(data: DeliveryFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: delivery, error } = await (supabase as any).from('deliveries').insert({
    task_id: data.task_id,
    title: data.title.trim(),
    description: data.description?.trim() || null,
    status: 'pending',
    created_by: user.id,
  }).select('id').single();

  if (error) return { error: error.message };

  // Log activity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('task_activity').insert({
    task_id: data.task_id,
    actor_id: user.id,
    action: 'criou entrega',
    new_value: data.title,
  });

  // Background email dispatch
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const webhookSecret = process.env.NOTIFICATION_WEBHOOK_SECRET;
  if (webhookSecret) {
    fetch(`${baseUrl}/api/notifications/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${webhookSecret}`,
      },
      body: JSON.stringify({
        delivery_id: delivery.id,
        action: 'created',
      }),
    }).catch((err) => console.error('[Failed to notify on delivery creation]', err));
  } else {
    console.warn('[deliveries] NOTIFICATION_WEBHOOK_SECRET ausente — notificação de entrega não enviada.');
  }

  revalidatePath(`/collaborator/tasks/${data.task_id}`);
  return { success: true, id: delivery.id };
}

export async function deleteDeliveryAction(deliveryId: string, taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('deliveries').delete().eq('id', deliveryId);
  if (error) return { error: error.message };

  revalidatePath(`/collaborator/tasks/${taskId}`);
  return { success: true };
}

export interface FileRecord {
  delivery_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
}

export async function addFileToDeliveryAction(record: FileRecord) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('delivery_files').insert({
    delivery_id: record.delivery_id,
    file_name: record.file_name,
    file_url: record.file_url,
    file_size: record.file_size ?? null,
    mime_type: record.mime_type ?? null,
    uploaded_by: user.id,
  });

  if (error) return { error: error.message };

  return { success: true };
}

export async function removeFileAction(fileId: string, taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('delivery_files').delete().eq('id', fileId);
  if (error) return { error: error.message };

  revalidatePath(`/collaborator/tasks/${taskId}`);
  return { success: true };
}
