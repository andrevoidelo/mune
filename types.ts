export enum Tab {
  ORACLE = 'ORACLE',
  TOOLS = 'TOOLS',
  DICE = 'DICE',
  PERSONA = 'PERSONA',
  WIKI = 'WIKI',
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
  color?: string;
  visualIcons?: { name: string; url: string; color: string }[];
}

export type OracleBias = 'LIKELY' | 'NORMAL' | 'UNLIKELY';

export type AttributeType = 'UNDER' | 'OVER' | 'NONE' | 'TARGET';

export interface Attribute {
  id: string;
  name: string;
  value: number;
  rollType: AttributeType;
  dice?: string;
  modifier?: number; // Added for TARGET roll type
  color?: string;
}

export interface Resource {
  id: string;
  name: string;
  current: number;
  max: number;
  color?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  isPermanent: boolean;
  dice?: string;
  icon?: string;       // Icon filename (e.g., "sword")
  iconColor?: string;  // Hex color (e.g., "#ef4444")
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

// --- WIKI TYPES ---

export type DefaultCategoryId = 'NOVO' | 'PERSONAGENS' | 'LOCAIS' | 'ITENS' | 'EVENTOS' | 'NOTAS';

export type WikiCategoryId = DefaultCategoryId | string;

export interface DefaultCategory {
  id: DefaultCategoryId;
  label: string;
  icon: string;
  color: string;
  isDefault: true;
  isSystem?: boolean;
}

export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  isDefault: false;
  createdAt: number;
}

export type WikiCategory = DefaultCategory | CustomCategory;

export interface WikiEntry {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: WikiCategoryId;
  tags: string[];
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
  isAutoCreated?: boolean;
}

// --- CLOCK TYPES ---

export type ClockType = 'THREAT' | 'PROGRESS' | 'COUNTDOWN' | 'RACING' | 'TUG_OF_WAR';

export interface Clock {
  id: string;
  name: string;
  segments: number;              // Total segments (customizable)
  filled: number;                // Currently filled (0 to segments)
  filledOpponent?: number;       // For Racing clocks
  type: ClockType;
  completionText?: string;       // What happens when full (or Max for Tug)
  completionTextMin?: string;    // What happens when empty (For Tug of War)
  isComplete: boolean;
  isArchived: boolean;
  linkedWikiId?: string;         // Optional link to wiki entry
  createdAt: number;
  completedAt?: number;
  color?: string;                // Custom color (optional)
}

// --- CONFLICT TYPES ---

export interface ConflictParticipant {
  id: string;
  name: string;
  type: 'PLAYER' | 'ENEMY' | 'ALLY';
  initiative: number;
  hp?: number;
  maxHp?: number;
  status?: string;
  notes?: string;
  active: boolean; // Is it their turn?
}

export interface ConflictState {
  isActive: boolean;
  round: number;
  turnIndex: number;
  participants: ConflictParticipant[];
}

export interface AppTheme {
  id: string;
  name: string;
  isBuiltIn: boolean;
  colors: {
    appBg: string;      // --app-bg
    cardBg: string;     // --card-bg
    cardHover: string;  // --card-hover
    border: string;     // --border-color
    
    textMain: string;   // --text-main
    textMuted: string;  // --text-muted
    textDim: string;    // --text-dim
    
    primary: string;       // --primary
    primaryHover: string;  // --primary-hover
    primaryActive: string; // --primary-active
    textAccent: string;    // --text-accent (usually same as primary)
    onPrimary: string;     // --on-primary (contrast text for primary buttons)
    
    success: string;       // --success
    error: string;         // --error
    warning: string;       // --warning
  };
}

export interface Adventure {
  id: string;
  name: string;
  description: string;
  coverUrl?: string; // New optional field
  createdAt: number;
  lastPlayedAt: number;
  logs: LogEntry[];
  characters: Character[];
  // Novos campos de estado da aventura
  wiki: WikiEntry[];
  customCategories: CustomCategory[];
  clocks: Clock[];
  conflictState?: ConflictState;
  lastLogViewedAt?: number; // Timestamp of when the log tab was last visited
  activeOracleSystem?: 'MUNE' | 'OPSE' | 'IRON';
}