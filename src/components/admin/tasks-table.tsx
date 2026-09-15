'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { deleteTaskAction } from '@/app/actions/tasks';
import type { TaskRow, ClientRow, ProfileRow, KanbanColumnRow } from '@/lib/supabase/types';

type TaskWithRelations = TaskRow & {
  clients: Pick<ClientRow, 'name'> | null;
  profiles: Pick<ProfileRow, 'full_name'> | null;
  kanban_columns: Pick<KanbanColumnRow, 'name'> | null;
};

interface TasksTableProps {
  tasks: TaskWithRelations[];
  locale: string;
}

export function TasksTable({ tasks, locale }: TasksTableProps) {
  const [query, setQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TaskWithRelations | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = tasks.filter((t) => {
    const matchQuery =
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      (t.clients?.name ?? '').toLowerCase().includes(query.toLowerCase());
    const matchPriority = !filterPriority || t.priority === filterPriority;
    const matchType = !filterType || t.type === filterType;
    return matchQuery && matchPriority && matchType;
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteTaskAction(deleteTarget.id);
      if (result?.error) setError(result.error);
      else setDeleteTarget(null);
    });
  };

  return (
    <div className="tasks-table-wrap">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Buscar tarefa..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            id="tasks-search"
          />
        </div>

        <select
          className="filter-select"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          id="filter-priority"
        >
          <option value="">Todas prioridades</option>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>

        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          id="filter-type"
        >
          <option value="">Todos os tipos</option>
          <option value="design">Design</option>
          <option value="social_media">Social</option>
          <option value="traffic">Tráfego</option>
          <option value="content">Conteúdo</option>
          <option value="web">Web</option>
          <option value="video">Vídeo</option>
          <option value="photo">Foto</option>
          <option value="report">Relatório</option>
          <option value="other">Outro</option>
        </select>

        <Link href={`/${locale}/admin/tasks/new`} className="btn-primary" id="btn-new-task">
          <Plus size={16} />
          Nova Tarefa
        </Link>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="results-count">
        {filtered.length} tarefa{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>{query || filterPriority || filterType ? 'Nenhuma tarefa encontrada com esses filtros.' : 'Nenhuma tarefa cadastrada ainda.'}</p>
          {!(query || filterPriority || filterType) && (
            <Link href={`/${locale}/admin/tasks/new`} className="btn-primary" style={{ marginTop: 12 }}>
              <Plus size={16} /> Criar primeira tarefa
            </Link>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarefa</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Prioridade</th>
                <th>Coluna</th>
                <th>Responsável</th>
                <th>Prazo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                return (
                  <tr key={task.id}>
                    <td>
                      <span className="task-title">{task.title}</span>
                      {task.sprint_week && (
                        <span className="sprint-tag">{task.sprint_week}</span>
                      )}
                    </td>
                    <td className="text-secondary">{task.clients?.name ?? '—'}</td>
                    <td><Badge value={task.type} variant="type" /></td>
                    <td><Badge value={task.priority} variant="priority" /></td>
                    <td className="text-secondary">{task.kanban_columns?.name ?? '—'}</td>
                    <td className="text-secondary">{task.profiles?.full_name ?? '—'}</td>
                    <td>
                      {task.due_date ? (
                        <span className={isOverdue ? 'overdue' : 'text-secondary'}>
                          {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <div className="action-group">
                        <Link
                          href={`/${locale}/admin/tasks/${task.id}/edit`}
                          className="action-btn"
                          title="Editar"
                          id={`edit-task-${task.id}`}
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          className="action-btn delete"
                          title="Excluir"
                          onClick={() => { setError(null); setDeleteTarget(task); }}
                          id={`delete-task-${task.id}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir tarefa"
        description={`Excluir "${deleteTarget?.title}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={isPending}
      />

      <style jsx>{`
        .tasks-table-wrap { display: flex; flex-direction: column; gap: 16px; }

        .table-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

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
        .search-input:focus { border-color: hsl(var(--brand-primary)); box-shadow: 0 0 0 3px hsl(var(--brand-primary) / 0.12); }
        .search-input::placeholder { color: hsl(var(--text-muted)); }

        .filter-select {
          height: 40px; padding: 0 12px; background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border-default)); border-radius: var(--radius-md);
          color: hsl(var(--text-primary)); font-size: 13.5px; font-family: inherit;
          outline: none; cursor: pointer; transition: all 0.2s;
        }
        .filter-select:focus { border-color: hsl(var(--brand-primary)); }

        .btn-primary {
          display: flex; align-items: center; gap: 8px; padding: 9px 18px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          color: white; font-size: 13.5px; font-weight: 600;
          text-decoration: none; border: none; cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .results-count { font-size: 13px; color: hsl(var(--text-muted)); }

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
          padding: 11px 14px; text-align: left; font-size: 11.5px;
          font-weight: 600; color: hsl(var(--text-muted)); text-transform: uppercase;
          letter-spacing: 0.06em; background: hsl(var(--bg-elevated));
          border-bottom: 1px solid hsl(var(--border-subtle)); white-space: nowrap;
        }
        .data-table tbody tr { border-bottom: 1px solid hsl(var(--border-subtle)); transition: background 0.15s; }
        .data-table tbody tr:last-child { border-bottom: none; }
        .data-table tbody tr:hover { background: hsl(var(--bg-elevated) / 0.5); }
        .data-table td { padding: 12px 14px; color: hsl(var(--text-primary)); vertical-align: middle; }

        .task-title { font-weight: 600; display: block; }
        .sprint-tag { font-size: 11px; color: hsl(var(--text-muted)); margin-top: 2px; display: block; }

        .text-secondary { color: hsl(var(--text-secondary)); }
        .text-muted { color: hsl(var(--text-muted)); }
        .overdue { color: hsl(var(--error)); font-weight: 600; }

        .action-group { display: flex; align-items: center; gap: 5px; }
        .action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: var(--radius-sm); border: none;
          cursor: pointer; transition: all 0.2s; text-decoration: none;
          background: hsl(var(--bg-elevated)); color: hsl(var(--text-muted));
        }
        .action-btn:hover { background: hsl(var(--bg-hover)); color: hsl(var(--text-primary)); }
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
