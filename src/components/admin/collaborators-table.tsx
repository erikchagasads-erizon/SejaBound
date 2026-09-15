'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Search, UserPlus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { removeCollaboratorAction } from '@/app/actions/collaborators';
import type { ProfileRow, ClientRow } from '@/lib/supabase/types';

interface CollaboratorWithClients extends ProfileRow {
  clients: Pick<ClientRow, 'id' | 'name' | 'primary_color'>[];
}

interface CollaboratorsTableProps {
  collaborators: CollaboratorWithClients[];
  locale: string;
}

export function CollaboratorsTable({ collaborators, locale }: CollaboratorsTableProps) {
  const [query, setQuery] = useState('');
  const [removeTarget, setRemoveTarget] = useState<CollaboratorWithClients | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = collaborators.filter((c) =>
    (c.full_name ?? '').toLowerCase().includes(query.toLowerCase())
  );

  const handleRemove = () => {
    if (!removeTarget) return;
    startTransition(async () => {
      const result = await removeCollaboratorAction(removeTarget.id);
      if (result?.error) setError(result.error);
      else setRemoveTarget(null);
    });
  };

  return (
    <div className="collab-table-wrap">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Buscar colaborador..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            id="collaborators-search"
          />
        </div>
        <Link href={`/${locale}/admin/collaborators/invite`} className="btn-primary" id="btn-invite-collaborator">
          <UserPlus size={16} />
          Convidar colaborador
        </Link>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>{query ? 'Nenhum colaborador encontrado.' : 'Nenhum colaborador cadastrado ainda.'}</p>
          {!query && (
            <Link href={`/${locale}/admin/collaborators/invite`} className="btn-primary" style={{ marginTop: 12 }}>
              <UserPlus size={16} /> Convidar primeiro colaborador
            </Link>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Colaborador</th>
                <th>Clientes Vinculados</th>
                <th>Idioma</th>
                <th>Membro desde</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((collab) => (
                <tr key={collab.id}>
                  <td>
                    <div className="collab-cell">
                      <div className="collab-avatar">
                        {collab.avatar_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={collab.avatar_url} alt={collab.full_name ?? ''} />
                        ) : (
                          <span>{(collab.full_name?.[0] ?? '?').toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="collab-name">{collab.full_name ?? '—'}</div>
                        <div className="collab-role">Colaborador</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {collab.clients.length === 0 ? (
                      <span className="text-muted">Nenhum</span>
                    ) : (
                      <div className="client-tags">
                        {collab.clients.map((cl) => (
                          <span
                            key={cl.id}
                            className="client-tag"
                            style={{
                              background: cl.primary_color ? `${cl.primary_color}22` : 'hsl(var(--bg-elevated))',
                              color: cl.primary_color ?? 'hsl(var(--text-secondary))',
                              borderColor: cl.primary_color ?? 'hsl(var(--border-default))',
                            }}
                          >
                            {cl.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="text-secondary">{collab.preferred_lang === 'en' ? '🇺🇸 EN' : '🇧🇷 PT'}</td>
                  <td className="text-secondary">
                    {new Date(collab.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td>
                    <button
                      className="action-btn delete"
                      title="Revogar acesso"
                      onClick={() => { setError(null); setRemoveTarget(collab); }}
                      id={`remove-collab-${collab.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Revogar acesso"
        description={`Tem certeza que deseja revogar o acesso de "${removeTarget?.full_name}"? O usuário perderá acesso ao sistema.`}
        confirmLabel="Revogar"
        variant="danger"
        loading={isPending}
      />

      <style jsx>{`
        .collab-table-wrap { display: flex; flex-direction: column; gap: 20px; }

        .table-toolbar {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
        }

        .search-box { position: relative; flex: 1; min-width: 200px; }
        .search-icon {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: hsl(var(--text-muted)); pointer-events: none;
        }
        .search-input {
          width: 100%; height: 40px; padding: 0 14px 0 38px;
          background: hsl(var(--bg-elevated)); border: 1px solid hsl(var(--border-default));
          border-radius: var(--radius-md); color: hsl(var(--text-primary));
          font-size: 14px; font-family: inherit; outline: none; transition: all 0.2s;
        }
        .search-input:focus {
          border-color: hsl(var(--brand-primary));
          box-shadow: 0 0 0 3px hsl(var(--brand-primary) / 0.12);
        }
        .search-input::placeholder { color: hsl(var(--text-muted)); }

        .btn-primary {
          display: flex; align-items: center; gap: 8px; padding: 9px 18px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          color: white; font-size: 13.5px; font-weight: 600;
          text-decoration: none; border: none; cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .error-banner {
          padding: 12px 16px; background: hsl(var(--error) / 0.1);
          border: 1px solid hsl(var(--error) / 0.3); border-radius: var(--radius-md);
          color: hsl(var(--error)); font-size: 14px;
        }

        .table-container {
          overflow-x: auto; border-radius: var(--radius-lg);
          border: 1px solid hsl(var(--border-subtle));
        }

        .data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .data-table thead th {
          padding: 12px 16px; text-align: left; font-size: 12px;
          font-weight: 600; color: hsl(var(--text-muted));
          text-transform: uppercase; letter-spacing: 0.06em;
          background: hsl(var(--bg-elevated));
          border-bottom: 1px solid hsl(var(--border-subtle)); white-space: nowrap;
        }
        .data-table tbody tr { border-bottom: 1px solid hsl(var(--border-subtle)); transition: background 0.15s; }
        .data-table tbody tr:last-child { border-bottom: none; }
        .data-table tbody tr:hover { background: hsl(var(--bg-elevated) / 0.5); }
        .data-table td { padding: 14px 16px; color: hsl(var(--text-primary)); vertical-align: middle; }

        .collab-cell { display: flex; align-items: center; gap: 10px; }

        .collab-avatar {
          width: 36px; height: 36px; border-radius: 50%; overflow: hidden;
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .collab-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .collab-name { font-weight: 600; color: hsl(var(--text-primary)); font-size: 14px; }
        .collab-role { font-size: 12px; color: hsl(var(--text-muted)); }

        .client-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .client-tag {
          font-size: 11.5px; font-weight: 600; padding: 2px 8px;
          border-radius: 20px; border: 1px solid;
        }

        .text-secondary { color: hsl(var(--text-secondary)); }
        .text-muted { color: hsl(var(--text-muted)); }

        .action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; border-radius: var(--radius-sm);
          border: none; cursor: pointer; transition: all 0.2s;
          background: hsl(var(--bg-elevated)); color: hsl(var(--text-muted));
        }
        .action-btn.delete:hover { background: hsl(var(--error) / 0.12); color: hsl(var(--error)); }

        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 60px 24px; text-align: center; color: hsl(var(--text-muted));
        }
        .empty-icon { font-size: 40px; }
      `}</style>
    </div>
  );
}
