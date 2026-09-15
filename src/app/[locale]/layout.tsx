import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  title: {
    default: 'Bound Marketing — Portal',
    template: '%s | Bound Marketing',
  },
  description: 'Portal de gestão de projetos e aprovações da Bound Marketing.',
  robots: 'noindex',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <Providers locale={locale} messages={messages}>
      {children}
    </Providers>
  );
}
