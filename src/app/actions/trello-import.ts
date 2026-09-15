'use server';

/**
 * Importa um board do Trello (a partir dos JSONs exportados pelo Trello)
 * para o kanban do Bound.
 *
 * Cria colunas a partir das listas do Trello e tasks a partir dos cards.
 * Limites: 50 listas e 500 cards por import (defesa contra exports acidentais).
 *
 * Permissão: SOMENTE admin pode executar.
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  parseTrelloExport, inferColumnMetadata,
} from '@/lib/trello/parse';
import type { TrelloCard, TrelloLabel, TrelloMember } from '@/lib/trello/types';
import type { TaskType, TaskPriority } from '@/lib/supabase/database.types';

const MAX_LISTS = 50;
const MAX_CARDS = 500;
const MAX_TITLE_LENGTH = 200;

export interface ImportTrelloInput {
  clientId: string;
  files: {
    boards: File | null;
    lists: File | null;
    cards: File | null;
    labels: File | null;
    members: File | null;
  };
  boardId?: string;
  priority: TaskPriority;
  type: TaskType;
  /** IDs de cards Trello que o usuário desmarcou no preview. */
  excludedCardIds?: string[];
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

type TrelloCardType = TrelloCard;

function resolveAssignee(
  card: TrelloCardType,
  membersById: Record<string, TrelloMember>,
  profileIndex: Map<string, string>
): { assigneeId: string | null; matched: boolean } {
  const memberIds = card.idMembers ?? [];
  for (const mid of memberIds) {
    const member = membersById[mid];
    if (!member) continue;

    // 1) tentar fullName
    if (member.fullName) {
      const norm = normalizeName(member.fullName);
      const pid = profileIndex.get(norm);
      if (pid) return { assigneeId: pid, matched: true };
    }

    // 2) tentar username (converter espaços para kebab-case)
    if (member.username) {
      const norm = normalizeName(member.username.replace(/\s+/g, '-'));
      const pid = profileIndex.get(norm);
      if (pid) return { assigneeId: pid, matched: true };
    }
  }
  return { assigneeId: null, matched: false };
}

