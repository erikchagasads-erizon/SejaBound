import { Montserrat } from 'next/font/google';

// Tipografia principal do briefing DNA BND. Escopada a esta rota via CSS
// variable própria (--font-briefing-sans) — não sobrescreve a --font-sans
// (Inter) usada no resto do portal.
export const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-briefing-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

// "Amoresa" (tipografia de destaque) ainda não foi disponibilizada no
// projeto — nenhum arquivo/licença web foi encontrado. Para não inventar
// a fonte, o destaque usa um fallback serifado elegante (ver
// briefing-dna.module.css, var(--bnd-font-display)).
//
// Quando o arquivo da Amoresa (licenciado para web, .woff2) estiver
// disponível:
//   1. Salve-o em `src/app/[locale]/briefing-dna/fonts/amoresa.woff2`.
//   2. Troque este arquivo para usar `next/font/local`, por exemplo:
//
//   import localFont from 'next/font/local';
//   export const amoresa = localFont({
//     src: './fonts/amoresa.woff2',
//     variable: '--font-briefing-display',
//     display: 'swap',
//   });
//
//   3. Aplique `amoresa.variable` junto de `montserrat.variable` no
//      wrapper em page.tsx.
