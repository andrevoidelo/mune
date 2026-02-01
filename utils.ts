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

const checkCondition = (roll: number, op: string, target: number): boolean => {
  switch (op) {
    case '=': case '==': case '': return roll === target;
    case '<': return roll < target;
    case '>': return roll > target;
    case '<=': return roll <= target;
    case '>=': return roll >= target;
    case '!=': case '!': return roll !== target;
    default: return false;
  }
};

export const rollDiceNotation = (notation: string): { total: number, detail: string } => {
  if (!notation || notation.trim() === '') {
    const val = rollD(20);
    return { total: val, detail: `1d20 [${val}]` };
  }

  const clean = notation.toLowerCase().replace(/\s/g, '');
  const expression = (clean.startsWith('+') || clean.startsWith('-')) ? clean : '+' + clean;
  
  // Term Regex: matches +NdS... or -NdS... or +N or -N
  const termRegex = /([+-])(?:(\d*)d(\d+)(.*?)|(\d+))(?=[+-]|$)/g;

  let match;
  let total = 0;
  let detailParts: string[] = [];

  while ((match = termRegex.exec(expression)) !== null) {
    const operator = match[1];
    const isSubtraction = operator === '-';
    
    const countStr = match[2];
    const sidesStr = match[3];
    const modsStr = match[4];
    const constantStr = match[5];

    if (sidesStr) {
      const count = countStr === '' ? 1 : parseInt(countStr);
      const sides = parseInt(sidesStr);

      // Parse Modifiers
      let remainingMods = modsStr;
      const parsedMods: any[] = [];
      const modRegex = /^(kh|kl|dh|dl|min|max|rr|r|xo|x|!)(?:([<>=]*)(-?\d+))?/;

      while (remainingMods && remainingMods.length > 0) {
        const m = remainingMods.match(modRegex);
        if (!m) {
             remainingMods = remainingMods.substring(1);
             continue;
        }
        parsedMods.push({ type: m[1], op: m[2] || '', val: m[3] ? parseInt(m[3]) : undefined });
        remainingMods = remainingMods.substring(m[0].length);
      }

      // Track rolls with history: value is current, history shows transitions (rerolls)
      // dropped indicates if it's excluded from total
      type DieLog = { current: number, history: number[], dropped: boolean, exploded: boolean };
      let dice: DieLog[] = [];

      for (let i = 0; i < count; i++) {
        const val = rollD(sides);
        dice.push({ current: val, history: [val], dropped: false, exploded: false });
      }

      // 1. Rerolls (r, rr)
      const rerollMods = parsedMods.filter(m => m.type === 'r' || m.type === 'rr');
      for (const mod of rerollMods) {
        const recursive = mod.type === 'rr';
        const target = mod.val !== undefined ? mod.val : 1; 
        const op = mod.op || '=';
        
        for (const die of dice) {
           // We check the *current* value
           if (checkCondition(die.current, op, target)) {
               let newVal = rollD(sides);
               die.history.push(newVal);
               die.current = newVal;
               
               if (recursive) {
                   let safety = 0;
                   while (checkCondition(die.current, op, target) && safety < 100) {
                       newVal = rollD(sides);
                       die.history.push(newVal);
                       die.current = newVal;
                       safety++;
                   }
               }
           }
        }
      }

      // 2. Explode (x, !, xo)
      const explodeMods = parsedMods.filter(m => m.type === 'x' || m.type === '!' || m.type === 'xo');
      
      // We process explode mods sequentially
      for (const mod of explodeMods) {
          const isBang = mod.type === '!';
          const isX = mod.type.startsWith('x');
          const isOnce = mod.type === 'xo';
          const isRecursive = !isOnce;
          
          const defaultTarget = (isBang || (isX && mod.val === undefined));
          const target = defaultTarget ? sides : mod.val;
          const op = (defaultTarget || !mod.op) ? '=' : mod.op;

          const limit = 100;
          let addedCount = 0;
          
          const initialLength = dice.length;
          let idx = 0;
          
          // Iterate through dice (including newly added ones if recursive)
          while (idx < dice.length) {
              if (addedCount >= limit) break;
              if (!isRecursive && idx >= initialLength) break;
              
              const die = dice[idx];
              // Only explode if not already dropped? Usually explode happens before drop.
              
              if (checkCondition(die.current, op, target)) {
                   die.exploded = true; // Mark source die as exploded (visual cue?)
                   
                   const newVal = rollD(sides);
                   const newDie: DieLog = { current: newVal, history: [newVal], dropped: false, exploded: false };
                   dice.push(newDie);
                   addedCount++;
              }
              idx++;
          }
      }

      // 3. Min / Max
      const minMods = parsedMods.filter(m => m.type === 'min');
      const maxMods = parsedMods.filter(m => m.type === 'max');
      
      dice.forEach(die => {
          minMods.forEach(m => { 
              if (m.val !== undefined && die.current < m.val) {
                  die.current = m.val;
                  // Should we log this change? 
                  // Standard notation usually just shows the result.
                  // Or "1->3". Let's update history to show it.
                  die.history.push(m.val);
              } 
          });
          maxMods.forEach(m => { 
              if (m.val !== undefined && die.current > m.val) {
                  die.current = m.val;
                  die.history.push(m.val);
              } 
          });
      });

      // 4. Keep / Drop
      const keepMod = parsedMods.slice().reverse().find(m => ['kh','kl','dh','dl','k','l'].includes(m.type));
      
      if (keepMod) {
          const val = keepMod.val !== undefined ? keepMod.val : 1;
          
          // We need to identify WHICH dice to drop.
          // Sort a copy to find the threshold/indices, but we must mark the ORIGINAL dice objects.
          // We can attach original index to sort.
          
          const indexedDice = dice.map((d, i) => ({ val: d.current, index: i }));
          const sorted = indexedDice.sort((a,b) => a.val - b.val);
          
          let indicesToKeep = new Set<number>();
          let keepCount = 0;
          
          if (keepMod.type === 'kh' || keepMod.type === 'k' || keepMod.type === 'dl') {
               // Keep Highest N / Drop Lowest N
               if (keepMod.type === 'dl') keepCount = Math.max(0, dice.length - val);
               else keepCount = val;
               
               // Take the LAST keepCount items from sorted (highest)
               // However, if we keep 3 highest, we take from end.
               const keptItems = sorted.slice(Math.max(0, sorted.length - keepCount));
               keptItems.forEach(item => indicesToKeep.add(item.index));
          } else {
               // Keep Lowest N / Drop Highest N
               if (keepMod.type === 'dh') keepCount = Math.max(0, dice.length - val);
               else keepCount = val;
               
               // Take the FIRST keepCount items
               const keptItems = sorted.slice(0, Math.min(sorted.length, keepCount));
               keptItems.forEach(item => indicesToKeep.add(item.index));
          }
          
          dice.forEach((d, i) => {
              if (!indicesToKeep.has(i)) {
                  d.dropped = true;
              }
          });
      }

      // Calculate Total
      const activeDice = dice.filter(d => !d.dropped);
      const termTotal = activeDice.reduce((acc, d) => acc + d.current, 0);
      
      // Format Detail String
      // Format: [1, 2->5, ~~3~~, 6!]
      const diceStrings = dice.map(d => {
          let s = '';
          if (d.history.length > 1) {
              // Rerolls: "1->2" or just final "2"?
              // "1->2" is clearer.
              // If min/max modified it, it will also show.
              s = d.history.join('➔');
          } else {
              s = d.current.toString();
          }
          
          if (d.exploded) s += '!';
          
          if (d.dropped) return `~~${s}~~`;
          return s;
      });
      
      detailParts.push(`${operator} ${countStr}d${sidesStr}${modsStr}[${diceStrings.join(', ')}]`);
      
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
  const diceRegex = /\[([0-9dD+\-khlKHL!xXrRminax<>=]+)\]/g;
  const rollDetails: string[] = [];
  let hasRolls = false;

  const processedText = text.replace(diceRegex, (match, notation) => {
    try {
      hasRolls = true;
      const { total, detail } = rollDiceNotation(notation);
      rollDetails.push(`${detail} = ${total}`); 
      return `**${total}**`;
    } catch (e) {
      return match;
    }
  });

  return { processedText, rollDetails, hasRolls };
};

export const processTextWithMechanics = (
  text: string, 
  collections: Collection[]
): { processedText: string, details: string[], hasRolls: boolean } => {
  let currentText = text;
  let allDetails: string[] = [];
  let hasRolls = false;

  // 1. Resolve Collections: {CollectionName}
  const collectionRegex = /\{([^}]+)\}/g;
  
  currentText = currentText.replace(collectionRegex, (match, content) => {
      const collection = collections.find(c => c.title.toLowerCase() === content.toLowerCase());
      
      // Filter out special built-ins that shouldn't be rolled via text
      if (collection && (collection.id === 'built-in-visual-portent' || collection.id === 'built-in-deck' || collection.id === 'built-in-portent')) {
          return match;
      }
      
      if (collection && collection.items.length > 0) {
          hasRolls = true; // Trigger sound for collections too
          const item = collection.items[Math.floor(Math.random() * collection.items.length)];
          
          // Recursive processing for the item content (it might have sub-tables or dice)
          const subResult = processCollectionText(item.text, collections);
          
          // Format detail
          allDetails.push(`{${collection.title}}[${subResult.text}]`);
          if (subResult.details.length > 0) {
              allDetails.push(...subResult.details);
          }
          
          // Only bold if no mentions/tags to avoid breaking link parsing
          const hasLinks = /[@#][\p{L}0-9_]+/u.test(subResult.text);
          return hasLinks ? subResult.text : `**${subResult.text}**`;
      }
      return match;
  });

  // 2. Resolve Dice: [1d20]
  const diceResult = processTextWithDice(currentText);
  if (diceResult.hasRolls) hasRolls = true;
  allDetails.push(...diceResult.rollDetails);
  
  return {
      processedText: diceResult.processedText,
      details: allDetails,
      hasRolls
  };
};

export const processCollectionText = (
  text: string, 
  collections: Collection[], 
  depth: number = 0
): { text: string, details: string[] } => {
  if (depth > 5) return { text, details: [] };

  let currentText = text;
  let allDetails: string[] = [];

  // 1. Resolve Tables: {TableName}
  const tableRegex = /\{([^}]+)\}/g;
  
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
  type: 'mention' | 'tag' | 'bold' | 'dice' | 'collection';
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
    | { type: 'collection'; value: string }
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
  const diceRegex = /\[([0-9dD+\-khlKHL!xXrRminax<>=]+)\]/g;
  const collectionRegex = /\{([^}]+)\}/g;

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
  
  // Find {collection}
  while ((match = collectionRegex.exec(content)) !== null) {
    links.push({
      type: 'collection',
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
    } else if (link.type === 'collection') {
      parts.push({ type: 'collection', value: link.value });
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