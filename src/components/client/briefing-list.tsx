'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Plus, Send, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { createBriefingAction } from '@/app/actions/briefings';

interface Briefing {
  id: string;
  title: string;
  description: string;
  category: string | null;
  status: string;
  created_at: string;
}

interface Props {
  briefings: Briefing[];
  clientId: string;
  userId: string;
}

const CATEGORIES_PT = [
  'Design Gráfico', 'Redes Sociais', 'Tráfego Pago', 'Conteúdo',
  'Desenvolvimento Web', 'Vídeo/Motion', 'Fotografia', 'Outro',
];

// Cliente vê "Pedido"/"Request". Internamente o recurso continua "briefing".
function getCopy(locale: string) {
  return locale === 'en' ? {
    newButton: 'New Request',
    newFormTitle: 'New Request',
    titleLabel: 'Project Title *',
    titlePlaceholder: 'E.g.: Logo design for product X',
    categoryLabel: 'Category',
    categoryPlaceholder: 'Select a category',
    descriptionLabel: 'Description *',
    descriptionPlaceholder: 'Tell us about the goals, references, deadlines...',
    cancel: 'Cancel',
    submit: 'Send Request',
    emptyTitle: 'No requests submitted yet.',
    emptyHint: 'Click "New Request" to open your first request.',
  } : {
    newButton: 'Novo Pedido',
    newFormTitle: 'Novo Pedido',
    titleLabel: 'Título do Projeto *',
    titlePlaceholder: 'Ex: Criação de logo para produto X',
    categoryLabel: 'Categoria',
    categoryPlaceholder: 'Selecione uma categoria',
    descriptionLabel: 'Descrição *',
    descriptionPlaceholder: 'Conte sobre os objetivos, referências, prazos...',
    cancel: 'Cancelar',
    submit: 'Enviar Pedido',
    emptyTitle: 'Nenhum pedido enviado ainda.',
    emptyHint: 'Clique em "Novo Pedido" para abrir seu primeiro pedido.',
  };
}

