import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale = 'pt-BR') {
  return new Date(date).toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date, locale = 'pt-BR') {
  return new Date(date).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export function getCurrentSprintWeek(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

export const TASK_TYPE_LABELS: Record<string, { pt: string; en: string; emoji: string }> = {
  design:       { pt: 'Design Gráfico',      en: 'Graphic Design',   emoji: '🎨' },
  social_media: { pt: 'Redes Sociais',       en: 'Social Media',     emoji: '📱' },
  traffic:      { pt: 'Tráfego Pago',        en: 'Paid Traffic',     emoji: '📊' },
  content:      { pt: 'Conteúdo',            en: 'Content',          emoji: '✍️' },
  web:          { pt: 'Desenvolvimento Web', en: 'Web Development',  emoji: '🌐' },
  video:        { pt: 'Vídeo/Motion',        en: 'Video/Motion',     emoji: '🎬' },
  photo:        { pt: 'Foto/Filmagem',       en: 'Photo/Filming',    emoji: '📷' },
  report:       { pt: 'Relatório',           en: 'Report',           emoji: '📄' },
  other:        { pt: 'Outro',               en: 'Other',            emoji: '📌' },
};

export const PRIORITY_COLORS: Record<string, string> = {
  low:    'hsl(158, 64%, 52%)',
  medium: 'hsl(38, 92%, 50%)',
  high:   'hsl(24, 94%, 60%)',
  urgent: 'hsl(0, 84%, 60%)',
};
