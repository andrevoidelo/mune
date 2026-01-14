
import { PORTENT_ADJECTIVES, PORTENT_NOUNS } from "./constants";
import { LogEntry } from "./types";

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
  
  const num = parseInt(c, 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00FF) + percent;
  let b = (num & 0x0000FF) + percent;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
};
