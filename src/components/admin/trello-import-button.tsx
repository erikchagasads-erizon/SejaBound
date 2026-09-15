'use client';

/**
 * Botão + modal de import de Trello.
 * Wizard de 3 passos:
 *   1. Upload (cliente, board, arquivos)
 *   2. Preview (listas e cards com opção de desmarcar)
 *   3. Confirmação + execução
 *
 * Apenas admin pode usar (a checagem fina é server-side na action).
 */

import { useReducer, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Upload, X, FileJson, ChevronRight, ChevronLeft, Loader2, Check, AlertCircle,
  KanbanSquare, Trash2, Calendar,
} from 'lucide-react';
import { importTrelloBoardAction } from '@/app/actions/trello-import';
import { parseTrelloExport, inferColumnMetadata } from '@/lib/trello/parse';
import type { TrelloList, TrelloCard } from '@/lib/trello/types';
import type { TaskType, TaskPriority } from '@/lib/supabase/database.types';

interface ClientOption {
  id: string;
  name: string;
  primary_color: string | null;
}

interface TrelloImportButtonProps {
  clients: ClientOption[];
}

type Step = 1 | 2 | 3;

interface State {
  step: Step;
  clientId: string;
  files: {
    boards: File | null;
    lists: File | null;
    cards: File | null;
    labels: File | null;
    members: File | null;
  };
  parsed:
    | null
    | {
        boards: Array<{ id: string; name: string }>;
        listsByBoardId: Record<string, TrelloList[]>;
        cardsByListId: Record<string, TrelloCard[]>;
      };
  boardId: string;
  excludedCardIds: Set<string>;
  priority: TaskPriority;
  type: TaskType;
  loading: boolean;
  error: string | null;
  result: {
    columnsCreated: number;
    tasksCreated: number;
    boardName: string;
    labelsCreated: number;
    assigneesMatched: number;
    assigneesUnmatched: number;
  } | null;
}

type Action =
  | { kind: 'SET_CLIENT'; clientId: string }
  | { kind: 'SET_FILE'; key: 'boards' | 'lists' | 'cards' | 'labels' | 'members'; file: File | null }
  | { kind: 'SET_PARSED'; parsed: State['parsed']; boardId: string }
  | { kind: 'SET_BOARD'; boardId: string }
  | { kind: 'TOGGLE_CARD'; cardId: string }
  | { kind: 'SET_PRIORITY'; priority: TaskPriority }
  | { kind: 'SET_TYPE'; type: TaskType }
  | { kind: 'SET_STEP'; step: Step }
  | { kind: 'SET_LOADING'; loading: boolean }
  | { kind: 'SET_ERROR'; error: string | null }
  | { kind: 'SET_RESULT'; result: State['result'] }
  | { kind: 'RESET' };

const initialState: State = {
  step: 1,
  clientId: '',
  files: { boards: null, lists: null, cards: null, labels: null, members: null },
  parsed: null,
  boardId: '',
  excludedCardIds: new Set(),
  priority: 'medium',
  type: 'other',
  loading: false,
  error: null,
  result: null,
};

function reducer(state: State, action: Action): State {
  switch (action.kind) {
    case 'SET_CLIENT': return { ...state, clientId: action.clientId };
    case 'SET_FILE': return {
      ...state,
      files: { ...state.files, [action.key]: action.file },
      // reset parse if files change
      parsed: null,
      boardId: '',
      error: null,
    };
    case 'SET_PARSED': return {
      ...state,
      parsed: action.parsed,
      boardId: action.boardId,
      excludedCardIds: new Set(),
    };
    case 'SET_BOARD': return { ...state, boardId: action.boardId, excludedCardIds: new Set() };
    case 'TOGGLE_CARD': {
      const next = new Set(state.excludedCardIds);
      if (next.has(action.cardId)) next.delete(action.cardId);
      else next.add(action.cardId);
      return { ...state, excludedCardIds: next };
    }
    case 'SET_PRIORITY': return { ...state, priority: action.priority };
    case 'SET_TYPE': return { ...state, type: action.type };
    case 'SET_STEP': return { ...state, step: action.step, error: null };
    case 'SET_LOADING': return { ...state, loading: action.loading };
    case 'SET_ERROR': return { ...state, error: action.error };
    case 'SET_RESULT': return { ...state, result: action.result };
    case 'RESET': return initialState;
    default: return state;
  }
}

