'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit2, Trash2, Mail } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { deleteClientAction } from '@/app/actions/clients';
import type { ClientRow } from '@/lib/supabase/types';

interface ClientsTableProps {
  clients: ClientRow[];
  locale: string;
}

export function ClientsTable({ clients, locale }: ClientsTableProps) {
  const [query, setQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    (c.company ?? '').toLowerCase().includes(query.toLowerCase()) ||
    (c.contact_email ?? '').toLowerCase().includes(query.toLowerCase())
  );

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteClientAction(deleteTarget.id);
      if (result?.error) {
        setError(result.error);
      } else {
        setDeleteTarget(null);
      }
    });
  };

  return (
    <div className="clients-table-wrap">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Buscar cliente..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            id="clients-search"
          />
        </div>
        <Link href={`/${locale}/admin/clients/new`} className="btn-primary" id="btn-new-client">
          <Plus size={16} />
          Novo Cliente
        </Link>
      </div>

      {error && (
        <div className="error-banner" role="alert">{error}</div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>{query ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</p>
          {!query && (
            <Link href={`/${locale}/admin/clients/new`} className="btn-primary" style={{ marginTop: 12 }}>
              <Plus size={16} /> Adicionar primeiro cliente
            </Link>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Empresa</th>
                <th>E-mail</th>
                <th>Cor</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="client-name-cell">
                      {client.logo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={client.logo_url} alt={client.name} className="client-logo" />
                      ) : (
                        <div
                          className="client-avatar"
                          style={{ background: client.primary_color ?? 'hsl(var(--brand-primary))' }}
                        >
                          {client.name[0].toUpperCase()}
                        </div>
                      )}
                      <span className="client-name">{client.name}</span>
                    </div>
                  </td>
                  <td className="text-secondary">{client.company ?? '—'}</td>
                  <td>
                    {client.contact_email ? (
                      <a href={`mailto:${client.contact_email}`} className="email-link">
                        <Mail size={13} />
                        {client.contact_email}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td>
                    {client.primary_color ? (
                      <div className="color-chip" style={{ background: client.primary_color }}>
                        <span>{client.primary_color}</span>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-secondary">
                    {new Date(client.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <div className="action-group">
                      <Link
                        href={`/${locale}/admin/clients/${client.id}/edit`}
                        className="action-btn edit"
                        title="Editar"
                        id={`edit-client-${client.id}`}
                      >
                        <Edit2 size={14} />
                      </Link>
                      <button
                        className="action-btn delete"
                        title="Excluir"
                        onClick={() => { setError(null); setDeleteTarget(client); }}
                        id={`delete-client-${client.id}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita e removerá todos os dados relacionados.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={isPending}
      />

      <style jsx>{`
        .clients-table-wrap { display: flex; flex-direction: column; gap: 20px; }

        .table-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: hsl(var(--text-muted));
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          height: 40px;
          padding: 0 14px 0 38px;
          background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border-default));
          border-radius: var(--radius-md);
          color: hsl(var(--text-primary));
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s;
        }
        .search-input:focus {
          border-color: hsl(var(--brand-primary));
          box-shadow: 0 0 0 3px hsl(var(--brand-primary) / 0.12);
        }
        .search-input::placeholder { color: hsl(var(--text-muted)); }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          color: white;
          font-size: 13.5px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .error-banner {
          padding: 12px 16px;
          background: hsl(var(--error) / 0.1);
          border: 1px solid hsl(var(--error) / 0.3);
          border-radius: var(--radius-md);
          color: hsl(var(--error));
          font-size: 14px;
        }

        .table-container {
          overflow-x: auto;
          border-radius: var(--radius-lg);
          border: 1px solid hsl(var(--border-subtle));
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .data-table thead th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: hsl(var(--bg-elevated));
          border-bottom: 1px solid hsl(var(--border-subtle));
          white-space: nowrap;
        }

        .data-table tbody tr {
          border-bottom: 1px solid hsl(var(--border-subtle));
          transition: background 0.15s;
        }
        .data-table tbody tr:last-child { border-bottom: none; }
        .data-table tbody tr:hover { background: hsl(var(--bg-elevated) / 0.5); }

        .data-table td {
          padding: 14px 16px;
          color: hsl(var(--text-primary));
          vertical-align: middle;
        }

        .client-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .client-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          object-fit: cover;
        }

        .client-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: white;
        }

        .client-name {
          font-weight: 600;
          color: hsl(var(--text-primary));
        }

        .email-link {
          display: flex;
          align-items: center;
          gap: 5px;
          color: hsl(var(--brand-secondary));
          font-size: 13px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .email-link:hover { color: hsl(var(--text-primary)); }

        .color-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          border-radius: 20px;
        }
        .color-chip span {
          font-size: 11px;
          font-family: monospace;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        .text-secondary { color: hsl(var(--text-secondary)); }
        .text-muted { color: hsl(var(--text-muted)); }

        .action-group { display: flex; align-items: center; gap: 6px; }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          background: hsl(var(--bg-elevated));
          color: hsl(var(--text-muted));
        }
        .action-btn:hover { background: hsl(var(--bg-hover)); color: hsl(var(--text-primary)); }
        .action-btn.delete:hover { background: hsl(var(--error) / 0.12); color: hsl(var(--error)); }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 60px 24px;
          text-align: center;
          color: hsl(var(--text-muted));
        }
        .empty-icon { font-size: 40px; }
      `}</style>
    </div>
  );
}
