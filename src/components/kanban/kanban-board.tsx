'use client';

import { useState, useTransition } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { TASK_TYPE_LABELS, PRIORITY_COLORS } from '@/lib/utils';

interface Column {
  id: string;
  name: string;
  color: string | null;
  position: number;
  is_final: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  column_id: string;
  priority: string;
  due_date: string | null;
  clients?: { name: string } | null;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  columns: Column[];
  tasks: Task[];
}

export function KanbanBoard({ columns, tasks: initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [, startTransition] = useTransition();
  const supabase = createClient();
  const router = useRouter();

  const getTasksForColumn = (columnId: string) =>
    tasks.filter(t => t.column_id === columnId);

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newColumnId = destination.droppableId;
    const task = tasks.find(t => t.id === draggableId);
    if (!task || task.column_id === newColumnId) return;

    // Optimistic update
    setTasks(prev =>
      prev.map(t => t.id === draggableId ? { ...t, column_id: newColumnId } : t)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { column_id: newColumnId };
    const { error } = await supabase
      .from('tasks')
      .update(updateData as never)
      .eq('id', draggableId);



    if (error) {
      // Revert on error
      setTasks(initialTasks);
    } else {
      // Log activity
      const newCol = columns.find(c => c.id === newColumnId);
      const oldCol = columns.find(c => c.id === task.column_id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        task_id: draggableId,
        actor_id: (await supabase.auth.getUser()).data.user!.id,
        action: 'moved_to',
        old_value: oldCol?.name ?? '',
        new_value: newCol?.name ?? '',
      };
      await supabase.from('task_activity').insert(insertData as never);



      startTransition(() => router.refresh());
    }
  };

  const getPriorityColor = (priority: string) => PRIORITY_COLORS[priority] ?? '#6B7280';

  const typeInfo = (type: string) => TASK_TYPE_LABELS[type] ?? { emoji: '📌', pt: type };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-scroll">
        <div className="kanban-columns">
          {columns.map(column => {
            const colTasks = getTasksForColumn(column.id);
            return (
              <div key={column.id} className="kanban-col">
                {/* Column header */}
                <div className="col-header">
                  <div className="col-dot" style={{ background: column.color ?? '#6B7280' }} />
                  <span className="col-name">{column.name}</span>
                  <span className="col-count">{colTasks.length}</span>
                </div>

                {/* Droppable */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`col-body ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                    >
                      {colTasks.length === 0 && (
                        <div className="col-empty">Sem tarefas</div>
                      )}
                      {colTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              id={`kanban-task-${task.id}`}
                              className={`task-card card ${snapshot.isDragging ? 'dragging' : ''}`}
                            >
                              {/* Type + priority */}
                              <div className="task-card-header">
                                <span className="task-type-emoji" title={typeInfo(task.type).pt}>
                                  {typeInfo(task.type).emoji}
                                </span>
                                <div
                                  className="priority-dot"
                                  title={task.priority}
                                  style={{ background: getPriorityColor(task.priority) }}
                                />
                              </div>

                              {/* Title */}
                              <p className="task-card-title">{task.title}</p>

                              {/* Client */}
                              {task.clients?.name && (
                                <span className="task-card-client">{task.clients.name}</span>
                              )}

                              {/* Footer */}
                              <div className="task-card-footer">
                                {task.due_date && (
                                  <span className="task-card-due">
                                    <Calendar size={10} />
                                    {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                  </span>
                                )}
                                {task.profiles?.full_name && (
                                  <span className="task-card-assignee">
                                    {task.profiles.full_name.split(' ')[0]}
                                  </span>
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
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .kanban-scroll { overflow-x: auto; padding-bottom: 16px; }

        .kanban-columns {
          display: flex; gap: 14px; min-width: max-content; align-items: flex-start;
        }

        .kanban-col { width: 280px; display: flex; flex-direction: column; gap: 8px; }

        .col-header {
          display: flex; align-items: center; gap: 8px; padding: 10px 12px;
          background: hsl(var(--bg-surface)); border: 1px solid hsl(var(--border-subtle));
          border-radius: var(--radius-md); position: sticky; top: 0;
        }

        .col-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

        .col-name { font-size: 13px; font-weight: 600; color: hsl(var(--text-primary)); flex: 1; }

        .col-count {
          min-width: 22px; height: 22px; border-radius: 999px;
          background: hsl(var(--bg-elevated)); color: hsl(var(--text-secondary));
          font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center;
        }

        .col-body {
          min-height: 80px; display: flex; flex-direction: column; gap: 8px;
          padding: 4px; border-radius: var(--radius-md); transition: background 0.15s;
        }

        .col-body.drag-over { background: hsl(var(--brand-primary) / 0.06); }

        .col-empty {
          text-align: center; padding: 20px; font-size: 12px; color: hsl(var(--text-muted));
          border: 1px dashed hsl(var(--border-subtle)); border-radius: var(--radius-md);
        }

        .task-card {
          padding: 14px; cursor: grab; user-select: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .task-card:active { cursor: grabbing; }

        .task-card.dragging {
          transform: rotate(2deg) scale(1.02);
          box-shadow: var(--shadow-lg);
          border-color: hsl(var(--brand-primary) / 0.4);
        }

        .task-card-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
        }

        .task-type-emoji { font-size: 16px; }

        .priority-dot { width: 8px; height: 8px; border-radius: 50%; }

        .task-card-title {
          font-size: 13px; font-weight: 600; color: hsl(var(--text-primary));
          line-height: 1.4; margin-bottom: 4px;
        }

        .task-card-client {
          font-size: 11px; color: hsl(var(--text-muted)); display: block; margin-bottom: 10px;
        }

        .task-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          border-top: 1px solid hsl(var(--border-subtle)); padding-top: 8px; margin-top: 4px;
        }

        .task-card-due {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: hsl(var(--text-muted));
        }

        .task-card-assignee {
          font-size: 11px; color: hsl(var(--brand-primary)); font-weight: 600;
        }
      `}</style>
    </DragDropContext>
  );
}