// ============================================================
// Copy i18n (inline — não usamos next-intl nesse wizard para
// manter o componente plug-and-play sem ter que criar namespace
// extra. Strings são curtas e centralizadas aqui.)
// ============================================================

interface Copy {
  open: string;
  title: string;
  step1Title: string;
  step2Title: string;
  step3Title: string;
  step1Desc: string;
  step2Desc: string;
  step3Desc: string;
  clientLabel: string;
  selectClient: string;
  boardLabel: string;
  selectBoard: string;
  dropFiles: string;
  orClick: string;
  fileRequired: string;
  fileOptional: string;
  parsing: string;
  parse: string;
  preview: string;
  listWith: (n: number) => string;
  card: (n: number) => string;
  priority: string;
  type: string;
  selectPriority: string;
  selectType: string;
  confirm: string;
  confirmWith: (cols: number, tasks: number) => string;
  back: string;
  cancel: string;
  success: (cols: number, tasks: number, board: string, labels: number, matched: number, unmatched: number) => string;
  errors: {
    clientRequired: string;
    filesRequired: string;
    parseFailed: string;
    noBoards: string;
  };
}

const copy = (locale: string): Copy => locale === 'en' ? {
  open: 'Import Trello',
  title: 'Import Trello board',
  step1Title: '1. Upload files',
  step2Title: '2. Preview',
  step3Title: '3. Confirm',
  step1Desc: 'Export your Trello board as JSON and drop the files below.',
  step2Desc: 'Review what will be imported. Uncheck the cards you don\'t want.',
  step3Desc: 'Last step — check the summary and confirm.',
  clientLabel: 'Client',
  selectClient: 'Select a client',
  boardLabel: 'Board',
  selectBoard: 'Select a board',
  dropFiles: 'Drop JSON files here',
  orClick: 'or click to select',
  fileRequired: 'required',
  fileOptional: 'optional',
  parsing: 'Parsing…',
  parse: 'Continue',
  preview: 'Preview',
  listWith: (n) => `${n} card${n === 1 ? '' : 's'}`,
  card: (n) => `${n} card${n === 1 ? '' : 's'}`,
  priority: 'Default priority',
  type: 'Default type',
  selectPriority: 'Priority',
  selectType: 'Type',
  confirm: 'Import',
  confirmWith: (cols, tasks) => `Import ${cols} column${cols === 1 ? '' : 's'} and ${tasks} task${tasks === 1 ? '' : 's'}`,
  back: 'Back',
  cancel: 'Cancel',
  success: (cols, tasks, board, labels, matched, unmatched) => {
    const parts = [`Imported ${cols} column${cols === 1 ? '' : 's'} and ${tasks} task${tasks === 1 ? '' : 's'} from "${board}"`];
    const extras: string[] = [];
    if (labels > 0) extras.push(`${labels} label${labels === 1 ? '' : 's'}`);
    if (matched > 0) extras.push(`${matched} assignee${matched === 1 ? '' : 's'} matched`);
    if (unmatched > 0) extras.push(`${unmatched} unmatched`);
    return extras.length > 0 ? `${parts[0]} (${extras.join(', ')})` : parts[0];
  },
  errors: {
    clientRequired: 'Select a client',
    filesRequired: 'Upload lists.json and cards.json',
    parseFailed: 'Failed to parse the files. Check they are from a real Trello export.',
    noBoards: 'No boards found',
  },
} : {
  open: 'Importar Trello',
  title: 'Importar board do Trello',
  step1Title: '1. Upload dos arquivos',
  step2Title: '2. Preview',
  step3Title: '3. Confirmar',
  step1Desc: 'Exporte seu board do Trello como JSON e solte os arquivos abaixo.',
  step2Desc: 'Revise o que será importado. Desmarque os cards que não quiser.',
  step3Desc: 'Último passo — confira o resumo e confirme.',
  clientLabel: 'Cliente',
  selectClient: 'Selecione um cliente',
  boardLabel: 'Board',
  selectBoard: 'Selecione um board',
  dropFiles: 'Solte os arquivos JSON aqui',
  orClick: 'ou clique para selecionar',
  fileRequired: 'obrigatório',
  fileOptional: 'opcional',
  parsing: 'Processando…',
  parse: 'Continuar',
  preview: 'Preview',
  listWith: (n) => `${n} card${n === 1 ? '' : 's'}`,
  card: (n) => `${n} card${n === 1 ? '' : 's'}`,
  priority: 'Prioridade padrão',
  type: 'Tipo padrão',
  selectPriority: 'Prioridade',
  selectType: 'Tipo',
  confirm: 'Importar',
  confirmWith: (cols, tasks) => `Importar ${cols} coluna${cols === 1 ? '' : 's'} e ${tasks} tarefa${tasks === 1 ? '' : 's'}`,
  back: 'Voltar',
  cancel: 'Cancelar',
  success: (cols, tasks, board, labels, matched, unmatched) => {
    const parts = [`${cols} coluna${cols === 1 ? '' : 's'} e ${tasks} tarefa${tasks === 1 ? '' : 's'} importadas de "${board}"`];
    const extras: string[] = [];
    if (labels > 0) extras.push(`${labels} label${labels === 1 ? '' : 's'}`);
    if (matched > 0) extras.push(`${matched} assignee${matched === 1 ? '' : 's'}`);
    if (unmatched > 0) extras.push(`${unmatched} sem match`);
    return extras.length > 0 ? `${parts[0]} (${extras.join(', ')})` : parts[0];
  },
  errors: {
    clientRequired: 'Selecione um cliente',
    filesRequired: 'Faça upload de lists.json e cards.json',
    parseFailed: 'Falha ao processar os arquivos. Verifique se vieram de um export real do Trello.',
    noBoards: 'Nenhum board encontrado',
  },
};

