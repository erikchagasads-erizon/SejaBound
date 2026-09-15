import type { TaskActivityRow, ProfileRow } from '@/lib/supabase/types';

type ActivityWithActor = TaskActivityRow & {
  profiles: Pick<ProfileRow, 'full_name'> | null;
};

interface TaskActivityTimelineProps {
  activities: ActivityWithActor[];
}

const ACTION_ICON: Record<string, string> = {
  'criou a tarefa': '🎉',
  'criou entrega':  '📦',
  'editou a tarefa': '✏️',
  'moveu para':     '↗️',
  'aprovação':      '✅',
  'revisão':        '🔄',
};

function getActionIcon(action: string) {
  for (const [key, icon] of Object.entries(ACTION_ICON)) {
    if (action.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '📌';
}

export function TaskActivityTimeline({ activities }: TaskActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="timeline-empty">
        <span>📋</span>
        <p>Nenhuma atividade registrada.</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {activities.map((item, i) => (
        <div key={item.id} className={`timeline-item ${i === 0 ? 'first' : ''}`}>
          <div className="timeline-icon">{getActionIcon(item.action)}</div>
          <div className="timeline-content">
            <div className="timeline-header">
              <span className="timeline-actor">
                {item.profiles?.full_name ?? 'Usuário'}
              </span>
              <span className="timeline-action">{item.action}</span>
              {item.new_value && (
                <span className="timeline-value">&ldquo;{item.new_value}&rdquo;</span>
              )}
            </div>
            <time className="timeline-time">
              {new Date(item.created_at).toLocaleString('pt-BR', {
                day: '2-digit', month: 'short',
                hour: '2-digit', minute: '2-digit',
              })}
            </time>
          </div>
        </div>
      ))}

    </div>
  );
}
