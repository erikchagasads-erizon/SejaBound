/**
 * Tipos do JSON exportado pelo Trello.
 * Fonte: Trello → menu do board → Compartilhar → Imprimir e exportar → JSON.
 * O ZIP contém múltiplos JSONs: boards.json, lists.json, cards.json, labels.json, members.json.
 * Cada um é um array (mesmo para boards.json) com objetos no formato abaixo.
 *
 * Estes tipos são usados APENAS pelo parser em parse.ts — o resto do app
 * não deve importar daqui diretamente.
 */

export interface TrelloBoard {
  id: string;
  name: string;
  desc?: string;
  closed?: boolean;
}

export interface TrelloList {
  id: string;
  name: string;
  idBoard: string;
  closed?: boolean;
  pos: number;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc?: string;
  idList: string;
  due?: string | null;
  dueComplete?: boolean;
  closed?: boolean;
  pos: number;
  idLabels?: string[];
  idMembers?: string[];
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
  idBoard: string;
}

export interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
}

/**
 * Output normalizado do parser: lookup tables prontas para uso.
 * Em vez de o consumer ter que filtrar listas por idBoard, recebe um Map.
 */
export interface NormalizedTrelloData {
  boards: TrelloBoard[];
  listsByBoardId: Record<string, TrelloList[]>;
  cardsByListId: Record<string, TrelloCard[]>;
  labelsByBoardId: Record<string, TrelloLabel[]>;
  membersById: Record<string, TrelloMember>;
}
