import type { Metadata } from 'next';
import './globals.css';
import { Inter, Playfair_Display } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets:['latin'],
  variable:'--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets:['latin'],
  variable:'--font-display',
  display: 'swap',
  weight: ['400','500','600','700','800'],
  style: ['normal','italic'],
});

export const metadata: Metadata = {
  title: 'Bound Marketing',
  description: 'Portal de gestão da Bound Marketing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans", inter.variable, playfair.variable)}>
      <body>{children}</body>
    </html>
  );
}
