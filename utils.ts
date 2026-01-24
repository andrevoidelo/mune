import { PORTENT_ADJECTIVES, PORTENT_NOUNS, DEFAULT_CATEGORIES } from "./constants";
import { LogEntry, WikiEntry, WikiCategoryId, CustomCategory, Collection } from "./types";

export const rollD = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1;
};

// Fisher-Yates Shuffle
export const shuffleArray = <T>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const generatePortent = (): string => {
  const adjIndex = Math.floor(Math.random() * PORTENT_ADJECTIVES.length);
  const nounIndex = Math.floor(Math.random() * PORTENT_NOUNS.length);
  return `${PORTENT_ADJECTIVES[adjIndex]} ${PORTENT_NOUNS[nounIndex]}`;
};

export const rollDiceNotation = (notation: string): { total: number, detail: string } => {
  if (!notation || notation.trim() === '') {
    const val = rollD(20);
    return { total: val, detail: `1d20 (${val})` };
  }

  const clean = notation.toLowerCase().replace(/\s/g, '');
  const expression = clean.startsWith('+') || clean.startsWith('-') ? clean : '+' + clean;
  
  const regex = /([+-])(?:(\d*)d(\d+)(?:(kh|kl|k|l)(\d+))?|(\d+))/g;

  let match;
  let total = 0;
  let detailParts: string[] = [];

  while ((match = regex.exec(expression)) !== null) {
    const operator = match[1];
    const isSubtraction = operator === '-';
    
    const diceSidesStr = match[3];
    const constantStr = match[6];

    if (diceSidesStr) {
      const count = match[2] === '' ? 1 : parseInt(match[2]);
      const sides = parseInt(diceSidesStr);
      const keeperMode = match[4];
      const keeperCount = match[5] ? parseInt(match[5]) : 1;

      const rolls = [];
      for (let i = 0; i < count; i++) {
        rolls.push(rollD(sides));
      }

      let termTotal = 0;
      let keptRolls: number[] = [];
      const sortedRolls = [...rolls].sort((a, b) => a - b);

      if (keeperMode) {
        if (keeperMode === 'kh' || keeperMode === 'k') {
          keptRolls = sortedRolls.slice(Math.max(0, sortedRolls.length - keeperCount));
        } else {
          keptRolls = sortedRolls.slice(0, Math.min(sortedRolls.length, keeperCount));
        }
        termTotal = keptRolls.reduce((a, b) => a + b, 0);
        detailParts.push(`${operator} ${count}d${sides}${keeperMode}${keeperCount}[${rolls.join(',')}]`);
      } else {
        termTotal = rolls.reduce((a, b) => a + b, 0);
        detailParts.push(`${operator} ${count}d${sides}[${rolls.join(',')}]`);
      }

      if (isSubtraction) total -= termTotal;
      else total += termTotal;

    } else if (constantStr) {
      const value = parseInt(constantStr);
      detailParts.push(`${operator} ${value}`);
      if (isSubtraction) total -= value;
      else total += value;
    }
  }

  let finalDetail = detailParts.join(' ');
  if (finalDetail.startsWith('+ ')) {
    finalDetail = finalDetail.substring(2);
  }

  return { total, detail: finalDetail };
};

export const generateUUID = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const exportLogsToMarkdown = (logs: LogEntry[], adventureName: string): string => {
  let md = `# ${adventureName}\n\n`;
  md += `*Exportado em: ${new Date().toLocaleString()}*\n\n---\n\n`;

  logs.forEach(log => {
    const date = new Date(log.timestamp).toLocaleString();
    
    // Icon mapping (simple text fallback)
    let icon = '📜';
    if (log.type === 'ORACLE') icon = '🔮';
    if (log.type === 'INTERVENTION') icon = '⚡';
    if (log.type === 'DICE') icon = '🎲';
    if (log.type === 'NOTE') icon = '📝';
    if (log.type === 'DRAW') icon = '🃏';
    
    md += `### ${icon} ${log.title}\n`;
    md += `**${date}**\n\n`;
    
    if (log.type === 'NOTE') {
      md += `${log.result}\n\n`;
    } else {
      md += `> **Resultado:** ${log.result}\n`;
    }

    if (log.details) {
      // Remove custom formatting like ** for MD compatibility or keep it
      md += `> *Detalhes:* ${log.details}\n`;
    }
    
    md += `\n---\n\n`;
  });

  return md;
};

