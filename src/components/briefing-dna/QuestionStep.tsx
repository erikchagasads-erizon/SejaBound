import type { RefObject } from 'react';
import type { BriefingDnaQuestion } from '@/lib/briefing-dna/questions';
import type { BriefingDnaAnswers, BriefingDnaField } from '@/lib/briefing-dna/types';
import styles from './briefing-dna.module.css';

interface QuestionStepProps {
  question: BriefingDnaQuestion;
  stepLabel: string;
  answers: BriefingDnaAnswers;
  errors: Partial<Record<BriefingDnaField, string>>;
  onChange: (field: BriefingDnaField, value: string) => void;
  titleRef: RefObject<HTMLHeadingElement | null>;
}

export function QuestionStep({ question, stepLabel, answers, errors, onChange, titleRef }: QuestionStepProps) {
  const titleId = `briefing-dna-question-${question.id}`;

  return (
    <div className={`${styles.stepWrap} ${styles.stepEnter}`}>
      <small className={styles.stepLabel}>{stepLabel}</small>
      <h2 id={titleId} className={styles.questionTitle} tabIndex={-1} ref={titleRef}>
        {question.question}
      </h2>

      {question.kind === 'textarea' ? (
        <>
          <textarea
            className={styles.textarea}
            aria-labelledby={titleId}
            aria-invalid={Boolean(errors[question.field])}
            aria-describedby={errors[question.field] ? `${titleId}-error` : undefined}
            placeholder={question.placeholder}
            value={answers[question.field]}
            onChange={(e) => onChange(question.field, e.target.value)}
          />
          {errors[question.field] && (
            <p id={`${titleId}-error`} className={styles.fieldError} role="alert">
              {errors[question.field]}
            </p>
          )}
        </>
      ) : (
        <div className={styles.dualGrid}>
          {question.fields.map((fieldDef) => {
            const inputId = `briefing-dna-field-${fieldDef.field}`;
            return (
              <div className={styles.fieldGroup} key={fieldDef.field}>
                <label className={styles.fieldLabel} htmlFor={inputId}>
                  {fieldDef.label}
                </label>
                <input
                  id={inputId}
                  type="text"
                  className={styles.textInput}
                  placeholder={fieldDef.placeholder}
                  value={answers[fieldDef.field]}
                  aria-invalid={Boolean(errors[fieldDef.field])}
                  aria-describedby={errors[fieldDef.field] ? `${inputId}-error` : undefined}
                  onChange={(e) => onChange(fieldDef.field, e.target.value)}
                />
                {errors[fieldDef.field] && (
                  <p id={`${inputId}-error`} className={styles.fieldError} role="alert">
                    {errors[fieldDef.field]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
