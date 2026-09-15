import type { RefObject } from 'react';
import Image from 'next/image';
import styles from './briefing-dna.module.css';

interface CompletionScreenProps {
  titleRef: RefObject<HTMLHeadingElement | null>;
}

export function CompletionScreen({ titleRef }: CompletionScreenProps) {
  return (
    <div className={`${styles.stepWrap} ${styles.stepEnter} ${styles.done}`}>
      <div className={styles.checkIcon} aria-hidden="true">
        <Image src="/brand/logo-bnd.png" alt="" width={220} height={220} className={styles.checkLogo} />
      </div>
      <small className={styles.doneLabel}>Briefing concluído! ✨</small>
      <h2 className={styles.doneTitle} tabIndex={-1} ref={titleRef}>
        Nosso marketing começa na sua história.
      </h2>
      <p className={styles.doneText}>Você traz a essência. A gente transforma em comunicação.</p>
      <p className={styles.doneText}>Obrigada por compartilhar. Agora é só aguardar os próximos passos.</p>
    </div>
  );
}
