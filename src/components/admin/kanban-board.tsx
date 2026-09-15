'use client';

import { useState, useTransition } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import Link from 'next/link';
import { Edit2, Trash2, User, CalendarDays, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { moveTaskAction, deleteTaskAction } from '@/app/actions/tasks';
import type { KanbanColumnRow, TaskRow, ProfileRow, ClientRow } from '@/lib/supabase/types';

type TaskWithRelations = TaskRow & {
  profiles: Pick<ProfileRow, 'full_name'> | null;
  clients: Pick<ClientRow, 'name' | 'primary_color'> | null;
};

interface KanbanBoardProps {
  columns: KanbanColumnRow[];
  tasksByColumn: Record<string, TaskWithRelations[]>;
  locale: string;
}

export function KanbanBoard({ columns, tasksByColumn, locale }: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<Record<string, TaskWithRelations[]>>(tasksByColumn);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<TaskWithRelations | null>(null);

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    const destColumnName = columns.find((c) => c.id === destCol)?.name ?? '';

    // Optimistic update
    setLocalTasks((prev) => {
      const next = { ...prev };
      const sourceTasks = [...(next[sourceCol] ?? [])];
      const destTasks = sourceCol === destCol ? sourceTasks : [...(next[destCol] ?? [])];

      const [movedTask] = sourceTasks.splice(source.index, 1);

      if (sourceCol === destCol) {
        sourceTasks.splice(destination.index, 0, movedTask);
        next[sourceCol] = sourceTasks;
      } else {
        destTasks.splice(destination.index, 0, { ...movedTask, column_id: destCol });
        next[sourceCol] = sourceTasks;
        next[destCol] = destTasks;
      }

      return next;
    });

    startTransition(async () => {
      await moveTaskAction(draggableId, destCol, destColumnName);
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteTaskAction(deleteTarget.id);
      if (!result?.error) {
        setLocalTasks((prev) => {
          const next = { ...prev };
          const colId = deleteTarget.column_id;
          next[colId] = (next[colId] ?? []).filter((t) => t.id !== deleteTarget.id);
          return next;
        });
        setDeleteTarget(null);
      }
    });
  };

  return (
    <div className="kanban-wrap">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {sortedColumns.map((col) => {
            const tasks = localTasks[col.id] ?? [];
            return (
              <div key={col.id} className="kanban-column">
                {/* Column header */}
                <div className="col-header">
                  <div className="col-title">
                    <div
                      className="col-dot"
                      style={{ background: col.color ?? 'hsl(var(--brand-primary))' }}
                    />
                    <span className="col-name">{col.name}</span>
                    {col.is_final && <span className="final-pill">✓</span>}
                  </div>
                  <span className="col-count">{tasks.length}</span>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`col-body ${snapshot.isDraggingOver ? 'over' : ''}`}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(drag, snap) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              className={`task-card ${snap.isDragging ? 'dragging' : ''}`}
                            >
                              {/* Client color stripe */}
                              <div
                                className="task-stripe"
                                style={{ background: task.clients?.primary_color ?? 'hsl(var(--brand-primary))' }}
                              />

                              <div className="task-body">
                                <div className="task-top">
                                  <Badge value={task.type} variant="type" />
                                  <Badge value={task.priority} variant="priority" />
                                </div>

                                <p className="task-title">{task.title}</p>

                                {task.clients && (
                                  <span className="task-client">{task.clients.name}</span>
                                )}

                                <div className="task-meta">
                                  {task.profiles?.full_name && (
                                    <span className="meta-item">
                                      <User size={11} />
                                      {task.profiles.full_name}
                                    </span>
                                  )}
                                  {task.due_date && (
                                    <span className={`meta-item ${new Date(task.due_date) < new Date() ? 'overdue' : ''}`}>
                                      <CalendarDays size={11} />
                                      {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                    </span>
                                  )}
                                  {task.sprint_week && (
                                    <span className="meta-item">
                                      <Clock size={11} />
                                      {task.sprint_week}
                                    </span>
                                  )}
                                </div>

                                <div className="task-actions">
                                  <Link
                                    href={`/${locale}/admin/tasks/${task.id}/edit`}
                                    className="task-action-btn"
                                    title="Editar"
                                    id={`edit-task-${task.id}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Edit2 size={12} />
                                  </Link>
                                  <button
                                    className="task-action-btn danger"
                                    title="Excluir"
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(task); }}
                                    id={`delete-task-${task.id}`}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {tasks.length === 0 && (
                        <div className="empty-col">
                          Arraste tarefas aqui
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

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
        .kanban-wrap { overflow-x: auto; padding-bottom: 20px; }

        .kanban-board {
          display: flex;
          gap: 16px;
          min-width: max-content;
          align-items: flex-start;
          padding: 4px;
        }

        .kanban-column {
          width: 300px;
          min-width: 300px;
          display: flex;
          flex-direction: column;
          gap: 0;
          background: hsl(var(--bg-surface));
          border: 1px solid hsl(var(--border-subtle));
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .col-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          background: hsl(var(--bg-elevated));
          border-bottom: 1px solid hsl(var(--border-subtle));
        }

        .col-title { display: flex; align-items: center; gap: 8px; }
        .col-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .col-name { font-size: 13.5px; font-weight: 700; color: hsl(var(--text-primary)); }
        .final-pill {
          font-size: 10px; font-weight: 700;
          background: hsl(var(--success) / 0.12); color: hsl(var(--success));
          padding: 1px 6px; border-radius: 20px;
        }
        .col-count {
          font-size: 12px; font-weight: 700;
          background: hsl(var(--bg-hover)); color: hsl(var(--text-muted));
          padding: 2px 8px; border-radius: 20px;
        }

        .col-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          min-height: 120px;
          transition: background 0.2s;
        }
        .col-body.over { background: hsl(var(--brand-primary) / 0.05); }

        .task-card {
          background: hsl(var(--bg-elevated));
          border: 1px solid hsl(var(--border-subtle));
          border-radius: var(--radius-md);
          overflow: hidden;
          cursor: grab;
          transition: all 0.2s;
          display: flex;
        }
        .task-card:hover {
          border-color: hsl(var(--border-default));
          box-shadow: var(--shadow-md);
        }
        .task-card.dragging {
          box-shadow: var(--shadow-lg);
          opacity: 0.95;
          rotate: 1.5deg;
        }

        .task-stripe { width: 4px; flex-shrink: 0; }

        .task-body { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 8px; }

        .task-top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

        .task-title {
          font-size: 13.5px; font-weight: 600; color: hsl(var(--text-primary));
          line-height: 1.4; margin: 0;
        }

        .task-client {
          font-size: 11.5px; color: hsl(var(--text-muted));
        }

        .task-meta {
          display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px;
        }
        .meta-item {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: hsl(var(--text-muted));
        }
        .meta-item.overdue { color: hsl(var(--error)); }

        .task-actions {
          display: flex; gap: 4px; margin-top: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .task-card:hover .task-actions { opacity: 1; }

        .task-action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 6px; border: none;
          background: hsl(var(--bg-hover)); color: hsl(var(--text-muted));
          cursor: pointer; transition: all 0.15s; text-decoration: none;
        }
        .task-action-btn:hover { background: hsl(var(--bg-surface)); color: hsl(var(--text-primary)); }
        .task-action-btn.danger:hover { background: hsl(var(--error) / 0.12); color: hsl(var(--error)); }

        .empty-col {
          display: flex; align-items: center; justify-content: center;
          min-height: 80px; font-size: 12px; color: hsl(var(--text-muted));
          border: 1px dashed hsl(var(--border-subtle)); border-radius: var(--radius-md);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
