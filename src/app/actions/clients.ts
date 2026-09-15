'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ClientFormData {
  name: string;
  company?: string;
  contact_email?: string;
  primary_color?: string;
  logo_url?: string;
}

export async function createClientAction(data: ClientFormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('clients').insert({
    name: data.name.trim(),
    company: data.company?.trim() || null,
    contact_email: data.contact_email?.trim() || null,
    primary_color: data.primary_color || null,
    logo_url: data.logo_url?.trim() || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/clients');
  return { success: true };
}

export async function updateClientAction(id: string, data: Partial<ClientFormData>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('clients').update({
    name: data.name?.trim(),
    company: data.company?.trim() || null,
    contact_email: data.contact_email?.trim() || null,
    primary_color: data.primary_color || null,
    logo_url: data.logo_url?.trim() || null,
  }).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/clients');
  return { success: true };
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('clients').delete().eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/admin/clients');
  return { success: true };
}