export function BriefingList({ briefings, clientId }: Props) {
  const locale = useLocale();
  const copy = getCopy(locale);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await createBriefingAction({
      clientId,
      title,
      description,
      category,
    });

    if ('error' in result && result.error) {
      setErrorMessage(result.error);
    } else {
      setTitle('');
      setDescription('');
      setCategory('');
      setShowForm(false);
      startTransition(() => router.refresh());
    }
    setIsSubmitting(false);
  };

  const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
    open:        { label: 'Aberto',       class: 'status-open' },
    in_progress: { label: 'Em Andamento', class: 'status-in-progress' },
    closed:      { label: 'Concluído',    class: 'status-closed' },
  };

  return (
    <div className="briefing-wrapper">
      {/* New Briefing button */}
      {!showForm && (
        <button
          id="new-briefing-btn"
          className="new-briefing-btn"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} />
          {copy.newButton}
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="card briefing-form animate-fade-in">
          <div className="form-header">
            <h2 className="form-title">{copy.newFormTitle}</h2>
            <button className="close-btn" onClick={() => setShowForm(false)}>
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-body">
            {errorMessage && (
              <div style={{ padding: '8px 12px', background: 'hsl(var(--error)/0.1)', border: '1px solid hsl(var(--error)/0.3)', borderRadius: 'var(--radius-sm)', color: 'hsl(var(--error))', fontSize: 13 }}>
                {errorMessage}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">{copy.titleLabel}</label>
              <input
                id="briefing-title"
                type="text"
                className="form-input"
                placeholder={copy.titlePlaceholder}
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{copy.categoryLabel}</label>
              <select
                id="briefing-category"
                className="form-input"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="">{copy.categoryPlaceholder}</option>
                {CATEGORIES_PT.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{copy.descriptionLabel}</label>
              <textarea
                id="briefing-description"
                className="form-textarea"
                placeholder={copy.descriptionPlaceholder}
                rows={6}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
              <span className="char-count">{description.length} caracteres</span>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowForm(false)}
              >
                {copy.cancel}
              </button>
              <button
                id="submit-briefing"
                type="submit"
                className="btn-submit"
                disabled={isSubmitting || !title.trim() || !description.trim()}
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="spin" />
                ) : (
                  <Send size={16} />
                )}
                {copy.submit}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Briefing list */}
      {briefings.length === 0 && !showForm ? (
        <div className="card empty-state">
          <div style={{ fontSize: 40 }}>📋</div>
          <p>{copy.emptyTitle}</p>
          <span>{copy.emptyHint}</span>
        </div>
      ) : (
        <div className="briefings-list">
          {briefings.map(b => {
            const config = STATUS_CONFIG[b.status] ?? { label: b.status, class: '' };
            return (
              <div key={b.id} id={`briefing-${b.id}`} className="briefing-item card">
                <div className="briefing-header" onClick={() => setExpanded(p => ({ ...p, [b.id]: !p[b.id] }))}>
                  <div className="briefing-meta">
                    <h3 className="briefing-title">{b.title}</h3>
                    <div className="briefing-sub">
                      {b.category && <span className="briefing-category">{b.category}</span>}
                      <span className="briefing-date">{formatDate(b.created_at)}</span>
                    </div>
                  </div>
                  <div className="briefing-right">
                    <span className={`status-chip ${config.class}`}>{config.label}</span>
                    {expanded[b.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
                {expanded[b.id] && (
                  <div className="briefing-body animate-fade-in">
                    <div className="divider" />
                    <p className="briefing-desc">{b.description}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .briefing-wrapper { display: flex; flex-direction: column; gap: 16px; }

        .new-briefing-btn {
          display: flex; align-items: center; gap: 8px; width: fit-content;
          padding: 11px 22px;
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          color: white; border: none; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 600; cursor: pointer;
          box-shadow: var(--shadow-glow-primary); transition: opacity 0.2s, transform 0.15s;
        }
        .new-briefing-btn:hover { opacity: 0.9; transform: translateY(-1px); }

        .briefing-form { padding: 28px; }
        .form-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .form-title { font-size: 17px; font-weight: 700; color: hsl(var(--text-primary)); }
        .close-btn {
          background: hsl(var(--bg-elevated)); border: 1px solid hsl(var(--border-default));
          border-radius: 8px; padding: 6px; color: hsl(var(--text-muted)); cursor: pointer;
          display: flex; transition: all 0.2s;
        }
        .close-btn:hover { color: hsl(var(--text-primary)); }

        .form-body { display: flex; flex-direction: column; gap: 18px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 13px; font-weight: 500; color: hsl(var(--text-secondary)); }
        .form-input, .form-textarea {
          padding: 10px 14px; background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border-default)); border-radius: var(--radius-md);
          color: hsl(var(--text-primary)); font-size: 14px; transition: border-color 0.2s;
          font-family: inherit; width: 100%;
        }
        .form-input:focus, .form-textarea:focus {
          outline: none; border-color: hsl(var(--brand-primary));
          box-shadow: 0 0 0 3px hsl(var(--brand-primary)/0.12);
        }
        .form-textarea { resize: vertical; }
        .char-count { font-size: 11px; color: hsl(var(--text-muted)); text-align: right; }

        .form-actions { display: flex; gap: 10px; justify-content: flex-end; }

        .btn-secondary {
          padding: 10px 20px; border: 1px solid hsl(var(--border-default));
          background: transparent; color: hsl(var(--text-secondary));
          border-radius: var(--radius-md); font-size: 14px; font-weight: 500; cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover { border-color: hsl(var(--brand-primary)); color: hsl(var(--text-primary)); }

        .btn-submit {
          display: flex; align-items: center; gap: 8px; padding: 10px 22px;
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          color: white; border: none; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .empty-state {
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          padding: 48px; text-align: center; color: hsl(var(--text-muted));
        }
        .empty-state p { font-size: 15px; font-weight: 600; color: hsl(var(--text-secondary)); }

        .briefings-list { display: flex; flex-direction: column; gap: 10px; }

        .briefing-item { padding: 0; overflow: hidden; }

        .briefing-header {
          display: flex; align-items: center; gap: 16px; padding: 18px 22px; cursor: pointer;
          transition: background 0.2s;
        }
        .briefing-header:hover { background: hsl(var(--bg-hover)); }

        .briefing-meta { flex: 1; }
        .briefing-title { font-size: 15px; font-weight: 600; color: hsl(var(--text-primary)); margin-bottom: 4px; }
        .briefing-sub { display: flex; align-items: center; gap: 10px; }
        .briefing-category {
          padding: 2px 8px; background: hsl(var(--brand-primary)/0.1); color: hsl(var(--brand-primary));
          border-radius: 999px; font-size: 11px; font-weight: 600;
        }
        .briefing-date { font-size: 12px; color: hsl(var(--text-muted)); }

        .briefing-right { display: flex; align-items: center; gap: 12px; color: hsl(var(--text-muted)); }

        .status-chip {
          padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600;
        }
        .status-open        { background: hsl(var(--info)/0.12);    color: hsl(var(--info)); }
        .status-in-progress { background: hsl(var(--warning)/0.12); color: hsl(var(--warning)); }
        .status-closed      { background: hsl(var(--success)/0.12); color: hsl(var(--success)); }

        .briefing-body { padding: 0 22px 18px; }
        .divider { height: 1px; background: hsl(var(--border-subtle)); margin-bottom: 14px; }
        .briefing-desc { font-size: 13px; color: hsl(var(--text-secondary)); line-height: 1.6; white-space: pre-wrap; }

        .spin { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
