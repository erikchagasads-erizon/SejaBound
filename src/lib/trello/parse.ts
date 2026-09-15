/**
 * Parser do JSON exportado pelo Trello.
 * Puro, sem dependências de Supabase/Next — recebe File[] e devolve NormalizedTrelloData.
 *
 * Validação via Zod (já está no package.json). Mensagens de erro são traduzíveis
 * (o caller passa um dict `messages`) — manter este módulo agnóstico de i18n.
 */

import { z } from 'zod';
import type {
  TrelloBoard, TrelloCard, TrelloLabel, TrelloList, TrelloMember,
  NormalizedTrelloData,
} from './types';

// Schemas — validação estrutural, não semântica
const BoardSchema = z.object({
  id: z.string(),
  name: z.string(),
  desc: z.string().optional(),
  closed: z.boolean().optional(),
});

const ListSchema = z.object({
  id: z.string(),
  name: z.string(),
  idBoard: z.string(),
  closed: z.boolean().optional(),
  pos: z.number(),
});

const CardSchema = z.object({
  id: z.string(),
  name: z.string(),
  desc: z.string().optional(),
  idList: z.string(),
  due: z.string().nullable().optional(),
  dueComplete: z.boolean().optional(),
  closed: z.boolean().optional(),
  pos: z.number(),
  idLabels: z.array(z.string()).optional(),
  idMembers: z.array(z.string()).optional(),
});

const LabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  idBoard: z.string(),
});

const MemberSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
});

/** Erro lançado pelo parser quando algo não bate. */
export class TrelloParseError extends Error {
  constructor(public readonly key: string, message: string) {
    super(message);
    this.name = 'TrelloParseError';
  }
}

/** Traduções para as mensagens de erro do parser. */
export interface TrelloParseMessages {
  fileMissing: (file: string) => string;
  invalidJson: (file: string) => string;
  invalidStructure: (file: string) => string;
  noBoards: string;
  noLists: string;
  noCards: string;
  boardNotFound: (id: string) => string;
}

const defaultMessages: TrelloParseMessages = {
  fileMissing: (f) => `Arquivo obrigatório ausente: ${f}`,
  invalidJson: (f) => `JSON inválido em ${f}`,
  invalidStructure: (f) => `Estrutura inesperada em ${f}`,
  noBoards: 'Nenhum board encontrado',
  noLists: 'O board não tem listas',
  noCards: 'O board não tem cards',
  boardNotFound: (id) => `Board não encontrado: ${id}`,
};

export interface ParseTrelloInput {
  files: Record<'boards' | 'lists' | 'cards' | 'labels' | 'members', File | null>;
  boardId?: string;
  messages?: Partial<TrelloParseMessages>;
}

export async function parseTrelloExport(input: ParseTrelloInput): Promise<NormalizedTrelloData> {
  const messages = { ...defaultMessages, ...input.messages };
  const { files, boardId } = input;

  // files obrigatórios: lists e cards. boards é obrigatório se houver mais de 1.
  // Se o usuário não passou boards mas passou boardId, inferimos.
  const listsRaw = files.lists ? await readJson(files.lists) : null;
  const cardsRaw = files.cards ? await readJson(files.cards) : null;

  if (!files.lists) throw new TrelloParseError('fileMissing', messages.fileMissing('lists.json'));
  if (!files.cards) throw new TrelloParseError('fileMissing', messages.fileMissing('cards.json'));

  const lists = parseArray(ListSchema, listsRaw, files.lists.name, messages);
  const cards = parseArray(CardSchema, cardsRaw, files.cards.name, messages);

  // boards.json: tentar ler; se ausente e houver listas, derivar o board a partir delas
  let boards: TrelloBoard[] = [];
  if (files.boards) {
    const boardsRaw = await readJson(files.boards);
    boards = parseArray(BoardSchema, boardsRaw, files.boards.name, messages);
  } else {
    const boardIds = Array.from(new Set(lists.map((l) => l.idBoard)));
    boards = boardIds.map((id) => ({ id, name: `Board ${id.slice(0, 6)}` }));
  }

  if (boards.length === 0) throw new TrelloParseError('noBoards', messages.noBoards);

  // Resolver board alvo
  const targetBoard = boardId
    ? boards.find((b) => b.id === boardId)
    : boards[0];
  if (!targetBoard) {
    throw new TrelloParseError('boardNotFound', messages.boardNotFound(boardId!));
  }

  // Filtrar listas do board (excluindo fechadas)
  const boardLists = lists
    .filter((l) => l.idBoard === targetBoard.id && !l.closed)
    .sort((a, b) => a.pos - b.pos);

  if (boardLists.length === 0) throw new TrelloParseError('noLists', messages.noLists);

  // Filtrar cards que pertencem a listas do board
  const validListIds = new Set(boardLists.map((l) => l.id));
  const boardCards = cards
    .filter((c) => validListIds.has(c.idList) && !c.closed)
    .sort((a, b) => a.pos - b.pos);

  if (boardCards.length === 0) throw new TrelloParseError('noCards', messages.noCards);

  // Labels (opcional)
  let labels: TrelloLabel[] = [];
  if (files.labels) {
    const labelsRaw = await readJson(files.labels);
    labels = parseArray(LabelSchema, labelsRaw, files.labels.name, messages);
  }

  // Members (opcional)
  let members: TrelloMember[] = [];
  if (files.members) {
    const membersRaw = await readJson(files.members);
    members = parseArray(MemberSchema, membersRaw, files.members.name, messages);
  }

  // Montar lookup tables
  const listsByBoardId: Record<string, TrelloList[]> = {};
  for (const l of lists.filter((l) => !l.closed)) {
    (listsByBoardId[l.idBoard] ??= []).push(l);
  }
  for (const key of Object.keys(listsByBoardId)) {
    listsByBoardId[key].sort((a, b) => a.pos - b.pos);
  }

  const cardsByListId: Record<string, TrelloCard[]> = {};
  for (const c of boardCards) {
    (cardsByListId[c.idList] ??= []).push(c);
  }

  const labelsByBoardId: Record<string, TrelloLabel[]> = {};
  for (const l of labels) {
    (labelsByBoardId[l.idBoard] ??= []).push(l);
  }

  const membersById: Record<string, TrelloMember> = {};
  for (const m of members) membersById[m.id] = m;

  return {
    boards,
    listsByBoardId,
    cardsByListId,
    labelsByBoardId,
    membersById,
  };
}