export const getContrastColor = (hex: string): string => {
  // If no hex or invalid, return white as safe default for dark mode
  if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return '#ffffff';

  let c = hex.substring(1);
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }

  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);

  // HSP equation (perceived brightness)
  // 0.299 R + 0.587 G + 0.114 B
  const brightness = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );

  // Threshold can be tweaked. 127.5 is standard midpoint.
  return brightness > 127.5 ? '#000000' : '#ffffff';
};

export const getLuminance = (hex: string): number => {
  if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return 0;

  let c = hex.substring(1);
  if (c.length === 3) {
      c = c.split('').map(char => char + char).join('');
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  
  // Perceived brightness (0-255)
  return Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b);
};

export const adjustColorBrightness = (hex: string, percent: number): string => {
  if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return hex;

  let c = hex.substring(1);
  if (c.length === 3) {
      c = c.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);

  const nr = Math.min(255, Math.max(0, r + percent));
  const ng = Math.min(255, Math.max(0, g + percent));
  const nb = Math.min(255, Math.max(0, b + percent));

  return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
};

// --- DICE PROCESSING ---

export const processTextWithDice = (text: string): { processedText: string, rollDetails: string[], hasRolls: boolean } => {
  const diceRegex = /\[([0-9dD+\-khlKHL]+)\]/g;
  const rollDetails: string[] = [];
  let hasRolls = false;

  const processedText = text.replace(diceRegex, (match, notation) => {
    try {
      hasRolls = true;
      const { total, detail } = rollDiceNotation(notation);
      rollDetails.push(`${notation}[${total}]`); 
      return `**${total}**`;
    } catch (e) {
      return match;
    }
  });

  return { processedText, rollDetails, hasRolls };
};

export const processCollectionText = (
  text: string, 
  collections: Collection[], 
  depth: number = 0
): { text: string, details: string[] } => {
  if (depth > 5) return { text, details: [] };

  let currentText = text;
  let allDetails: string[] = [];

  // 1. Resolve Tables: [TableName]
  const tableRegex = /\[([^\]]+)\]/g;
  
  // Using replace with a function allows us to check each match against collections
  // However, we need to handle the fact that we might match dice notation here too.
  // We only replace if we find a collection.
  
  // NOTE: String.replace doesn't support async or easy way to restart scan if we replace content.
  // But since we are replacing [Table] with "Result", "Result" might contain more [Table] or [Dice].
  // So we might need a loop or just rely on recursion for the *replaced* content.
  // The recursive call `processCollectionText(item.text)` handles the content of the item.
  // But what if the original line has multiple tables? `replace` handles all global matches.
  
  currentText = currentText.replace(tableRegex, (match, content) => {
      const collection = collections.find(c => c.title.toLowerCase() === content.toLowerCase());
      
      if (collection && collection.items.length > 0) {
          const item = collection.items[Math.floor(Math.random() * collection.items.length)];
          const subResult = processCollectionText(item.text, collections, depth + 1);
          allDetails.push(...subResult.details);
          return subResult.text;
      }
      return match;
  });

  // 2. Resolve Dice
  const diceResult = processTextWithDice(currentText);
  allDetails.push(...diceResult.rollDetails);
  
  return {
      text: diceResult.processedText,
      details: allDetails
  };
};

// --- WIKI UTILS ---

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove accents
    .replace(/[^a-z0-9\s_]/g, '')       // Remove special chars (keep space and underscore)
    .trim()
    .replace(/\s+/g, '_');             // Spaces to underscores
};

export const generateUniqueSlug = (title: string, existingSlugs: string[]): string => {
  let slug = generateSlug(title);
  let counter = 1;
  const originalSlug = slug;
  while (existingSlugs.includes(slug)) {
    slug = `${originalSlug}_${++counter}`;
  }
  return slug;
};

export interface ParsedLink {
  type: 'mention' | 'tag' | 'bold' | 'dice';
  value: string;          // Raw value (e.g., "Eldric_o_Mago")
  displayValue: string;   // Display value (e.g., "Eldric o Mago")
  entryId?: string;       // ID if entry exists
  startIndex: number;
  endIndex: number;
}

export interface ParsedContent {
  parts: Array<
    | { type: 'text'; value: string }
    | { type: 'mention'; value: string; entryId?: string }
    | { type: 'tag'; value: string; entryId?: string }
    | { type: 'bold'; value: string }
    | { type: 'dice'; value: string }
  >;
  links: ParsedLink[];
}

