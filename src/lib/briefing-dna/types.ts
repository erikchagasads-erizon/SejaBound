export interface BriefingDnaAnswers {
  problemaReal: string;
  clientesAtuais: string;
  objecaoVenda: string;
  ticketMedio: string;
  metaFaturamento: string;
  concorrentes: string;
  diferencial: string;
  founderStory: string;
  marketingAnterior: string;
}

export type BriefingDnaField = keyof BriefingDnaAnswers;

export interface BriefingDnaSubmission extends BriefingDnaAnswers {
  submittedAt: string;
}

export const EMPTY_BRIEFING_DNA_ANSWERS: BriefingDnaAnswers = {
  problemaReal: '',
  clientesAtuais: '',
  objecaoVenda: '',
  ticketMedio: '',
  metaFaturamento: '',
  concorrentes: '',
  diferencial: '',
  founderStory: '',
  marketingAnterior: '',
};