export async function importTrelloBoardAction(input: ImportTrelloInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileData } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const role = (profileData as { role?: string } | null)?.role;
  if (role !== 'admin') {
    return { error: 'Apenas administradores podem importar boards' };
  }

  // 1) Parsear os JSONs
  let parsed;
  try {
    parsed = await parseTrelloExport({
      files: input.files,
      boardId: input.boardId,
    });
  } catch (e) {
    if (e instanceof Error) return { error: e.message };
    return { error: 'Erro ao processar JSON do Trello' };
  }

  const targetBoard = input.boardId
    ? parsed.boards.find((b) => b.id === input.boardId)
    : parsed.boards[0];
  if (!targetBoard) return { error: 'Board não encontrado no JSON' };

  const boardLists = parsed.listsByBoardId[targetBoard.id] ?? [];
  if (boardLists.length === 0) return { error: 'Board sem listas válidas' };
  if (boardLists.length > MAX_LISTS) {
    return { error: `Limite excedido: máximo ${MAX_LISTS} listas por import` };
  }

  // 2) Coletar cards e aplicar exclusões
  const excluded = new Set(input.excludedCardIds ?? []);
  const allCards: { listId: string; card: TrelloCardType }[] = [];
  for (const list of boardLists) {
    const cards = parsed.cardsByListId[list.id] ?? [];
    for (const card of cards) {
      if (excluded.has(card.id)) continue;
      allCards.push({ listId: list.id, card });
    }
  }
  if (allCards.length > MAX_CARDS) {
    return { error: `Limite excedido: máximo ${MAX_CARDS} cards por import` };
  }
  if (allCards.length === 0) return { error: 'Nenhum card para importar' };

  // 3) Resolver assignees: carregar profiles (collaborator + admin) e indexar por nome normalizado
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase as any)
    .from('profiles')
    .select('id, full_name')
    .in('role', ['collaborator', 'admin']);
  const profileIndex = new Map<string, string>();
  for (const p of (profiles as Array<{ id: string; full_name: string | null }>) ?? []) {
    if (p.full_name) profileIndex.set(normalizeName(p.full_name), p.id);
  }

  // 4) Descobrir próxima position para kanban_columns (não conflitar com existentes)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingCols } = await (supabase as any)
    .from('kanban_columns')
    .select('position')
    .order('position', { ascending: false })
    .limit(1);
  const maxPosition = (existingCols?.[0]?.position as number | undefined) ?? 0;
  let nextPosition = maxPosition + 1;

  // 5) Criar colunas (em batch)
  const columnsToInsert = boardLists.map((list) => {
    const meta = inferColumnMetadata(list.name);
    return {
      name: list.name.slice(0, 60).trim() || 'Lista',
      color: meta.color,
      position: nextPosition++,
      is_final: meta.isFinal,
      created_by: user.id,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: createdColumns, error: colsError } = await (supabase as any)
    .from('kanban_columns')
    .insert(columnsToInsert)
    .select('id, name');

  if (colsError) return { error: colsError.message };

  // Mapear lista Trello → coluna criada
  const listIdToColumnId: Record<string, string> = {};
  boardLists.forEach((list, idx) => {
    listIdToColumnId[list.id] = (createdColumns as Array<{ id: string; name: string }>)[idx].id;
  });

  // 6) Preparar tasks com assignee resolvido
  const truncate = (s: string, max: number) =>
    s.length > max ? s.slice(0, max - 1) + '…' : s;

  const toIsoDate = (iso: string | null | undefined): string | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  };

  let assigneesMatched = 0;
  let assigneesUnmatched = 0;

  const tasksToInsert = allCards.map(({ listId, card }) => {
    const { assigneeId, matched } = resolveAssignee(
      card,
      parsed.membersById,
      profileIndex
    );
    if (card.idMembers && card.idMembers.length > 0) {
      if (matched) assigneesMatched++; else assigneesUnmatched++;
    }
    return {
      title: truncate(card.name.trim() || 'Sem título', MAX_TITLE_LENGTH),
      description: card.desc?.trim() || null,
      type: input.type,
      client_id: input.clientId,
      column_id: listIdToColumnId[listId],
      assignee_id: assigneeId,
      due_date: toIsoDate(card.due),
      priority: input.priority,
      sprint_week: null,
      created_by: user.id,
    };
  });

  // 7) Inserir tasks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: createdTasks, error: tasksError } = await (supabase as any)
    .from('tasks')
    .insert(tasksToInsert)
    .select('id');

  if (tasksError) {
    return {
      error: tasksError.message,
      partial: {
        columnsCreated: createdColumns?.length ?? 0,
        tasksCreated: 0,
      },
    };
  }

  // 8) Inserir labels (task_labels) em batch
  const boardLabels = parsed.labelsByBoardId[targetBoard.id] ?? [];
  const labelRows = allCards.flatMap(({ card }, idx) => {
    const taskId = (createdTasks as Array<{ id: string }>)[idx].id;
    return (card.idLabels ?? [])
      .map((lid) => boardLabels.find((l) => l.id === lid))
      .filter((l): l is TrelloLabel => !!l)
      .map((l) => ({
        task_id: taskId,
        name: l.name || 'Sem nome',
        color: l.color,
      }));
  });
  let labelsCreated = 0;
  if (labelRows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: labelsError } = await (supabase as any).from('task_labels').insert(labelRows);
    if (labelsError) {
      // Erro não crítico: tasks já criadas, labels podem ser reimportadas depois
      console.error('[importTrello] labels insert failed:', labelsError.message);
    } else {
      labelsCreated = labelRows.length;
    }
  }

  // 9) Log de atividade (importação em massa — 1 linha por task, leve)
  const activityRows = ((createdTasks as Array<{ id: string }>) ?? []).map((t, idx) => ({
    task_id: t.id,
    actor_id: user.id,
    action: 'importou do Trello',
    new_value: allCards[idx]?.card.name?.slice(0, 80) ?? null,
  }));
  if (activityRows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('task_activity').insert(activityRows);
  }

  revalidatePath('/admin/kanban');
  revalidatePath('/admin/tasks');

  return {
    success: true,
    boardName: targetBoard.name,
    columnsCreated: createdColumns?.length ?? 0,
    tasksCreated: createdTasks?.length ?? 0,
    labelsCreated,
    assigneesMatched,
    assigneesUnmatched,
  };
}