export const parseLinkedContent = (
  content: string,
  entries: WikiEntry[]
): ParsedContent => {
  const mentionRegex = /@([\p{L}0-9_]+)/gu;
  const tagRegex = /#([\p{L}0-9_]+)/gu;
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const diceRegex = /\[([0-9dD+\-khlKHL]+)\]/g;

  const links: ParsedLink[] = [];
  let match;

  // Find @mentions
  while ((match = mentionRegex.exec(content)) !== null) {
    // Generate normalized slug from the matched text (handling accents/spaces properly)
    const slug = generateSlug(match[1]);
    const entry = entries.find(e => e.slug === slug);
    links.push({
      type: 'mention',
      value: match[1],
      displayValue: match[1].replace(/_/g, ' '),
      entryId: entry?.id,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Find #tags
  while ((match = tagRegex.exec(content)) !== null) {
    const tagSlug = generateSlug(match[1]);
    const entry = entries.find(e =>
      e.tags.some(t => generateSlug(t) === tagSlug) || e.slug === tagSlug
    );
    links.push({
      type: 'tag',
      value: match[1],
      displayValue: match[1].replace(/_/g, ' '),
      entryId: entry?.id,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Find **bold**
  while ((match = boldRegex.exec(content)) !== null) {
    links.push({
      type: 'bold',
      value: match[1],
      displayValue: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Find [dice]
  while ((match = diceRegex.exec(content)) !== null) {
    links.push({
      type: 'dice',
      value: match[1],
      displayValue: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // Sort by position
  links.sort((a, b) => a.startIndex - b.startIndex);

  // Build parts array
  const parts: ParsedContent['parts'] = [];
  let lastIndex = 0;

  for (const link of links) {
    if (link.startIndex > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, link.startIndex) });
    }
    
    if (link.type === 'bold') {
      parts.push({ type: 'bold', value: link.value });
    } else if (link.type === 'dice') {
      parts.push({ type: 'dice', value: link.value });
    } else {
      parts.push({
        type: link.type as 'mention' | 'tag',
        value: link.value,
        entryId: link.entryId,
      });
    }
    
    lastIndex = link.endIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) });
  }

  return { parts, links };
};

export const createAutoEntry = (
  title: string,
  existingEntries: WikiEntry[]
): WikiEntry => {
  const existingSlugs = existingEntries.map(e => e.slug);
  
  return {
    id: generateUUID(),
    title: title.replace(/_/g, ' '),
    slug: generateUniqueSlug(title, existingSlugs),
    content: '',
    category: 'NOVO',           // Always defaults to "Novo"
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isAutoCreated: true,        // Flag for UI treatment
  };
};

export const createCustomCategory = (
  label: string,
  icon: string,
  color: string
): CustomCategory => ({
  id: generateUUID(),
  label,
  icon,
  color,
  isDefault: false,
  createdAt: Date.now(),
});

export const deleteCustomCategory = (
  categoryId: string,
  entries: WikiEntry[],
  customCategories: CustomCategory[]
): { entries: WikiEntry[]; customCategories: CustomCategory[] } => {
  // Move all entries in this category to "NOVO"
  const updatedEntries = entries.map(e =>
    e.category === categoryId
      ? { ...e, category: 'NOVO' as WikiCategoryId, updatedAt: Date.now() }
      : e
  );
  
  // Remove the category
  const updatedCategories = customCategories.filter(c => c.id !== categoryId);
  
  return { entries: updatedEntries, customCategories: updatedCategories };
};

export const getCategoryColor = (categoryId: string, customCategories: CustomCategory[]): string => {
  const defaultCat = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
  if (defaultCat) return defaultCat.color;
  
  const custom = customCategories.find(c => c.id === categoryId);
  return custom?.color || 'primary';
};

export const getCategoryIcon = (categoryId: string, customCategories: CustomCategory[]): string => {
   switch (categoryId) {
    case 'NOVO': return 'sparkles';
    case 'PERSONAGENS': return 'user';
    case 'LOCAIS': return 'map-pin';
    case 'ITENS': return 'sword';
    case 'EVENTOS': return 'calendar';
    case 'NOTAS': return 'file-text';
  }
  
  const custom = customCategories.find(c => c.id === categoryId);
  return custom?.icon || 'folder';
};