'use client';

import { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
  children?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-box animate-scale-in">
        {/* Header */}
        <div className="modal-header">
          {isDanger && (
            <div className="modal-danger-icon">
              <AlertTriangle size={18} />
            </div>
          )}
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {description && <p className="modal-description">{description}</p>}
          {children}
        </div>

        {/* Footer */}
        {onConfirm && (
          <div className="modal-footer">
            <button className="btn-ghost" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </button>
            <button
              className={isDanger ? 'btn-danger' : 'btn-primary'}
              onClick={onConfirm}
              disabled={loading}
              id="modal-confirm-btn"
            >
              {loading ? <span className="spinner" /> : confirmLabel}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
        }

        .modal-box {
          background: hsl(var(--bg-surface));
          border: 1px solid hsl(var(--border-default));
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 480px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scale-in {
          animation: scale-in 0.18s ease;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 24px 16px;
          border-bottom: 1px solid hsl(var(--border-subtle));
        }

        .modal-danger-icon {
          width: 34px;
          height: 34px;
          min-width: 34px;
          border-radius: var(--radius-md);
          background: hsl(var(--error) / 0.12);
          color: hsl(var(--error));
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-title {
          font-size: 16px;
          font-weight: 700;
          color: hsl(var(--text-primary));
          flex: 1;
        }

        .modal-close {
          background: transparent;
          border: none;
          color: hsl(var(--text-muted));
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .modal-close:hover {
          background: hsl(var(--bg-elevated));
          color: hsl(var(--text-primary));
        }

        .modal-body {
          padding: 20px 24px;
        }

        .modal-description {
          font-size: 14px;
          color: hsl(var(--text-secondary));
          line-height: 1.6;
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 24px;
          background: hsl(var(--bg-elevated) / 0.5);
          border-top: 1px solid hsl(var(--border-subtle));
        }

        .btn-ghost {
          padding: 8px 16px;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid hsl(var(--border-default));
          color: hsl(var(--text-secondary));
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-ghost:hover:not(:disabled) {
          background: hsl(var(--bg-elevated));
          color: hsl(var(--text-primary));
        }
        .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-primary {
          padding: 8px 18px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          border: none;
          color: white;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-danger {
          padding: 8px 18px;
          border-radius: var(--radius-md);
          background: hsl(var(--error));
          border: none;
          color: white;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-danger:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
