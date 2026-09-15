import type { Metadata } from 'next';
import { BriefingForm } from '@/components/briefing-dna/BriefingForm';
import { montserrat } from './fonts';

export const metadata: Metadata = {
  title: 'Briefing DNA BND | Seja Bound',
  description: 'Questionário de diagnóstico — Método DNA BND.',
  robots: { index: false, follow: false },
};

export default function BriefingDnaPage() {
  return (
    <div className={montserrat.variable}>
      <BriefingForm />
    </div>
  );
}
