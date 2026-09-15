'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { submitBriefingDnaAction } from '@/app/actions/briefing-dna';
import { BRIEFING_DNA_QUESTIONS, TOTAL_BRIEFING_DNA_QUESTIONS } from '@/lib/briefing-dna/questions';
import { clearBriefingDnaDraft, loadBriefingDnaDraft, saveBriefingDnaDraft } from '@/lib/briefing-dna/storage';
import { EMPTY_BRIEFING_DNA_ANSWERS, type BriefingDnaAnswers, type BriefingDnaField } from '@/lib/briefing-dna/types';
import { BrandPanel } from './BrandPanel';
import { ProgressBar } from './ProgressBar';
import { QuestionStep } from './QuestionStep';
import { FormNavigation } from './FormNavigation';
import { CompletionScreen } from './CompletionScreen';
import styles from './briefing-dna.module.css';

const FIELD_ERROR_MESSAGE = 'Esse campo é obrigatório.';

export function BriefingForm() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<BriefingDnaAnswers>(EMPTY_BRIEFING_DNA_ANSWERS);
  const [errors, setErrors] = useState<Partial<Record<BriefingDnaField, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const titleRef = useRef<HTMLHeadingElement>(null);

  // Restaura rascunho salvo (respostas + etapa) ao carregar a página. O
  // draft mora em localStorage (indisponível no server), então só pode ser
  // lido depois da 1ª renderização — daí o setState direto no efeito, para
  // não gerar hydration mismatch entre servidor e cliente.
  useEffect(() => {
    const draft = loadBriefingDnaDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers(draft.answers);
      setStep(Math.min(Math.max(draft.step, 1), TOTAL_BRIEFING_DNA_QUESTIONS));
    }
    setIsHydrated(true);
  }, []);

  // Salva o rascunho a cada mudança, exceto antes da restauração inicial
  // (evita sobrescrever um rascunho salvo com o estado vazio do 1º render).
  useEffect(() => {
    if (!isHydrated) return;
    saveBriefingDnaDraft({ step, answers });
  }, [isHydrated, step, answers]);

  // Move o foco para o título da pergunta/tela atual ao navegar.
  useEffect(() => {
    titleRef.current?.focus();
  }, [step, isSubmitted]);

  const currentQuestion = BRIEFING_DNA_QUESTIONS[step - 1];
  const fieldsInStep: BriefingDnaField[] =
    currentQuestion.kind === 'textarea' ? [currentQuestion.field] : currentQuestion.fields.map((f) => f.field);

  function handleChange(field: BriefingDnaField, value: string) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    if (value.trim() && errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function validateCurrentStep(): boolean {
    const nextErrors: Partial<Record<BriefingDnaField, string>> = {};
    for (const field of fieldsInStep) {
      if (!answers[field].trim()) {
        nextErrors[field] = FIELD_ERROR_MESSAGE;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmitStep(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateCurrentStep()) return;

    if (step < TOTAL_BRIEFING_DNA_QUESTIONS) {
      setStep((s) => s + 1);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await submitBriefingDnaAction(answers);

    if ('error' in result && result.error) {
      setSubmitError(result.error);
      setIsSubmitting(false);
      return;
    }

    clearBriefingDnaDraft();
    setIsSubmitting(false);
    setIsSubmitted(true);
  }

  function handleBack() {
    if (isSubmitting || step === 1) return;
    setErrors({});
    setStep((s) => s - 1);
  }

  return (
    <div className={styles.root}>
      <main className={styles.app}>
        <BrandPanel />

        <section className={styles.panel}>
          <ProgressBar currentStep={step} total={TOTAL_BRIEFING_DNA_QUESTIONS} isComplete={isSubmitted} />

          {isSubmitted ? (
            <div className={styles.stage}>
              <CompletionScreen titleRef={titleRef} />
            </div>
          ) : (
            <form className={styles.stage} onSubmit={handleSubmitStep} noValidate>
              <div className={styles.stageInner}>
                <QuestionStep
                  key={currentQuestion.id}
                  question={currentQuestion}
                  stepLabel={`${String(step).padStart(2, '0')} / ${String(TOTAL_BRIEFING_DNA_QUESTIONS).padStart(2, '0')}`}
                  answers={answers}
                  errors={errors}
                  onChange={handleChange}
                  titleRef={titleRef}
                />
                <FormNavigation
                  showBack={step > 1}
                  onBack={handleBack}
                  isLast={step === TOTAL_BRIEFING_DNA_QUESTIONS}
                  isSubmitting={isSubmitting}
                  submitError={submitError}
                />
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
