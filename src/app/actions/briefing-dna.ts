'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import { renderDnaBriefingEmail } from '@/lib/email/templates';
import type { BriefingDnaAnswers } from '@/lib/briefing-dna/types';

const REQUIRED_FIELDS: (keyof BriefingDnaAnswers)[] = [
  'problemaReal',
  'clientesAtuais',
  'objecaoVenda',
  'ticketMedio',
  'metaFaturamento',
  'concorrentes',
  'diferencial',
  'founderStory',
  'marketingAnterior',
];

export async function submitBriefingDnaAction(answers: BriefingDnaAnswers) {
  for (const field of REQUIRED_FIELDS) {
    if (!answers[field]?.trim()) {
      return { error: 'Preencha todas as perguntas antes de enviar.' };
    }
  }

  // Destino final da submissão: tabela `dna_briefing_submissions` no Supabase
  // (ver supabase/migrations/004_dna_briefing.sql). Para conectar a outro
  // destino (CRM, planilha, webhook), troque o insert abaixo.
  const supabase = createAdminClient();
  const submittedAt = new Date().toISOString();

  const trimmed = {
    problema_real: answers.problemaReal.trim(),
    clientes_atuais: answers.clientesAtuais.trim(),
    objecao_venda: answers.objecaoVenda.trim(),
    ticket_medio: answers.ticketMedio.trim(),
    meta_faturamento: answers.metaFaturamento.trim(),
    concorrentes: answers.concorrentes.trim(),
    diferencial: answers.diferencial.trim(),
    founder_story: answers.founderStory.trim(),
    marketing_anterior: answers.marketingAnterior.trim(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('dna_briefing_submissions').insert({
    ...trimmed,
    submitted_at: submittedAt,
  });

  if (error) {
    console.error('[briefing-dna] Falha ao salvar submissão:', error);
    return { error: 'Não foi possível enviar o briefing agora. Tente novamente em instantes.' };
  }

  // Notifica os admins por e-mail. Melhor esforço: se o e-mail falhar, o
  // briefing já está salvo — não bloqueia nem falha a submissão do usuário.
  try {
    await notifyAdminsByEmail(supabase, trimmed, submittedAt);
  } catch (notifyError) {
    console.error('[briefing-dna] Falha ao notificar admins por e-mail:', notifyError);
  }

  return { success: true as const };
}

async function notifyAdminsByEmail(
  supabase: ReturnType<typeof createAdminClient>,
  trimmed: {
    problema_real: string;
    clientes_atuais: string;
    objecao_venda: string;
    ticket_medio: string;
    meta_faturamento: string;
    concorrentes: string;
    diferencial: string;
    founder_story: string;
    marketing_anterior: string;
  },
  submittedAt: string,
) {
  const html = renderDnaBriefingEmail({
    problemaReal: trimmed.problema_real,
    clientesAtuais: trimmed.clientes_atuais,
    objecaoVenda: trimmed.objecao_venda,
    ticketMedio: trimmed.ticket_medio,
    metaFaturamento: trimmed.meta_faturamento,
    concorrentes: trimmed.concorrentes,
    diferencial: trimmed.diferencial,
    founderStory: trimmed.founder_story,
    marketingAnterior: trimmed.marketing_anterior,
    submittedAt,
  });

  const subject = '[Bound] Novo Briefing DNA BND recebido';

  // Destino fixo (ex.: boundmarketing@hotmail.com), configurável via env sem
  // precisar mexer no código. Se não estiver definido, cai para todos os
  // profiles com role admin (comportamento padrão do restante do projeto).
  const fixedRecipient = process.env.DNA_BRIEFING_NOTIFICATION_EMAIL;
  if (fixedRecipient) {
    await sendEmail({ to: fixedRecipient, subject, html, templateName: 'dna_briefing' });
    return;
  }

  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  const adminIds = (admins ?? []) as Array<{ id: string }>;
  if (adminIds.length === 0) return;

  await Promise.all(
    adminIds.map(async (admin) => {
      const { data: userData } = await supabase.auth.admin.getUserById(admin.id);
      const adminEmail = userData?.user?.email;
      if (!adminEmail) return;

      await sendEmail({
        to: adminEmail,
        recipientId: admin.id,
        subject,
        html,
        templateName: 'dna_briefing',
      });
    }),
  );
}
