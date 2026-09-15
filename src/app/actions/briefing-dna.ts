'use server';

import { createAdminClient } from '@/lib/supabase/admin';
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('dna_briefing_submissions').insert({
    problema_real: answers.problemaReal.trim(),
    clientes_atuais: answers.clientesAtuais.trim(),
    objecao_venda: answers.objecaoVenda.trim(),
    ticket_medio: answers.ticketMedio.trim(),
    meta_faturamento: answers.metaFaturamento.trim(),
    concorrentes: answers.concorrentes.trim(),
    diferencial: answers.diferencial.trim(),
    founder_story: answers.founderStory.trim(),
    marketing_anterior: answers.marketingAnterior.trim(),
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[briefing-dna] Falha ao salvar submissão:', error);
    return { error: 'Não foi possível enviar o briefing agora. Tente novamente em instantes.' };
  }

  return { success: true as const };
}
