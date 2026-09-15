'use client';

import { useState, useTransition } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Plus, Trash2, Check, X, Edit2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import {
  createColumnAction,
  updateColumnAction,
  deleteColumnAction,
  reorderColumnsAction,
} from '@/app/actions/kanban';
import type { KanbanColumnRow } from '@/lib/supabase/types';

interface KanbanColumnEditorProps {
  initialColumns: KanbanColumnRow[];
}

const PRESET_COLORS = [
  '#3D2817', // cacau (brand-primary)
  '#A87653', // caramelo (brand-accent)
  '#3A4A2E', // verde-musgo (brand-secondary)
  '#4F8B5A', // verde-musgo fechado (success)
  '#D69138', // âmbar (warning)
  '#B8553E', // terracota (error)
  '#6B5B4D', // chocolate (text-secondary)
  '#8A7868', // borda forte (border-strong)
];

export function KanbanColumnEditor({ initialColumns }: KanbanColumnEditorProps) {
  const [columns, setColumns] = useState(
    [...initialColumns].sort((a, b) => a.position - b.position)
  );
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<KanbanColumnRow | null>(null);

  // Add new column state
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newIsFinal, setNewIsFinal] = useState(false);

  // Edit inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [error, setError] = useState<string | null>(null);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(columns);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const withPositions = reordered.map((col, i) => ({ ...col, position: i + 1 }));
    setColumns(withPositions);
    startTransition(async () => {
      await reorderColumnsAction(withPositions.map(({ id, position }) => ({ id, position })));
    });
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const result = await createColumnAction({
        name: newName.trim(),
        color: newColor,
        position: columns.length + 1,
        is_final: newIsFinal,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        // Optimistic: refetch via router.refresh is done by revalidatePath
        setAdding(false);
        setNewName('');
        setNewColor(PRESET_COLORS[0]);
        setNewIsFinal(false);
        // Force page data refresh
        window.location.reload();
      }
    });
  };

  const handleEditSave = (id: string) => {
    if (!editName.trim()) return;
    startTransition(async () => {
      const result = await updateColumnAction(id, { name: editName.trim() });
      if (result?.error) setError(result.error);
      else {
        setColumns((prev) => prev.map((c) => c.id === id ? { ...c, name: editName } : c));
        setEditingId(null);
      }
    });
  };

  const handleToggleFinal = (col: KanbanColumnRow) => {
    startTransition(async () => {
      await updateColumnAction(col.id, { is_final: !col.is_final });
      setColumns((prev) => prev.map((c) => c.id === col.id ? { ...c, is_final: !c.is_final } : c));
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteColumnAction(deleteTarget.id);
      if (result?.error) setError(result.error);
      else {
        setColumns((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    });
  };

  return (
    <div className="col-editor">
      {error && <div className="error-banner" role="alert">{error}</div>}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="kanban-columns">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="col-list"
            >
              {columns.map((col, index) => (
                <Draggable key={col.id} draggableId={col.id} index={index}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`col-item ${snapshot.isDragging ? 'dragging' : ''}`}
                    >
                      <span {...drag.dragHandleProps} className="drag-handle">
                        <GripVertical size={18} />
                      </span>

                      <div
                        className="col-color-dot"
                        style={{ background: col.color ?? '#3D2817' }}
                      />

                      {editingId === col.id ? (
                        <input
                          className="col-edit-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave(col.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span className="col-name">{col.name}</span>
                      )}

                      {col.is_final && (
                        <span className="final-badge">Final</span>
                      )}

                      <div className="col-actions">
                        {editingId === col.id ? (
                          <>
                            <button
                              className="icon-action save"
                              onClick={() => handleEditSave(col.id)}
                              disabled={isPending}
                              title="Salvar"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="icon-action cancel"
                              onClick={() => setEditingId(null)}
                              title="Cancelar"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="icon-action"
                              onClick={() => { setEditingId(col.id); setEditName(col.name); }}
                              title="Renomear"
                              id={`edit-col-${col.id}`}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              className={`icon-action ${col.is_final ? 'active' : ''}`}
                              onClick={() => handleToggleFinal(col)}
                              title={col.is_final ? 'Remover status final' : 'Marcar como coluna final'}
                              id={`final-col-${col.id}`}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="icon-action danger"
                              onClick={() => { setError(null); setDeleteTarget(col); }}
                              title="Excluir"
                              id={`delete-col-${col.id}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add new */}
      {adding ? (
        <div className="add-form">
          <input
            className="col-edit-input"
            placeholder="Nome da coluna..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
            autoFocus
            id="new-column-name"
          />
          <div className="preset-colors">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`color-dot ${newColor === c ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setNewColor(c)}
                type="button"
              />
            ))}
          </div>
          <label className="final-toggle">
            <input
              type="checkbox"
              checked={newIsFinal}
              onChange={(e) => setNewIsFinal(e.target.checked)}
              id="new-column-is-final"
            />
            Coluna final (concluído)
          </label>
          <div className="add-actions">
            <button className="btn-ghost" onClick={() => setAdding(false)} disabled={isPending}>Cancelar</button>
            <button className="btn-primary" onClick={handleAdd} disabled={isPending || !newName.trim()} id="add-column-submit">
              Adicionar
            </button>
          </div>
        </div>
      ) : (
        <button className="add-column-btn" onClick={() => setAdding(true)} id="add-column-btn">
          <Plus size={16} />
          Adicionar coluna
        </button>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir coluna"
        description={`Excluir "${deleteTarget?.name}"? As tarefas nesta coluna não serão excluídas, mas perderão sua coluna.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={isPending}
      />

      <style jsx>{`
        .col-editor { display: flex; flex-direction: column; gap: 12px; }

        .error-banner {
          padding: 12px 16px; background: hsl(var(--error) / 0.1);
          border: 1px solid hsl(var(--error) / 0.3); border-radius: var(--radius-md);
          color: hsl(var(--error)); font-size: 14px;
        }

        .col-list { display: flex; flex-direction: column; gap: 8px; }

        .col-item {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border-default)); border-radius: var(--radius-md);
          transition: all 0.2s;
        }
        .col-item.dragging {
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand-primary));
          background: hsl(var(--bg-hover));
        }

        .drag-handle {
          color: hsl(var(--text-muted)); cursor: grab; display: flex;
          align-items: center; flex-shrink: 0;
        }
        .drag-handle:active { cursor: grabbing; }

        .col-color-dot {
          width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0;
        }

        .col-name { flex: 1; font-size: 14px; font-weight: 500; color: hsl(var(--text-primary)); }

        .col-edit-input {
          flex: 1; background: hsl(var(--bg-surface)); border: 1px solid hsl(var(--brand-primary));
          border-radius: var(--radius-sm); padding: 4px 10px;
          color: hsl(var(--text-primary)); font-size: 14px; font-family: inherit; outline: none;
          box-shadow: 0 0 0 3px hsl(var(--brand-primary) / 0.15);
        }

        .final-badge {
          font-size: 11px; font-weight: 700; padding: 2px 7px;
          border-radius: 20px; background: hsl(var(--success) / 0.12);
          color: hsl(var(--success));
        }

        .col-actions { display: flex; align-items: center; gap: 4px; margin-left: auto; }

        .icon-action {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: var(--radius-sm); border: none;
          background: transparent; color: hsl(var(--text-muted)); cursor: pointer; transition: all 0.2s;
        }
        .icon-action:hover { background: hsl(var(--bg-hover)); color: hsl(var(--text-primary)); }
        .icon-action.danger:hover { background: hsl(var(--error) / 0.12); color: hsl(var(--error)); }
        .icon-action.save:hover  { background: hsl(var(--success) / 0.12); color: hsl(var(--success)); }
        .icon-action.active { color: hsl(var(--success)); }
        .icon-action:disabled { opacity: 0.4; cursor: not-allowed; }

        .add-form {
          display: flex; flex-direction: column; gap: 12px;
          padding: 16px; background: hsl(var(--bg-elevated));
          border: 1px dashed hsl(var(--border-default)); border-radius: var(--radius-md);
        }

        .preset-colors { display: flex; gap: 8px; flex-wrap: wrap; }
        .color-dot {
          width: 24px; height: 24px; border-radius: 50%; border: 2px solid transparent;
          cursor: pointer; transition: transform 0.15s;
        }
        .color-dot:hover { transform: scale(1.15); }
        .color-dot.selected { border-color: white; box-shadow: 0 0 0 2px hsl(var(--brand-primary)); }

        .final-toggle {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: hsl(var(--text-secondary)); cursor: pointer;
        }

        .add-actions { display: flex; gap: 8px; justify-content: flex-end; }

        .btn-ghost {
          padding: 7px 14px; border-radius: var(--radius-md);
          background: transparent; border: 1px solid hsl(var(--border-default));
          color: hsl(var(--text-secondary)); font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

        .btn-primary {
          padding: 7px 16px; border-radius: var(--radius-md);
          background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
          border: none; color: white; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .add-column-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; border-radius: var(--radius-md);
          border: 1px dashed hsl(var(--border-default));
          background: transparent; color: hsl(var(--text-muted));
          font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s;
          width: 100%;
        }
        .add-column-btn:hover {
          border-color: hsl(var(--brand-primary));
          color: hsl(var(--brand-primary));
          background: hsl(var(--brand-primary) / 0.05);
        }
      `}</style>
    </div>
  );
}
