import type { BriefingDnaField } from './types';

export interface TextareaQuestion {
  id: number;
  kind: 'textarea';
  question: string;
  field: BriefingDnaField;
  placeholder: string;
}

export interface DualFieldQuestion {
  id: number;
  kind: 'dual';
  question: string;
  fields: [
    { field: BriefingDnaField; label: string; placeholder: string },
    { field: BriefingDnaField; label: string; placeholder: string },
  ];
}

export type BriefingDnaQuestion = TextareaQuestion | DualFieldQuestion;

// Copy exata do briefing — não reescrever, não corrigir, não adicionar explicações.
export const BRIEFING_DNA_QUESTIONS: BriefingDnaQuestion[] = [
  {
    id: 1,
    kind: 'textarea',
    question: 'Qual problema real você resolve? Para quem?',
    field: 'problemaReal',
    placeholder:
      'Ex.: ajudamos empresas locais que têm dificuldade em transformar presença digital em vendas...',
  },
  {
    id: 2,
    kind: 'textarea',
    question:
      'Quem compra hoje? Descreva 2-3 clientes reais (quem é, idade, características, profissão, o que a fez procurar você, como chegou até você, o que a fez fechar)',
    field: 'clientesAtuais',
    placeholder:
      'Ex.: Cliente 1 — 35 anos, empresária, chegou por indicação, procurava...\n\nCliente 2 — ...',
  },
  {
    id: 3,
    kind: 'textarea',
    question: 'Qual é a objeção mais comum na hora da venda?',
    field: 'objecaoVenda',
    placeholder: 'Ex.: preço, prazo, "preciso pensar", comparação com concorrentes...',
  },
  {
    id: 4,
    kind: 'dual',
    question: 'Ticket médio e meta de faturamento:',
    fields: [
      { field: 'ticketMedio', label: 'Ticket médio', placeholder: 'Ex.: R$ 2.500' },
      { field: 'metaFaturamento', label: 'Meta de faturamento', placeholder: 'Ex.: R$ 80.000/mês' },
    ],
  },
  {
    id: 5,
    kind: 'textarea',
    question: 'Na sua visão, quem são seus 3 principais concorrentes?',
    field: 'concorrentes',
    placeholder: 'Ex.:\n1. Nome / @instagram / site\n2. Nome / @instagram / site\n3. Nome / @instagram / site',
  },
  {
    id: 6,
    kind: 'textarea',
    question: 'O que você entrega de diferencial?',
    field: 'diferencial',
    placeholder:
      'Ex.: atendimento próximo, método próprio, velocidade, especialização, experiência diferenciada...',
  },
  {
    id: 7,
    kind: 'textarea',
    question: 'Founder story: Qual é a origem/história real por trás do negócio?',
    field: 'founderStory',
    placeholder:
      'Ex.: como o negócio nasceu, o que motivou a criação, quem começou e qual história trouxe a marca até aqui...',
  },
  {
    id: 8,
    kind: 'textarea',
    question: 'Se já teve agência: O que já tentou em marketing e não funcionou?',
    field: 'marketingAnterior',
    placeholder:
      'Ex.: tráfego pago, produção de conteúdo, agência anterior, campanhas, promoções... Se nunca teve agência, pode informar aqui.',
  },
];

export const TOTAL_BRIEFING_DNA_QUESTIONS = BRIEFING_DNA_QUESTIONS.length;
