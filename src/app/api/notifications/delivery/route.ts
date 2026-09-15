import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import {
  renderDeliveryApprovedEmail,
  renderDeliveryRevisionEmail,
  renderDeliveryReadyEmail,
} from '@/lib/email/templates';
import { timingSafeEqual } from 'crypto';

/**
 * POST /api/notifications/delivery
 * Dispatches email notifications for delivery events (created, approved, revision_requested)
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.NOTIFICATION_WEBHOOK_SECRET;

  // CRÍTICO: secret é OBRIGATÓRIO. Se ausente, recusar — nunca abrir o endpoint.
  if (!secret) {
    console.error('[notifications/delivery] NOTIFICATION_WEBHOOK_SECRET não definido — endpoint bloqueado.');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 });
  }

  // Comparação constant-time para evitar timing attacks
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authHeader);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    delivery_id: string;
    action: 'created' | 'approved' | 'revision_requested';
    feedback?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Load delivery + task + assignee + client details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: delivery, error: deliveryError } = await (adminSupabase as any)
    .from('deliveries')
    .select(`
      id,
      title,
      task_id,
      tasks (
        id,
        title,
        assignee_id,
        clients (
          id,
          name,
          contact_email
        ),
        profiles!tasks_assignee_id_fkey (
          id,
          full_name
        )
      )
    `)
    .eq('id', body.delivery_id)
    .single();

  if (deliveryError || !delivery) {
    return NextResponse.json({ error: 'Delivery not found' }, { status: 404 });
  }

  const task = delivery.tasks;
  const assigneeProfile = task?.profiles;
  const client = task?.clients;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let assigneeEmail: string | null = null;
  if (task?.assignee_id) {
    const { data: userData } = await adminSupabase.auth.admin.getUserById(task.assignee_id);
    assigneeEmail = userData?.user?.email ?? null;
  }

  // Count files
  const { count: filesCount } = await adminSupabase
    .from('delivery_files')
    .select('*', { count: 'exact', head: true })
    .eq('delivery_id', delivery.id);

  let emailResult = { success: false, info: 'No action taken' };

  if (body.action === 'created') {
    // Notify client that a new delivery is waiting for approval
    const clientEmail = client?.contact_email;
    if (clientEmail) {
      const html = renderDeliveryReadyEmail({
        clientName: client?.name || 'Cliente',
        taskTitle: task?.title || 'Tarefa',
        deliveryTitle: delivery.title,
        filesCount: filesCount || undefined,
        portalUrl: `${baseUrl}/pt-BR/client/approvals`,
      });

      const res = await sendEmail({
        to: clientEmail,
        subject: `[Bound] Nova entrega para aprovação: "${delivery.title}"`,
        html,
        templateName: 'delivery_ready',
      });
      emailResult = { success: res.success, info: 'Client notified' };
    }
  } else if (body.action === 'approved') {
    // Notify collaborator that the delivery was approved
    if (assigneeEmail) {
      const html = renderDeliveryApprovedEmail({
        collaboratorName: assigneeProfile?.full_name || 'Colaborador',
        taskTitle: task?.title || 'Tarefa',
        deliveryTitle: delivery.title,
        clientName: client?.name || 'Cliente',
        portalUrl: `${baseUrl}/pt-BR/collaborator/tasks/${task?.id}`,
      });

      const res = await sendEmail({
        to: assigneeEmail,
        recipientId: task?.assignee_id,
        subject: `[Bound] ✅ Entrega Aprovada: "${delivery.title}"`,
        html,
        templateName: 'delivery_approved',
      });
      emailResult = { success: res.success, info: 'Collaborator notified of approval' };
    }
  } else if (body.action === 'revision_requested') {
    // Notify collaborator of requested changes
    if (assigneeEmail) {
      const html = renderDeliveryRevisionEmail({
        collaboratorName: assigneeProfile?.full_name || 'Colaborador',
        taskTitle: task?.title || 'Tarefa',
        deliveryTitle: delivery.title,
        clientName: client?.name || 'Cliente',
        feedback: body.feedback || 'Ajustes solicitados sem observações adicionais.',
        portalUrl: `${baseUrl}/pt-BR/collaborator/tasks/${task?.id}`,
      });

      const res = await sendEmail({
        to: assigneeEmail,
        recipientId: task?.assignee_id,
        subject: `[Bound] 🔄 Revisão Solicitada: "${delivery.title}"`,
        html,
        templateName: 'delivery_revision',
      });
      emailResult = { success: res.success, info: 'Collaborator notified of revision' };
    }
  }

  return NextResponse.json({ success: true, action: body.action, emailResult });
}