/** Lê um arquivo como JSON, com tratamento de erro amigável. */
async function readJson(file: File): Promise<unknown> {
  const text = await file.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new TrelloParseError('invalidJson', defaultMessages.invalidJson(file.name));
  }
}

/** Valida um array via schema Zod. Lança TrelloParseError se a forma não bater. */
function parseArray<T>(
  schema: z.ZodType<T>,
  raw: unknown,
  fileName: string,
  messages: TrelloParseMessages,
): T[] {
  if (!Array.isArray(raw)) {
    throw new TrelloParseError('invalidStructure', messages.invalidStructure(fileName));
  }
  return raw.map((item, idx) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      throw new TrelloParseError(
        'invalidStructure',
        `${messages.invalidStructure(fileName)} (item #${idx + 1})`,
      );
    }
    return result.data;
  });
}

// ============================================================
// Mapeamento de cores: nome da lista do Trello → cor do Bound
// ============================================================

/** Paleta padrão do Bound (espelha kanban-column-editor.tsx). */
export const TRELLO_COLOR_PRESETS = [
  '#3D2817', // cacau (brand-primary)
  '#A87653', // caramelo (brand-accent)
  '#3A4A2E', // verde-musgo
  '#4F8B5A', // verde
  '#D69138', // âmbar
  '#B8553E', // terracota
  '#6B5B4D', // chocolate
  '#8A7868', // borda forte
  '#6B7280', // cinza
  '#3B82F6', // azul
  '#F59E0B', // âmbar claro
  '#8B5CF6', // roxo
  '#10B981', // verde-final
] as const;

/**
 * Infere a cor da coluna e se é coluna final baseado no nome da lista do Trello.
 * Heurística simples mas eficaz: se a lista tem "done" no nome, é final.
 */
export function inferColumnMetadata(listName: string): { color: string; isFinal: boolean } {
  const n = listName.toLowerCase().trim();

  // Coluna final
  if (/\b(done|conclu[ií]do|completed|finished|entregue|approved|aprovado|published|publicado)\b/.test(n)) {
    return { color: '#10B981', isFinal: true };
  }

  // Cores por padrão semântico
  if (/\b(backlog|to[\s-]?do|a fazer|pendente|icebox)\b/.test(n)) return { color: '#6B7280', isFinal: false };
  if (/\b(doing|em andamento|in progress|em progresso|working|wip|andamento)\b/.test(n)) return { color: '#3B82F6', isFinal: false };
  if (/\b(review|revis[aã]o|qa|testing|teste)\b/.test(n)) return { color: '#F59E0B', isFinal: false };
  if (/\b(approval|aprova[cç][aã]o|awaiting|aguardando|pending approval)\b/.test(n)) return { color: '#8B5CF6', isFinal: false };
  if (/\b(paused|pausado|blocked|bloqueado|on hold)\b/.test(n)) return { color: '#B8553E', isFinal: false };

  // fallback: cacau (cor da marca)
  return { color: '#3D2817', isFinal: false };
}
