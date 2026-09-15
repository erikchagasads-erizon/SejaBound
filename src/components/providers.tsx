'use client';

import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/auth-context';

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="light"
        enableSystem={false}
        themes={['light', 'dark']}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
