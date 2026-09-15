import Image from 'next/image';
import styles from './briefing-dna.module.css';

export function BrandPanel() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg}>
        <Image
          src="/brand/background-bnd.png"
          alt=""
          fill
          priority
          sizes="(max-width: 880px) 100vw, 610px"
        />
      </div>
      <div className={styles.heroOverlay} aria-hidden="true" />
      <div className={styles.heroRing} aria-hidden="true" />

      <div>
        <div className={styles.logoWrap}>
          <Image
            src="/brand/logo-bnd.png"
            alt="Seja Bound"
            width={220}
            height={220}
            className={styles.logoImg}
            priority
          />
        </div>

        <p className={styles.eyebrow}>Briefing com método DNA BND</p>
        <h1 className={styles.heroTitle}>
          Questionário de <em>diagnóstico.</em>
        </h1>
      </div>
    </section>
  );
}
