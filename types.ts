export enum Tab {
  ORACLE = 'ORACLE',
  TOOLS = 'TOOLS',
  DICE = 'DICE',
  PERSONA = 'PERSONA',
  LOG = 'LOG'
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'ORACLE' | 'INTERVENTION' | 'DICE' | 'GENERATOR' | 'ATTRIBUTE' | 'ITEM' | 'NOTE' | 'DRAW';
  title: string;
  result: string;
  details?: string;
  highlight?: boolean;
  imageUrl?: string;
  icon?: string;
  iconColor?: string;
  visualIcons?: { name: string; url: string; color: string }[];
}

export type OracleBias = 'LIKELY' | 'NORMAL' | 'UNLIKELY';

export type AttributeType = 'UNDER' | 'OVER' | 'NONE';

export interface Attribute {
  id: string;
  name: string;
  value: number;
  rollType: AttributeType;
  dice?: string;
}

export interface Resource {
  id: string;
  name: string;
  current: number;
  max: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  isPermanent: boolean;
  dice?: string;
}

export interface Character {
  id: string;
  name: string;
  profession: string;
  description: string;
  imageUrl: string;
  attributes: Attribute[];
  resources: Resource[];
  inventory: InventoryItem[];
}

// --- NOVOS TIPOS ---

export type CollectionType = 'TABLE' | 'DECK';

export interface CollectionItem {
  text: string;
  subtext?: string;
  icon?: string; // Para cartas (ex: '♥')
  color?: string; // Para cartas (ex: 'red')
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  type: CollectionType;
  items: CollectionItem[];
  isBuiltIn?: boolean;
  icon?: string;
  iconColor?: string;
}

export interface Thread {
  id: string;
  name: string;
  status: 'OPEN' | 'CLOSED';
}

export interface NpcEntry {
  id: string;
  name: string;
  notes: string;
}

export interface Adventure {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  lastPlayedAt: number;
  logs: LogEntry[];
  characters: Character[];
  // Novos campos de estado da aventura
  threads: Thread[];
  npcs: NpcEntry[];
}