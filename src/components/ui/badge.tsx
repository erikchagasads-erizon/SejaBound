import type { TaskPriority, TaskType, DeliveryStatus, BriefingStatus } from '@/lib/supabase/database.types';

type BadgeVariant = 'priority' | 'type' | 'delivery' | 'briefing' | 'generic';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  low:    { label: 'Baixa',   color: 'hsl(122 39% 38%)', bg: 'hsl(122 39% 38% / 0.12)' },
  medium: { label: 'Média',   color: 'hsl(33 73% 50%)',  bg: 'hsl(33 73% 50% / 0.12)'  },
  high:   { label: 'Alta',    color: 'hsl(23 65% 48%)',  bg: 'hsl(23 65% 48% / 0.12)'  },
  urgent: { label: 'Urgente', color: 'hsl(8 56% 46%)',   bg: 'hsl(8 56% 46% / 0.12)'   },
};

const TYPE_CONFIG: Record<TaskType, { label: string; color: string; bg: string }> = {
  design:       { label: 'Design',       color: 'hsl(25 45% 17%)',   bg: 'hsl(25 45% 17% / 0.12)'   },
  social_media: { label: 'Social',       color: 'hsl(23 36% 49%)',   bg: 'hsl(23 36% 49% / 0.12)'   },
  traffic:      { label: 'Tráfego',      color: 'hsl(33 73% 50%)',   bg: 'hsl(33 73% 50% / 0.12)'   },
  content:      { label: 'Conteúdo',     color: 'hsl(103 22% 23%)',  bg: 'hsl(103 22% 23% / 0.12)'  },
  web:          { label: 'Web',          color: 'hsl(122 39% 38%)',  bg: 'hsl(122 39% 38% / 0.12)'  },
  video:        { label: 'Vídeo',        color: 'hsl(8 56% 46%)',    bg: 'hsl(8 56% 46% / 0.12)'    },
  photo:        { label: 'Foto',         color: 'hsl(26 17% 36%)',   bg: 'hsl(26 17% 36% / 0.12)'   },
  report:       { label: 'Relatório',    color: 'hsl(34 27% 78%)',   bg: 'hsl(34 27% 78% / 0.12)'   },
  other:        { label: 'Outro',        color: 'hsl(26 13% 50%)',   bg: 'hsl(26 13% 50% / 0.12)'   },
};

const DELIVERY_CONFIG: Record<DeliveryStatus, { label: string; color: string; bg: string }> = {
  pending:            { label: 'Pendente',        color: 'hsl(33 73% 50%)',  bg: 'hsl(33 73% 50% / 0.12)'  },
  approved:           { label: 'Aprovado',         color: 'hsl(122 39% 38%)', bg: 'hsl(122 39% 38% / 0.12)' },
  revision_requested: { label: 'Revisão',          color: 'hsl(8 56% 46%)',   bg: 'hsl(8 56% 46% / 0.12)'   },
};

const BRIEFING_CONFIG: Record<BriefingStatus, { label: string; color: string; bg: string }> = {
  open:        { label: 'Aberto',       color: 'hsl(23 36% 49%)',  bg: 'hsl(23 36% 49% / 0.12)'  },
  in_progress: { label: 'Em andamento', color: 'hsl(33 73% 50%)',  bg: 'hsl(33 73% 50% / 0.12)'  },
  closed:      { label: 'Fechado',      color: 'hsl(26 17% 36%)',  bg: 'hsl(26 17% 36% / 0.12)'  },
};

interface BadgeProps {
  value: string;
  variant?: BadgeVariant;
  /** For generic variant: explicit color overrides */
  color?: string;
  bg?: string;
}

export function Badge({ value, variant = 'generic', color, bg }: BadgeProps) {
  let label = value;
  let resolvedColor = color ?? 'hsl(var(--text-secondary))';
  let resolvedBg = bg ?? 'hsl(var(--bg-elevated))';

  if (variant === 'priority' && value in PRIORITY_CONFIG) {
    const c = PRIORITY_CONFIG[value as TaskPriority];
    label = c.label; resolvedColor = c.color; resolvedBg = c.bg;
  } else if (variant === 'type' && value in TYPE_CONFIG) {
    const c = TYPE_CONFIG[value as TaskType];
    label = c.label; resolvedColor = c.color; resolvedBg = c.bg;
  } else if (variant === 'delivery' && value in DELIVERY_CONFIG) {
    const c = DELIVERY_CONFIG[value as DeliveryStatus];
    label = c.label; resolvedColor = c.color; resolvedBg = c.bg;
  } else if (variant === 'briefing' && value in BRIEFING_CONFIG) {
    const c = BRIEFING_CONFIG[value as BriefingStatus];
    label = c.label; resolvedColor = c.color; resolvedBg = c.bg;
  }

  return (
    <span
      className="badge"
      style={{ color: resolvedColor, background: resolvedBg }}
    >
      {label}
    </span>
  );
}
