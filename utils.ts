
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
