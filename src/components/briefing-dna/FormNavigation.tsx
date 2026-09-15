import styles from './briefing-dna.module.css';

interface FormNavigationProps {
  showBack: boolean;
  onBack: () => void;
  isLast: boolean;
  isSubmitting: boolean;
  submitError: string | null;
}

export function FormNavigation({ showBack, onBack, isLast, isSubmitting, submitError }: FormNavigationProps) {
  return (
    <div className={styles.actions}>
      {showBack ? (
        <button type="button" className={`${styles.btn} ${styles.btnBack}`} onClick={onBack} disabled={isSubmitting}>
          ← Voltar
        </button>
      ) : (
        <span className={styles.spacer} />
      )}

      <div className={styles.navRight}>
        {submitError && (
          <p className={styles.submitError} role="alert">
            {submitError}
          </p>
        )}
        <button type="submit" className={`${styles.btn} ${styles.btnNext}`} disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : isLast ? 'Concluir →' : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}
