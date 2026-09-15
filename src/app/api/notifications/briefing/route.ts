import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import { renderNewBriefingEmail } from '@/lib/email/templates';
import { timingSafeEqual } from 'crypto';

/**
 * POST /api/notifications/briefing
 * Dispatches notification to admins when a client submits a briefing
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.NOTIFICATION_WEBHOOK_SECRET;

  // CRÍTICO: secret é OBRIGATÓRIO. Se ausente, recusar — nunca abrir o endpoint.
  if (!secret) {
    console.error('[notifications/briefing] NOTIFICATION_WEBHOOK_SECRET não definido — endpoint bloqueado.');
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

  let body: { briefing_id: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Load briefing and client details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: briefing, error } = await (adminSupabase as any)
    .from('briefings')
    .select(`
      id,
      title,
      category,
      clients (
        id,
        name
      )
    `)
    .eq('id', body.briefing_id)
    .single();

  if (error || !briefing) {
    return NextResponse.json({ error: 'Briefing not found' }, { status: 404 });
  }

  const client = briefing.clients;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Find all admin profiles
  const { data: admins } = await adminSupabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'admin');

  const adminList = (admins ?? []) as Array<{ id: string; full_name: string }>;
  if (adminList.length > 0) {
    for (const admin of adminList) {
      const { data: userData } = await adminSupabase.auth.admin.getUserById(admin.id);
      const adminEmail = userData?.user?.email;

      if (adminEmail) {
        const html = renderNewBriefingEmail({
          adminOrTeamName: admin.full_name,
          clientName: client?.name || 'Cliente',
          briefingTitle: briefing.title,
          category: briefing.category || undefined,
          portalUrl: `${baseUrl}/pt-BR/admin/tasks/new`,
        });

        await sendEmail({
          to: adminEmail,
          recipientId: admin.id,
          subject: `[Bound] Novo Briefing: "${briefing.title}" (${client?.name || 'Cliente'})`,
          html,
          templateName: 'new_briefing',
        });
      }
    }
  }

  return NextResponse.json({ success: true, info: 'Admins notified' });
}
