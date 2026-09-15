'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, ChevronUp, Trash2, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FileUpload } from '@/components/collaborator/file-upload';
import { deleteDeliveryAction } from '@/app/actions/deliveries';
import type { DeliveryRow, DeliveryFileRow } from '@/lib/supabase/types';

export type DeliveryWithFiles = DeliveryRow & {
  delivery_files: DeliveryFileRow[];
};

interface DeliveryCardProps {
  delivery: DeliveryWithFiles;
  taskId: string;
  defaultExpanded?: boolean;
  onDeleted: (id: string) => void;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock size={13} />,
  approved: <CheckCircle size={13} />,
  revision_requested: <RefreshCw size={13} />,
};

export function DeliveryCard({
  delivery,
  taskId,
  defaultExpanded = false,
  onDeleted,
}: DeliveryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteDeliveryAction(delivery.id, taskId);
      if (!result?.error) {
        setShowDeleteModal(false);
        onDeleted(delivery.id);
      }
    });
  };

  return (
    <>
      <article
        className={`dcard ${expanded ? 'dcard--expanded' : ''} dcard--${delivery.status}`}
        id={`delivery-card-${delivery.id}`}
      >
        {/* ── Header ── */}
        <div
          className="dcard__header"
          onClick={() => setExpanded(v => !v)}
          role="button"
          aria-expanded={expanded}
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
        >
          <div className="dcard__header-left">
            <span className="dcard__status-icon">
              {STATUS_ICON[delivery.status] ?? <Clock size={13} />}
            </span>
            <Badge value={delivery.status} variant="delivery" />
            <span className="dcard__title">{delivery.title}</span>
          </div>

          <div className="dcard__header-right">
            <span className="dcard__file-count">
              {delivery.delivery_files.length} arq
            </span>

            <button
              className="dcard__delete-btn"
              aria-label="Excluir entrega"
              id={`delete-delivery-btn-${delivery.id}`}
              onClick={e => { e.stopPropagation(); setShowDeleteModal(true); }}
            >
              <Trash2 size={13} />
            </button>

            <span className="dcard__chevron" aria-hidden>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>
        </div>

        {/* ── Body (expanded) ── */}
        {expanded && (
          <div className="dcard__body">
            {/* Description */}
            {delivery.description && (
              <p className="dcard__desc">{delivery.description}</p>
            )}

            {/* Client feedback (revision) */}
            {delivery.status === 'revision_requested' && delivery.client_feedback && (
              <div className="dcard__feedback">
                <span className="dcard__feedback-label">💬 Feedback do cliente</span>
                <p className="dcard__feedback-text">{delivery.client_feedback}</p>
              </div>
            )}

            {/* Approval notice */}
            {delivery.status === 'approved' && (
              <div className="dcard__approved-badge">
                <CheckCircle size={14} />
                Entrega aprovada pelo cliente
                {delivery.reviewed_at && (
                  <span> em {new Date(delivery.reviewed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                )}
              </div>
            )}

            {/* Files section */}
            <div className="dcard__files-section">
              <h4 className="dcard__section-label">Arquivos</h4>
              <FileUpload
                deliveryId={delivery.id}
                taskId={taskId}
                existingFiles={delivery.delivery_files}
                readOnly={delivery.status === 'approved'}
              />
            </div>

            {/* Footer meta */}
            <div className="dcard__meta">
              <Clock size={11} />
              Criado em {new Date(delivery.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </div>
          </div>
        )}
      </article>

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Excluir entrega"
        description={`Excluir "${delivery.title}"? Os arquivos vinculados também serão removidos permanentemente.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={isPending}
      />

      <style jsx>{`
        .dcard {
          background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border-subtle));
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .dcard--expanded {
          border-color: hsl(var(--brand-primary) / 0.3);
          box-shadow: var(--shadow-sm);
        }

        .dcard--approved  { border-left: 3px solid hsl(var(--success)); }
        .dcard--revision_requested { border-left: 3px solid hsl(var(--error)); }
        .dcard--pending   { border-left: 3px solid hsl(var(--warning)); }

        /* Header */
        .dcard__header {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 13px 16px;
          cursor: pointer;
          user-select: none;
          transition: background 0.15s;
          gap: 12px;
        }
        .dcard__header:hover { background: hsl(var(--bg-hover) / 0.4); }

        .dcard__header-left {
          display: flex; align-items: center;
          gap: 9px; min-width: 0; flex: 1;
        }

        .dcard__status-icon {
          display: flex; align-items: center;
          color: hsl(var(--text-muted)); flex-shrink: 0;
        }

        .dcard__title {
          font-size: 14px; font-weight: 600;
          color: hsl(var(--text-primary));
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .dcard__header-right {
          display: flex; align-items: center;
          gap: 8px; flex-shrink: 0;
        }

        .dcard__file-count {
          font-size: 11.5px; color: hsl(var(--text-muted));
          background: hsl(var(--bg-surface));
          padding: 2px 8px; border-radius: 999px;
          border: 1px solid hsl(var(--border-subtle));
        }

        .dcard__delete-btn {
          display: flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 6px;
          border: none; background: transparent;
          color: hsl(var(--text-muted));
          cursor: pointer; transition: all 0.15s;
          opacity: 0;
        }
        .dcard__header:hover .dcard__delete-btn { opacity: 1; }
        .dcard__delete-btn:hover {
          background: hsl(var(--error) / 0.12);
          color: hsl(var(--error));
        }

        .dcard__chevron {
          display: flex; align-items: center;
          color: hsl(var(--text-muted));
        }

        /* Body */
        .dcard__body {
          display: flex; flex-direction: column; gap: 14px;
          padding: 14px 16px 16px;
          border-top: 1px solid hsl(var(--border-subtle));
          animation: fadeIn 0.18s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .dcard__desc {
          font-size: 13.5px; color: hsl(var(--text-secondary));
          line-height: 1.65; margin: 0;
        }

        /* Feedback box */
        .dcard__feedback {
          padding: 12px 14px;
          background: hsl(var(--error) / 0.06);
          border: 1px solid hsl(var(--error) / 0.2);
          border-radius: var(--radius-md);
          display: flex; flex-direction: column; gap: 6px;
        }
        .dcard__feedback-label {
          font-size: 11.5px; font-weight: 700;
          color: hsl(var(--error));
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .dcard__feedback-text {
          font-size: 13.5px; color: hsl(var(--text-secondary));
          line-height: 1.55; margin: 0; font-style: italic;
        }

        /* Approved notice */
        .dcard__approved-badge {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 14px;
          background: hsl(var(--success) / 0.08);
          border: 1px solid hsl(var(--success) / 0.2);
          border-radius: var(--radius-md);
          font-size: 13px; font-weight: 600;
          color: hsl(var(--success));
        }

        /* Files */
        .dcard__files-section {
          display: flex; flex-direction: column; gap: 8px;
        }
        .dcard__section-label {
          font-size: 11.5px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em;
          color: hsl(var(--text-muted));
        }

        /* Meta */
        .dcard__meta {
          display: flex; align-items: center; gap: 5px;
          font-size: 11.5px; color: hsl(var(--text-muted));
          padding-top: 4px;
          border-top: 1px solid hsl(var(--border-subtle));
        }
      `}</style>
    </>
  );
}
