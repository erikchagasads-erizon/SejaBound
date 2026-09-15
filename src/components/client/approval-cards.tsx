'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, FileText, Image as ImageIcon, Download, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatDateTime, formatFileSize } from '@/lib/utils';

export interface DeliveryFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
}

export interface Delivery {
  id: string;
  title: string;
  description: string | null;
  status: string;
  client_feedback: string | null;
  created_at: string;
  reviewed_at: string | null;
  tasks: { id: string; title: string; type: string };
  delivery_files: DeliveryFile[];
}

interface Props {
  pending: Delivery[];
  approved: Delivery[];
  revision: Delivery[];
}

type ActiveTab = 'pending' | 'approved' | 'revision';

export function ApprovalCards({ pending, approved, revision }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pending');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const supabase = createClient();

  const deliveries = activeTab === 'pending' ? pending : activeTab === 'approved' ? approved : revision;

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAction = async (deliveryId: string, action: 'approve' | 'revision') => {
    setActionLoading(prev => ({ ...prev, [deliveryId]: true }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'revision_requested',
      client_feedback: feedbacks[deliveryId] ?? null,
      reviewed_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('deliveries')
      .update(updateData as never)
      .eq('id', deliveryId);

    if (!error) {
      // Trigger background email notification
      try {
        fetch('/api/notifications/delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            delivery_id: deliveryId,
            action: action === 'approve' ? 'approved' : 'revision_requested',
            feedback: feedbacks[deliveryId] ?? undefined,
          }),
        }).catch(err => console.error('[Notification dispatch failed]', err));
      } catch (err) {
        console.error('[Notification dispatch error]', err);
      }

      startTransition(() => router.refresh());
    }
    setActionLoading(prev => ({ ...prev, [deliveryId]: false }));
  };

  const isImage = (mime: string | null) => mime?.startsWith('image/') ?? false;

  const getFileIcon = (mime: string | null) => {
    if (isImage(mime)) return <ImageIcon size={14} />;
    return <FileText size={14} />;
  };

  const TABS: { key: ActiveTab; label: string; count: number }[] = [
    { key: 'pending',  label: 'Aguardando',  count: pending.length },
    { key: 'approved', label: 'Aprovados',   count: approved.length },
    { key: 'revision', label: 'Ajustes',     count: revision.length },
  ];

  return (
    <div className="approval-wrapper">
      {/* Tab bar */}
      <div className="approval-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            id={`approval-tab-${tab.key}`}
            className={`approval-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {deliveries.length === 0 ? (
        <div className="empty-approvals card">
          <div className="empty-emoji">
            {activeTab === 'pending' ? '🎉' : activeTab === 'approved' ? '✅' : '🔄'}
          </div>
          <p className="empty-title">
            {activeTab === 'pending' ? 'Tudo em dia! Nenhuma entrega aguardando.' :
             activeTab === 'approved' ? 'Nenhuma entrega aprovada ainda.' :
             'Nenhum ajuste solicitado.'}
          </p>
        </div>
      ) : (
        <div className="cards-grid">
          {deliveries.map(delivery => (
            <div
              key={delivery.id}
              id={`delivery-card-${delivery.id}`}
              className={`delivery-card card ${delivery.status}`}
            >
              {/* Card header */}
              <div className="delivery-header">
                <div className="delivery-status-dot" />
                <div className="delivery-info">
                  <h3 className="delivery-title">{delivery.title}</h3>
                  <span className="delivery-task">📁 {delivery.tasks?.title}</span>
                </div>
                <button
                  className="expand-btn"
                  onClick={() => toggle(delivery.id)}
                  aria-label="Expandir"
                >
                  {expanded[delivery.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Status badge */}
              <div className="delivery-badges">
                <span className={`status-badge-lg status-${delivery.status}`}>
                  {delivery.status === 'pending' && '⏳ Aguardando Aprovação'}
                  {delivery.status === 'approved' && '✅ Aprovado'}
                  {delivery.status === 'revision_requested' && '🔄 Ajustes Solicitados'}
                </span>
                <span className="delivery-date">
                  {formatDateTime(delivery.created_at)}
                </span>
              </div>

              {delivery.description && (
                <p className="delivery-desc">{delivery.description}</p>
              )}

              {/* Files preview */}
              {delivery.delivery_files.length > 0 && (
                <div className="files-section">
                  <span className="files-label">Arquivos ({delivery.delivery_files.length})</span>
                  <div className="files-grid">
                    {delivery.delivery_files.map(file => (
                      <div key={file.id} className="file-item">
                        {isImage(file.mime_type) ? (
                          <div className="file-preview-img">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={file.file_url} alt={file.file_name} />
                          </div>
                        ) : (
                          <div className="file-preview-doc">
                            {getFileIcon(file.mime_type)}
                          </div>
                        )}
                        <div className="file-meta">
                          <span className="file-name">{file.file_name}</span>
                          {file.file_size && (
                            <span className="file-size">{formatFileSize(file.file_size)}</span>
                          )}
                        </div>
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-download"
                          aria-label="Baixar arquivo"
                          id={`download-file-${file.id}`}
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expanded action panel — only for pending */}
              {delivery.status === 'pending' && expanded[delivery.id] && (
                <div className="action-panel animate-fade-in">
                  <div className="divider" />
                  <label className="action-label">
                    Comentário (opcional — necessário ao pedir ajustes)
                  </label>
                  <textarea
                    id={`feedback-${delivery.id}`}
                    className="feedback-textarea"
                    placeholder="Descreva o que precisa ser ajustado..."
                    rows={3}
                    value={feedbacks[delivery.id] ?? ''}
                    onChange={e => setFeedbacks(prev => ({ ...prev, [delivery.id]: e.target.value }))}
                  />
                  <div className="action-buttons">
                    <button
                      id={`approve-btn-${delivery.id}`}
                      className="btn-approve"
                      onClick={() => handleAction(delivery.id, 'approve')}
                      disabled={actionLoading[delivery.id]}
                    >
                      {actionLoading[delivery.id] ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Aprovar entrega
                    </button>
                    <button
                      id={`revision-btn-${delivery.id}`}
                      className="btn-revision"
                      onClick={() => handleAction(delivery.id, 'revision')}
                      disabled={actionLoading[delivery.id] || !feedbacks[delivery.id]?.trim()}
                    >
                      <XCircle size={16} />
                      Pedir ajustes
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback shown for revision_requested */}
              {delivery.status === 'revision_requested' && delivery.client_feedback && (
                <div className="feedback-display">
                  <span className="feedback-label">Seu feedback:</span>
                  <p className="feedback-text">&ldquo;{delivery.client_feedback}&rdquo;</p>
                </div>
              )}

              {/* Expand trigger for pending */}
              {delivery.status === 'pending' && !expanded[delivery.id] && (
                <button
                  className="review-trigger"
                  onClick={() => toggle(delivery.id)}
                  id={`review-trigger-${delivery.id}`}
                >
                  Revisar e responder →
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .approval-wrapper { display: flex; flex-direction: column; gap: 20px; }

        .approval-tabs {
          display: flex; gap: 4px;
          background: hsl(var(--bg-elevated)); border-radius: var(--radius-md); padding: 4px;
          width: fit-content;
        }

        .approval-tab {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px; border: none; border-radius: 8px;
          font-size: 13px; font-weight: 500; cursor: pointer;
          background: transparent; color: hsl(var(--text-muted));
          transition: all 0.2s;
        }

        .approval-tab.active {
          background: hsl(var(--bg-surface)); color: hsl(var(--text-primary));
          box-shadow: var(--shadow-sm);
        }

        .tab-count {
          min-width: 20px; height: 20px; border-radius: 999px;
          background: hsl(var(--bg-elevated)); font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          color: hsl(var(--text-secondary));
        }

        .approval-tab.active .tab-count {
          background: hsl(var(--brand-primary)/0.15); color: hsl(var(--brand-primary));
        }

        .empty-approvals {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 48px; text-align: center;
        }

        .empty-emoji { font-size: 40px; }
        .empty-title { font-size: 14px; color: hsl(var(--text-secondary)); }

        .cards-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 16px;
        }

        @media (max-width: 640px) { .cards-grid { grid-template-columns: 1fr; } }

        .delivery-card { padding: 22px; display: flex; flex-direction: column; gap: 14px; }

        .delivery-card.approved { border-color: hsl(var(--success)/0.3); }
        .delivery-card.revision_requested { border-color: hsl(var(--error)/0.3); }
        .delivery-card.pending { border-color: hsl(var(--warning)/0.3); }

        .delivery-header { display: flex; align-items: flex-start; gap: 12px; }

        .delivery-status-dot {
          width: 10px; height: 10px; min-width: 10px; border-radius: 50%; margin-top: 5px;
        }

        .delivery-card.pending .delivery-status-dot    { background: hsl(var(--warning)); box-shadow: 0 0 8px hsl(var(--warning)/0.5); }
        .delivery-card.approved .delivery-status-dot   { background: hsl(var(--success)); }
        .delivery-card.revision_requested .delivery-status-dot { background: hsl(var(--error)); }

        .delivery-info { flex: 1; }
        .delivery-title { font-size: 15px; font-weight: 700; color: hsl(var(--text-primary)); margin-bottom: 3px; }
        .delivery-task { font-size: 12px; color: hsl(var(--text-muted)); }

        .expand-btn {
          background: hsl(var(--bg-elevated)); border: 1px solid hsl(var(--border-default));
          border-radius: 8px; padding: 6px; color: hsl(var(--text-muted)); cursor: pointer;
          display: flex; align-items: center; transition: all 0.2s;
        }

        .expand-btn:hover { color: hsl(var(--text-primary)); border-color: hsl(var(--brand-primary)); }

        .delivery-badges { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        .status-badge-lg {
          padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600;
        }

        .status-badge-lg.status-pending          { background: hsl(var(--warning)/0.12); color: hsl(var(--warning)); }
        .status-badge-lg.status-approved         { background: hsl(var(--success)/0.12); color: hsl(var(--success)); }
        .status-badge-lg.status-revision_requested { background: hsl(var(--error)/0.12); color: hsl(var(--error)); }

        .delivery-date { font-size: 11px; color: hsl(var(--text-muted)); }
        .delivery-desc { font-size: 13px; color: hsl(var(--text-secondary)); line-height: 1.5; }

        /* Files */
        .files-section { display: flex; flex-direction: column; gap: 8px; }
        .files-label { font-size: 12px; font-weight: 600; color: hsl(var(--text-muted)); text-transform: uppercase; letter-spacing: 0.05em; }

        .files-grid { display: flex; flex-direction: column; gap: 6px; }

        .file-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; background: hsl(var(--bg-elevated));
          border-radius: var(--radius-sm); border: 1px solid hsl(var(--border-subtle));
        }

        .file-preview-img {
          width: 36px; height: 36px; border-radius: 4px; overflow: hidden; flex-shrink: 0;
        }
        .file-preview-img img { width: 100%; height: 100%; object-fit: cover; }

        .file-preview-doc {
          width: 36px; height: 36px; border-radius: 4px;
          background: hsl(var(--brand-primary)/0.12); color: hsl(var(--brand-primary));
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }

        .file-meta { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .file-name { font-size: 12px; font-weight: 500; color: hsl(var(--text-primary)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .file-size { font-size: 11px; color: hsl(var(--text-muted)); }

        .file-download {
          padding: 6px; border-radius: 6px; color: hsl(var(--text-muted));
          background: hsl(var(--bg-hover)); transition: all 0.2s;
          display: flex; align-items: center;
        }
        .file-download:hover { color: hsl(var(--brand-primary)); background: hsl(var(--brand-primary)/0.1); }

        /* Action panel */
        .action-panel { display: flex; flex-direction: column; gap: 12px; }

        .divider { height: 1px; background: hsl(var(--border-subtle)); }

        .action-label { font-size: 12px; font-weight: 600; color: hsl(var(--text-secondary)); }

        .feedback-textarea {
          width: 100%; padding: 10px 12px;
          background: hsl(var(--bg-elevated)); border: 1px solid hsl(var(--border-default));
          border-radius: var(--radius-md); color: hsl(var(--text-primary));
          font-size: 13px; resize: vertical;
          transition: border-color 0.2s;
          font-family: inherit;
        }

        .feedback-textarea:focus {
          outline: none; border-color: hsl(var(--brand-primary));
          box-shadow: 0 0 0 3px hsl(var(--brand-primary)/0.12);
        }

        .action-buttons { display: flex; gap: 10px; }

        .btn-approve {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 18px; background: hsl(var(--success));
          color: white; border: none; border-radius: var(--radius-md);
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }
        .btn-approve:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .btn-approve:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-revision {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 11px 18px; background: hsl(var(--error)/0.12);
          color: hsl(var(--error)); border: 1px solid hsl(var(--error)/0.3);
          border-radius: var(--radius-md); font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-revision:hover:not(:disabled) { background: hsl(var(--error)/0.2); }
        .btn-revision:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Feedback display */
        .feedback-display {
          background: hsl(var(--error)/0.06); border: 1px solid hsl(var(--error)/0.2);
          border-radius: var(--radius-md); padding: 12px;
        }
        .feedback-label { font-size: 11px; font-weight: 600; color: hsl(var(--error)); text-transform: uppercase; letter-spacing: 0.05em; }
        .feedback-text { font-size: 13px; color: hsl(var(--text-secondary)); margin-top: 4px; font-style: italic; }

        /* Review trigger */
        .review-trigger {
          background: transparent; border: 1px dashed hsl(var(--warning)/0.4);
          color: hsl(var(--warning)); border-radius: var(--radius-md);
          padding: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; text-align: center;
        }
        .review-trigger:hover { background: hsl(var(--warning)/0.08); border-style: solid; }

        .spin { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
