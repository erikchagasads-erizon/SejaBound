'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export const DELIVERY_BUCKET = 'deliveries';

/**
 * Creates a signed upload URL for uploading a file to Supabase Storage
 * from the browser without exposing service-role credentials.
 *
 * The client uploads directly to the signed URL, then calls
 * `registerUploadedFileAction` to persist the metadata in the DB.
 */
export async function createSignedUploadUrlAction(
  deliveryId: string,
  fileName: string,
): Promise<{ signedUrl: string; path: string; token: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const sanitized = fileName.replace(/[^a-zA-Z0-9._\-]/g, '_');
  const path = `${deliveryId}/${Date.now()}-${sanitized}`;

  const { data, error } = await supabase.storage
    .from(DELIVERY_BUCKET)
    .createSignedUploadUrl(path);

  if (error) return { error: error.message };

  return { signedUrl: data.signedUrl, path: data.path, token: data.token };
}

/**
 * After the client uploads a file via a signed URL, call this action to
 * persist the file record in `delivery_files` and log activity.
 */
export async function registerUploadedFileAction(params: {
  deliveryId: string;
  taskId: string;
  path: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { data: urlData } = supabase.storage
    .from(DELIVERY_BUCKET)
    .getPublicUrl(params.path);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from('delivery_files').insert({
    delivery_id: params.deliveryId,
    file_name: params.fileName,
    file_url: urlData.publicUrl,
    file_size: params.fileSize,
    mime_type: params.mimeType,
    uploaded_by: user.id,
  }).select('id').single();

  if (error) return { error: error.message };

  // Log activity
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('task_activity').insert({
    task_id: params.taskId,
    actor_id: user.id,
    action: 'anexou arquivo',
    new_value: params.fileName,
  });

  revalidatePath(`/collaborator/tasks/${params.taskId}`);
  return { id: data.id };
}

/**
 * Removes a file from Storage and deletes its DB record.
 */
export async function deleteStorageFileAction(
  fileId: string,
  filePath: string,
  taskId: string,
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // Remove from bucket (best-effort — don't block on storage errors)
  await supabase.storage.from(DELIVERY_BUCKET).remove([filePath]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('delivery_files').delete().eq('id', fileId);
  if (error) return { error: error.message };

  revalidatePath(`/collaborator/tasks/${taskId}`);
  return { success: true };
}

/**
 * Generates a short-lived signed URL for downloading a private file.
 * Use this if the bucket is private (not public).
 */
export async function getSignedDownloadUrlAction(
  path: string,
  expiresInSeconds = 3600,
): Promise<{ signedUrl: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  const { data, error } = await supabase.storage
    .from(DELIVERY_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) return { error: error.message };
  return { signedUrl: data.signedUrl };
}
