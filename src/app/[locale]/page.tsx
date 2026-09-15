import { redirect } from 'next/navigation';

// Redireciona raiz da locale para o login.
// A locale já foi resolvida pelo segmento dinâmico; usamos 'pt' como padrão.
export default function LocaleRootPage() {
  redirect('/pt/login');
}
