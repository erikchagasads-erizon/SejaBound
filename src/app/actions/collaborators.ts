'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function inviteCollaboratorAction(email: string, fullName: string, clientIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // Use admin client for inviteUserByEmail
  const adminSupabase = await createAdminClient();

  const { data: invited, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: fullName,
      role: 'collaborator',
    },
  });

  if (inviteError) return { error: inviteError.message };
  if (!invited.user) return { error: 'Falha ao convidar usuário' };

  const profileId = invited.user.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase as any)
    .from('profiles')
    .upsert({ id: profileId, full_name: fullName, role: 'collaborator' }, { onConflict: 'id' });

  // Link collaborator to selected clients
  if (clientIds.length > 0) {
    const links = clientIds.map((client_id) => ({ collaborator_id: profileId, client_id }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('collaborator_clients').insert(links);
  }

  // Send branded invitation email
  try {
    const { sendEmail } = await import('@/lib/email/client');
    const { renderCollaboratorInviteEmail } = await import('@/lib/email/templates');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const html = renderCollaboratorInviteEmail({
      collaboratorName: fullName,
      role: 'Colaborador da Agência',
      portalUrl: `${baseUrl}/pt-BR/login`,
    });

    await sendEmail({
      to: email,
      recipientId: profileId,
      subject: '[Bound] Convite de Acesso à Equipe',
      html,
      templateName: 'collaborator_invite',
    });
  } catch (err) {
    console.error('[Error sending invite email]', err);
  }

  revalidatePath('/admin/collaborators');
  return { success: true };
}

export async function updateCollaboratorClientsAction(collaboratorId: string, clientIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('collaborator_clients').delete().eq('collaborator_id', collaboratorId);

  if (clientIds.length > 0) {
    const links = clientIds.map((client_id) => ({ collaborator_id: collaboratorId, client_id }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('collaborator_clients').insert(links);
    if (error) return { error: error.message };
  }

  revalidatePath('/admin/collaborators');
  return { success: true };
}

export async function removeCollaboratorAction(profileId: string) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('collaborator_clients').delete().eq('collaborator_id', profileId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminSupabase as any)
    .from('profiles')
    .update({ role: 'client' })
    .eq('id', profileId);

  if (error) return { error: error.message };

  revalidatePath('/admin/collaborators');
  return { success: true };
}
