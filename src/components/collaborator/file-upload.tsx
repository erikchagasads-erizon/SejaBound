'use client';

import { useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addFileToDeliveryAction, removeFileAction } from '@/app/actions/deliveries';
import { Upload, X, Loader2, ExternalLink } from 'lucide-react';

interface FileRecord {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
}

interface FileUploadProps {
  deliveryId: string;
  taskId: string;
  existingFiles: FileRecord[];
  /** When true, hides upload button and remove buttons (e.g. approved deliveries) */
  readOnly?: boolean;
}

const BUCKET = 'deliveries';

function formatBytes(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime: string | null) {
  if (!mime) return '📎';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.includes('pdf')) return '📄';
  if (mime.includes('zip') || mime.includes('rar')) return '🗜️';
  return '📎';
}

export function FileUpload({ deliveryId, taskId, existingFiles, readOnly = false }: FileUploadProps) {
  const [files, setFiles] = useState<FileRecord[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    setError(null);
    setUploading(true);

    for (const file of selected) {
      const path = `${deliveryId}/${Date.now()}-${file.name}`;

      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError(`Erro ao fazer upload de "${file.name}": ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;

      const result = await addFileToDeliveryAction({
        delivery_id: deliveryId,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        // Optimistic add (server will refetch on next load)
        setFiles((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            file_name: file.name,
            file_url: publicUrl,
            file_size: file.size,
            mime_type: file.type,
          },
        ]);
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (fileId: string) => {
    startTransition(async () => {
      const result = await removeFileAction(fileId, taskId);
      if (!result?.error) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    });
  };

  return (
    <div className="file-upload">
      {error && (
        <div className="upload-error" role="alert">{error}</div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="file-list">
          {files.map((f) => (
            <div key={f.id} className="file-item">
              <span className="file-icon">{fileIcon(f.mime_type)}</span>
              <div className="file-info">
                <a
                  href={f.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-name"
                >
                  {f.file_name}
                  <ExternalLink size={11} />
                </a>
                {f.file_size && (
                  <span className="file-size">{formatBytes(f.file_size)}</span>
                )}
              </div>
              {!readOnly && (
                <button
                  className="file-remove"
                  onClick={() => handleRemove(f.id)}
                  disabled={isPending}
                  title="Remover arquivo"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button — hidden in read-only mode */}
      {!readOnly && (
        <>
          <label className={`upload-btn ${uploading ? 'loading' : ''}`} htmlFor={`upload-${deliveryId}`}>
            {uploading
              ? <><Loader2 size={15} className="spin" /> Enviando...</>
              : <><Upload size={15} /> Adicionar arquivo</>
            }
          </label>
          <input
            ref={inputRef}
            id={`upload-${deliveryId}`}
            type="file"
            multiple
            className="file-input"
            onChange={handleUpload}
            disabled={uploading}
            accept="image/*,video/*,.pdf,.zip,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
        </>
      )}

      <style jsx>{`
        .file-upload { display: flex; flex-direction: column; gap: 10px; }

        .upload-error {
          padding: 8px 12px; background: hsl(var(--error) / 0.1);
          border: 1px solid hsl(var(--error) / 0.3); border-radius: var(--radius-sm);
          color: hsl(var(--error)); font-size: 12.5px;
        }

        .file-list { display: flex; flex-direction: column; gap: 6px; }

        .file-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border-subtle)); border-radius: var(--radius-md);
        }

        .file-icon { font-size: 18px; }

        .file-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }

        .file-name {
          display: flex; align-items: center; gap: 5px;
          font-size: 13px; font-weight: 500; color: hsl(var(--brand-secondary));
          text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          transition: color 0.2s;
        }
        .file-name:hover { color: hsl(var(--text-primary)); }

        .file-size { font-size: 11px; color: hsl(var(--text-muted)); }

        .file-remove {
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 6px; border: none;
          background: transparent; color: hsl(var(--text-muted)); cursor: pointer; transition: all 0.2s;
          flex-shrink: 0;
        }
        .file-remove:hover { background: hsl(var(--error) / 0.12); color: hsl(var(--error)); }
        .file-remove:disabled { opacity: 0.4; cursor: not-allowed; }

        .upload-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 7px 14px; border-radius: var(--radius-md);
          border: 1px dashed hsl(var(--border-default));
          background: transparent; color: hsl(var(--text-muted));
          font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
          align-self: flex-start;
        }
        .upload-btn:hover:not(.loading) {
          border-color: hsl(var(--brand-primary));
          color: hsl(var(--brand-primary));
          background: hsl(var(--brand-primary) / 0.05);
        }
        .upload-btn.loading { opacity: 0.7; cursor: not-allowed; }

        .file-input { display: none; }

        :global(.spin) { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
