import styles from './briefing-dna.module.css';

interface ProgressBarProps {
  currentStep: number;
  total: number;
  isComplete: boolean;
}

export function ProgressBar({ currentStep, total, isComplete }: ProgressBarProps) {
  const percent = isComplete ? 100 : (currentStep / total) * 100;
  const counterLabel = isComplete
    ? 'Concluído'
    : `${String(currentStep).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <div className={styles.top}>
      <div className={styles.topRow}>
        <span className={styles.kicker}>DNA BND</span>
        <b className={styles.counter}>{counterLabel}</b>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={isComplete ? total : currentStep}
        aria-label="Progresso do briefing"
      >
        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