const TASK_TYPES: TaskType[] = ['design', 'social_media', 'traffic', 'content', 'web', 'video', 'photo', 'report', 'other'];
const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

// ============================================================
// Componente
// ============================================================

export function TrelloImportButton({ clients }: TrelloImportButtonProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = copy(locale);
  const [open, setOpen] = useState(false);
  const [state, dispatch] = useReducer(reducer, initialState);

  const close = () => {
    setOpen(false);
    // delay reset pra animação não piscar
    setTimeout(() => dispatch({ kind: 'RESET' }), 200);
  };

  const requiredFilesPresent = state.files.lists && state.files.cards;

  const handleParse = async () => {
    if (!state.clientId) {
      dispatch({ kind: 'SET_ERROR', error: t.errors.clientRequired });
      return;
    }
    if (!requiredFilesPresent) {
      dispatch({ kind: 'SET_ERROR', error: t.errors.filesRequired });
      return;
    }
    dispatch({ kind: 'SET_LOADING', loading: true });
    dispatch({ kind: 'SET_ERROR', error: null });
    try {
      const parsed = await parseTrelloExport({ files: state.files });
      if (parsed.boards.length === 0) {
        throw new Error(t.errors.noBoards);
      }
      dispatch({
        kind: 'SET_PARSED',
        parsed,
        boardId: parsed.boards[0].id,
      });
      dispatch({ kind: 'SET_STEP', step: 2 });
    } catch (e) {
      dispatch({
        kind: 'SET_ERROR',
        error: e instanceof Error ? e.message : t.errors.parseFailed,
      });
    } finally {
      dispatch({ kind: 'SET_LOADING', loading: false });
    }
  };

  const handleConfirm = async () => {
    dispatch({ kind: 'SET_LOADING', loading: true });
    dispatch({ kind: 'SET_ERROR', error: null });
    try {
      const res = await importTrelloBoardAction({
        clientId: state.clientId,
        files: state.files,
        boardId: state.boardId,
        priority: state.priority,
        type: state.type,
        excludedCardIds: Array.from(state.excludedCardIds),
      });
      if (res && 'error' in res) {
        dispatch({ kind: 'SET_ERROR', error: res.error ?? t.errors.parseFailed });
        return;
      }
      if (res && 'success' in res) {
        dispatch({
          kind: 'SET_RESULT',
          result: {
            columnsCreated: res.columnsCreated ?? 0,
            tasksCreated: res.tasksCreated ?? 0,
            boardName: res.boardName ?? 'Trello',
            labelsCreated: res.labelsCreated ?? 0,
            assigneesMatched: res.assigneesMatched ?? 0,
            assigneesUnmatched: res.assigneesUnmatched ?? 0,
          },
        });
        router.refresh();
        // fecha depois de 2.5s
        setTimeout(() => close(), 2500);
      }
    } catch (e) {
      dispatch({
        kind: 'SET_ERROR',
        error: e instanceof Error ? e.message : t.errors.parseFailed,
      });
    } finally {
      dispatch({ kind: 'SET_LOADING', loading: false });
    }
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        <Upload size={16} />
        <span>{t.open}</span>
      </button>

      {open && (
        <div
          className="trello-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="trello-modal-title"
        >
          <div className="trello-modal-box">
            <div className="trello-modal-header">
              <div className="trello-modal-icon">
                <KanbanSquare size={18} />
              </div>
              <h2 id="trello-modal-title" className="trello-modal-title">{t.title}</h2>
              <button className="trello-modal-close" onClick={close} aria-label={t.cancel}>
                <X size={16} />
              </button>
            </div>

            <Stepper current={state.step} t={t} />

            <div className="trello-modal-body">
              {state.error && (
                <div className="trello-error">
                  <AlertCircle size={14} />
                  <span>{state.error}</span>
                </div>
              )}

              {state.step === 1 && (
                <Step1
                  state={state}
                  dispatch={dispatch}
                  clients={clients}
                  t={t}
                />
              )}

              {state.step === 2 && state.parsed && (
                <Step2
                  state={state}
                  dispatch={dispatch}
                  t={t}
                />
              )}

              {state.step === 3 && state.parsed && (
                <Step3
                  state={state}
                  dispatch={dispatch}
                  t={t}
                />
              )}

              {state.result && (
                <div className="trello-success">
                  <Check size={16} />
                  <span>{t.success(state.result.columnsCreated, state.result.tasksCreated, state.result.boardName, state.result.labelsCreated, state.result.assigneesMatched, state.result.assigneesUnmatched)}</span>
                </div>
              )}
            </div>

            <div className="trello-modal-footer">
              {state.result ? null : (
                <>
                  {state.step > 1 && (
                    <button
                      type="button"
                      className="trello-btn trello-btn-ghost"
                      onClick={() => dispatch({ kind: 'SET_STEP', step: (state.step - 1) as Step })}
                      disabled={state.loading}
                    >
                      <ChevronLeft size={14} />
                      {t.back}
                    </button>
                  )}
                  <div style={{ flex: 1 }} />
                  {state.step === 1 && (
                    <button
                      type="button"
                      className="trello-btn trello-btn-primary"
                      onClick={handleParse}
                      disabled={state.loading || !state.clientId || !requiredFilesPresent}
                    >
                      {state.loading ? (
                        <><Loader2 size={14} className="trello-spin" /> {t.parsing}</>
                      ) : (
                        <>{t.parse} <ChevronRight size={14} /></>
                      )}
                    </button>
                  )}
                  {state.step === 2 && (
                    <button
                      type="button"
                      className="trello-btn trello-btn-primary"
                      onClick={() => dispatch({ kind: 'SET_STEP', step: 3 })}
                    >
                      {t.preview} <ChevronRight size={14} />
                    </button>
                  )}
                  {state.step === 3 && (
                    <button
                      type="button"
                      className="trello-btn trello-btn-primary"
                      onClick={handleConfirm}
                      disabled={state.loading}
                    >
                      {state.loading ? (
                        <><Loader2 size={14} className="trello-spin" /></>
                      ) : (
                        <><Check size={14} /> {t.confirm}</>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <style jsx>{styles}</style>
        </div>
      )}
    </>
  );
}

// ============================================================
// Stepper
// ============================================================

function Stepper({ current, t }: { current: Step; t: Copy }) {
  const steps: { id: Step; label: string }[] = [
    { id: 1, label: t.step1Title.replace(/^\d+\.\s*/, '') },
    { id: 2, label: t.step2Title.replace(/^\d+\.\s*/, '') },
    { id: 3, label: t.step3Title.replace(/^\d+\.\s*/, '') },
  ];
  return (
    <div className="trello-stepper">
      {steps.map((s, i) => (
        <div key={s.id} className={`trello-step ${current >= s.id ? 'active' : ''} ${current > s.id ? 'done' : ''}`}>
          <div className="trello-step-num">{current > s.id ? <Check size={12} /> : s.id}</div>
          <span className="trello-step-label">{s.label}</span>
          {i < steps.length - 1 && <div className="trello-step-line" />}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Step 1: Upload
// ============================================================

function Step1({
  state, dispatch, clients, t,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  clients: ClientOption[];
  t: Copy;
}) {
  return (
    <>
      <p className="trello-desc">{t.step1Desc}</p>

      <div className="trello-form-row">
        <label className="trello-label">{t.clientLabel} *</label>
        <select
          className="trello-select"
          value={state.clientId}
          onChange={(e) => dispatch({ kind: 'SET_CLIENT', clientId: e.target.value })}
        >
          <option value="">{t.selectClient}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <FileDrop
        label="lists.json"
        required
        file={state.files.lists}
        onFile={(f) => dispatch({ kind: 'SET_FILE', key:'lists', file: f })}
        t={t}
      />
      <FileDrop
        label="cards.json"
        required
        file={state.files.cards}
        onFile={(f) => dispatch({ kind: 'SET_FILE', key:'cards', file: f })}
        t={t}
      />
      <FileDrop
        label="boards.json"
        required={false}
        file={state.files.boards}
        onFile={(f) => dispatch({ kind: 'SET_FILE', key:'boards', file: f })}
        t={t}
      />
      <FileDrop
        label="labels.json"
        required={false}
        file={state.files.labels}
        onFile={(f) => dispatch({ kind: 'SET_FILE', key:'labels', file: f })}
        t={t}
      />
      <FileDrop
        label="members.json"
        required={false}
        file={state.files.members}
        onFile={(f) => dispatch({ kind: 'SET_FILE', key:'members', file: f })}
        t={t}
      />
    </>
  );
}

// ============================================================
// File drop zone
// ============================================================

function FileDrop({
  label, required, file, onFile, t,
}: {
  label: string;
  required: boolean;
  file: File | null;
  onFile: (f: File | null) => void;
  t: Copy;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={`trello-file ${dragOver ? 'dragover' : ''} ${file ? 'has-file' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          onFile(f);
        }}
      />
      <FileJson size={16} className="trello-file-icon" />
      <div className="trello-file-info">
        <span className="trello-file-name">{label}</span>
        <span className="trello-file-status">
          {file ? (
            <span className="trello-file-loaded">{file.name}</span>
          ) : (
            <span className="trello-file-pending">
              {t.dropFiles} · <em>{required ? t.fileRequired : t.fileOptional}</em>
            </span>
          )}
        </span>
      </div>
      {file && (
        <button
          type="button"
          className="trello-file-remove"
          onClick={(e) => { e.stopPropagation(); onFile(null); }}
          aria-label="Remove"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}

// ============================================================
// Step 2: Preview
// ============================================================

function Step2({
  state, dispatch, t,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  t: Copy;
}) {
  const parsed = state.parsed!;
  const boardLists = (parsed.listsByBoardId[state.boardId] ?? [])
    .sort((a, b) => a.pos - b.pos);

  const totalCards = boardLists.reduce(
    (acc, l) => acc + (parsed.cardsByListId[l.id]?.length ?? 0),
    0,
  );
  const excludedCount = state.excludedCardIds.size;

  return (
    <>
      <p className="trello-desc">{t.step2Desc}</p>

      {parsed.boards.length > 1 && (
        <div className="trello-form-row">
          <label className="trello-label">{t.boardLabel}</label>
          <select
            className="trello-select"
            value={state.boardId}
            onChange={(e) => dispatch({ kind: 'SET_BOARD', boardId: e.target.value })}
          >
            {parsed.boards.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="trello-summary">
        <span><strong>{boardLists.length}</strong> colunas</span>
        <span>·</span>
        <span><strong>{totalCards - excludedCount}</strong> de {totalCards} cards</span>
      </div>

      <div className="trello-lists">
        {boardLists.map((list) => {
          const cards = parsed.cardsByListId[list.id] ?? [];
          const meta = inferColumnMetadata(list.name);
          return (
            <div key={list.id} className="trello-list">
              <div className="trello-list-head">
                <div className="trello-list-color" style={{ background: meta.color }} />
                <div className="trello-list-title">
                  <span>{list.name}</span>
                  {meta.isFinal && <span className="trello-list-final">final</span>}
                </div>
                <span className="trello-list-count">{t.listWith(cards.length)}</span>
              </div>
              {cards.length > 0 && (
                <div className="trello-cards">
                  {cards.map((card) => {
                    const excluded = state.excludedCardIds.has(card.id);
                    return (
                      <label
                        key={card.id}
                        className={`trello-card-row ${excluded ? 'excluded' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={!excluded}
                          onChange={() => dispatch({ kind: 'TOGGLE_CARD', cardId: card.id })}
                        />
                        <span className="trello-card-name">{card.name || '(sem título)'}</span>
                        {card.due && (
                          <span className="trello-card-due">
                            <Calendar size={10} />
                            {card.due.slice(0, 10)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ============================================================
// Step 3: Confirm
// ============================================================

function Step3({
  state, dispatch, t,
}: {
  state: State;
  dispatch: React.Dispatch<Action>;
  t: Copy;
}) {
  const parsed = state.parsed!;
  const boardLists = parsed.listsByBoardId[state.boardId] ?? [];
  const totalCards = boardLists.reduce(
    (acc, l) => acc + (parsed.cardsByListId[l.id]?.length ?? 0),
    0,
  );
  const finalCount = totalCards - state.excludedCardIds.size;
  const client = state.clientId;

  return (
    <>
      <p className="trello-desc">{t.step3Desc}</p>

      <div className="trello-form-row">
        <label className="trello-label">{t.priority}</label>
        <select
          className="trello-select"
          value={state.priority}
          onChange={(e) => dispatch({ kind: 'SET_PRIORITY', priority: e.target.value as TaskPriority })}
        >
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="trello-form-row">
        <label className="trello-label">{t.type}</label>
        <select
          className="trello-select"
          value={state.type}
          onChange={(e) => dispatch({ kind: 'SET_TYPE', type: e.target.value as TaskType })}
        >
          {TASK_TYPES.map((tp) => (
            <option key={tp} value={tp}>{tp}</option>
          ))}
        </select>
      </div>

      <div className="trello-final-summary">
        <div className="trello-final-stat">
          <div className="trello-final-num">{boardLists.length}</div>
          <div className="trello-final-label">colunas</div>
        </div>
        <div className="trello-final-divider" />
        <div className="trello-final-stat">
          <div className="trello-final-num">{finalCount}</div>
          <div className="trello-final-label">tasks</div>
        </div>
        <div className="trello-final-divider" />
        <div className="trello-final-stat">
          <div className="trello-final-num">1</div>
          <div className="trello-final-label">cliente</div>
        </div>
      </div>
      {/* client id só pra garantir render sem warning */}
      <span hidden>{client}</span>
    </>
  );
}

// ============================================================
// Styles (escopados via styled-jsx — mesmo padrão do resto da app)
// ============================================================

const styles = `
.trello-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: trelloFadeIn 0.18s ease-out;
}
.trello-modal-box {
  background: hsl(var(--bg-surface, 220 15% 12%));
  border: 1px solid hsl(var(--border-default, 220 10% 25%));
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 60px rgba(0,0,0,0.45);
  animation: trelloScaleIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1.1);
}
@keyframes trelloFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes trelloScaleIn { from { opacity: 0; transform: scale(0.95) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.trello-modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 12px;
}
.trello-modal-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.trello-modal-title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  margin: 0;
  font-family: var(--font-display);
  font-style: italic;
  color: hsl(var(--text-primary));
}
.trello-modal-close {
  background: transparent;
  border: none;
  color: hsl(var(--text-muted));
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.trello-modal-close:hover {
  background: hsl(var(--bg-elevated, 220 15% 18%));
  color: hsl(var(--text-primary));
}

.trello-stepper {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 24px 16px;
  border-bottom: 1px solid hsl(var(--border-subtle, 220 10% 20%));
}
.trello-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: hsl(var(--text-muted));
  font-weight: 500;
}
.trello-step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: hsl(var(--bg-elevated, 220 15% 18%));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid hsl(var(--border-subtle));
}
.trello-step.active .trello-step-num {
  background: hsl(var(--brand-primary));
  color: white;
  border-color: hsl(var(--brand-primary));
}
.trello-step.active { color: hsl(var(--text-primary)); }
.trello-step.done .trello-step-num {
  background: hsl(var(--success, 142 50% 45%));
  color: white;
  border-color: hsl(var(--success, 142 50% 45%));
}
.trello-step-line {
  width: 32px;
  height: 1px;
  background: hsl(var(--border-subtle));
}

.trello-modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}
.trello-desc {
  font-size: 13px;
  color: hsl(var(--text-secondary));
  margin: 0 0 16px;
  line-height: 1.5;
}

.trello-form-row {
  margin-bottom: 14px;
}
.trello-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--text-secondary));
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.trello-select {
  width: 100%;
  padding: 9px 12px;
  background: hsl(var(--bg-elevated, 220 15% 18%));
  border: 1px solid hsl(var(--border-default, 220 10% 25%));
  border-radius: 8px;
  color: hsl(var(--text-primary));
  font-size: 13px;
  font-family: inherit;
}
.trello-select:focus {
  outline: none;
  border-color: hsl(var(--brand-primary));
}

.trello-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: hsl(var(--bg-elevated, 220 15% 18%));
  border: 1px dashed hsl(var(--border-default, 220 10% 25%));
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.trello-file:hover { border-color: hsl(var(--brand-primary)); }
.trello-file.dragover { border-color: hsl(var(--brand-primary)); background: hsl(var(--brand-primary) / 0.06); }
.trello-file.has-file { border-style: solid; }
.trello-file-icon { color: hsl(var(--text-muted)); flex-shrink: 0; }
.trello-file.has-file .trello-file-icon { color: hsl(var(--success, 142 50% 45%)); }
.trello-file-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.trello-file-name { font-size: 13px; font-weight: 600; color: hsl(var(--text-primary)); }
.trello-file-status { font-size: 11px; color: hsl(var(--text-muted)); }
.trello-file-loaded { color: hsl(var(--success, 142 50% 45%)); font-weight: 500; }
.trello-file-pending em { font-style: normal; opacity: 0.7; }
.trello-file-remove {
  background: transparent;
  border: none;
  color: hsl(var(--text-muted));
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.trello-file-remove:hover { color: hsl(var(--error, 0 70% 55%)); background: hsl(var(--error, 0 70% 55%) / 0.1); }

.trello-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: hsl(var(--error, 0 70% 55%) / 0.1);
  border: 1px solid hsl(var(--error, 0 70% 55%) / 0.3);
  border-radius: 8px;
  color: hsl(var(--error, 0 70% 55%));
  font-size: 13px;
  margin-bottom: 14px;
}
.trello-success {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px;
  background: hsl(var(--success, 142 50% 45%) / 0.1);
  border: 1px solid hsl(var(--success, 142 50% 45%) / 0.3);
  border-radius: 8px;
  color: hsl(var(--success, 142 50% 45%));
  font-size: 13px;
  font-weight: 500;
}

.trello-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: hsl(var(--text-secondary));
  padding: 10px 12px;
  background: hsl(var(--bg-elevated, 220 15% 18%));
  border-radius: 8px;
  margin-bottom: 12px;
}
.trello-summary strong { color: hsl(var(--text-primary)); }

.trello-lists {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}
.trello-list {
  background: hsl(var(--bg-elevated, 220 15% 18%));
  border: 1px solid hsl(var(--border-subtle));
  border-radius: 8px;
  overflow: hidden;
}
.trello-list-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: hsl(var(--bg-surface, 220 15% 14%));
  border-bottom: 1px solid hsl(var(--border-subtle));
}
.trello-list-color {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.trello-list-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--text-primary));
  display: flex;
  align-items: center;
  gap: 8px;
}
.trello-list-final {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  background: hsl(var(--success, 142 50% 45%) / 0.18);
  color: hsl(var(--success, 142 50% 45%));
  border-radius: 4px;
  letter-spacing: 0.5px;
}
.trello-list-count {
  font-size: 11px;
  color: hsl(var(--text-muted));
}
.trello-cards {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.trello-card-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 5px;
  font-size: 12.5px;
  color: hsl(var(--text-primary));
  cursor: pointer;
  transition: background 0.1s;
}
.trello-card-row:hover { background: hsl(var(--bg-surface, 220 15% 14%)); }
.trello-card-row.excluded .trello-card-name { text-decoration: line-through; opacity: 0.5; }
.trello-card-row input { accent-color: hsl(var(--brand-primary)); cursor: pointer; }
.trello-card-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.trello-card-due {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10.5px;
  color: hsl(var(--text-muted));
  flex-shrink: 0;
}

.trello-final-summary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 24px 16px;
  background: linear-gradient(135deg, hsl(var(--brand-primary) / 0.06), hsl(var(--brand-accent) / 0.06));
  border: 1px solid hsl(var(--border-subtle));
  border-radius: 12px;
  margin: 16px 0 8px;
}
.trello-final-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.trello-final-num {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  color: hsl(var(--brand-primary));
  font-style: italic;
  letter-spacing: -0.02em;
  line-height: 1;
}
.trello-final-label {
  font-size: 10px;
  color: hsl(var(--text-muted));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}
.trello-final-divider { width: 1px; height: 36px; background: hsl(var(--border-subtle)); }

.trello-modal-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px 20px;
  border-top: 1px solid hsl(var(--border-subtle));
}
.trello-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s, transform 0.1s, background 0.15s;
}
.trello-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.trello-btn:not(:disabled):hover { transform: translateY(-1px); }
.trello-btn-primary {
  background: linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)));
  color: white;
  box-shadow: 0 4px 12px hsl(var(--brand-primary) / 0.3);
}
.trello-btn-ghost {
  background: transparent;
  border-color: hsl(var(--border-default));
  color: hsl(var(--text-secondary));
}
.trello-btn-ghost:hover:not(:disabled) {
  background: hsl(var(--bg-elevated));
  color: hsl(var(--text-primary));
}
.trello-spin { animation: trelloSpin 0.7s linear infinite; }
@keyframes trelloSpin { to { transform: rotate(360deg); } }
`;
