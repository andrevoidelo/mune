import React, { useState } from 'react';
import { LogEntry } from '../types';
import { rollD, generateUUID, getLuminance } from '../utils';
import { useGameSound } from '../hooks/useGameSound';
import { useTheme } from '../contexts/ThemeContext';
import { Dices, HelpCircle, Map, Zap, AlertTriangle, User, Compass, Box, MessageSquare, Copy, Check, Trash2 } from 'lucide-react';

interface OracleOPSEViewProps {
  addLog: (entry: LogEntry) => void;
}

// --- CONSTANTES E TABELAS ---

const SUITS = ['Paus', 'Ouros', 'Espadas', 'Copas'];
const SUIT_EMOJIS: Record<string, string> = {
  Paus: '♣️',
  Ouros: '♦️',
  Espadas: '♠️',
  Copas: '♥️'
};
const SUIT_DOMAINS = {
  Paus: 'Físico: aparência, existência',
  Ouros: 'Técnico: mental, operação',
  Espadas: 'Místico: significado, capacidade',
  Copas: 'Social: pessoal, conexão'
};

const CARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const TABLES = {
  SCENE_COMPLICATION: [
    "Forças hostis se opõem a você",
    "Um obstáculo bloqueia seu caminho",
    "Não seria terrível se...",
    "Um NPC age de repente",
    "Tudo não é o que parece",
    "As coisas realmente acontecem como planejado"
  ],
  ALTERED_SCENE: [
    "Um detalhe importante da cena é melhorado ou de alguma forma piorado",
    "O ambiente é diferente",
    "NPCs inesperados(as) estão presentes",
    "Adicione uma COMPLICAÇÃO DE CENA",
    "Adicione um MOVIMENTO DE RITMO",
    "Adicione um EVENTO ALEATÓRIO"
  ],
  ORACLE_HOW: [
    "Surpreendentemente aquém do esperado",
    "Menos do que o esperado",
    "Cerca da média",
    "Cerca da média",
    "Mais do que o esperado",
    "Extraordinariamente além do esperado"
  ],
  PACING_MOVES: [
    "Prenunciar Problemas",
    "Revelar um Novo Detalhe",
    "Um NPC Toma uma Ação",
    "Avançar uma Ameaça",
    "Avançar uma Trama",
    "Adicionar um EVENTO ALEATÓRIO à cena"
  ],
  FAILURE_MOVES: [
    "Causar Dano",
    "Colocar Alguém em Apuros",
    "Oferecer uma Escolha",
    "Avançar uma Ameaça",
    "Revelar uma Verdade Indesejada",
    "Prenunciar Problemas"
  ],
  ACTION_FOCUS: [
    "Buscar", "Opor-se", "Comunicar", "Mover", "Prejudicar", "Criar", "Revelar", "Comandar", "Pegar", "Proteger", "Ajudar", "Transformar", "Enganar"
  ],
  DETAIL_FOCUS: [
    "Pequeno(a)", "Grande", "Velho(a)", "Novo(a)", "Mundano(a)", "Simples", "Complexo(a)", "Desagradável", "Especializado(a)", "Inesperado(a)", "Exótico(a)", "Digno(a)", "Único(a)"
  ],
  TOPIC_FOCUS: [
    "Necessidade Atual", "Aliados(as)", "Comunidade", "História", "Planos Futuros", "Inimigos(as)", "Conhecimento", "Rumores", "Arco da Trama", "Eventos Recentes", "Equipamento", "Uma Facção", "Os Personagens"
  ],
  NPC_IDENTITY: [
    "Fora da Lei", "Andarilho(a)", "Artesão(ã)", "Plebeu(ia)", "Soldado(a)", "Mercador(a)", "Especialista", "Artista", "Adepto(a)", "Líder", "Místico(a)", "Aventureiro(a)", "Lord/Lady"
  ],
  NPC_GOAL: [
    "Obter", "Aprender", "Prejudicar", "Restaurar", "Encontrar", "Viajar", "Proteger", "Enriquecer", "Vingar", "Cumprir Dever", "Escapar", "Criar", "Servir"
  ],
  NPC_FEATURE: [
    "Sem destaque",
    "Natureza notável",
    "Traço físico óbvio",
    "Peculiaridade ou mania",
    "Equipamento incomum",
    "Idade ou origem inesperada"
  ],
  PLOT_OBJECTIVE: [
    "Eliminar uma ameaça", "Descobrir a verdade", "Recuperar algo valioso", "Escoltar ou levar em segurança", "Restaurar algo quebrado", "Salvar um(a) aliado(a) em perigo"
  ],
  PLOT_ADVERSARIES: [
    "Uma organização poderosa", "Foras da lei", "Guardiões/Guardiãs", "Habitantes locais", "Horda ou força inimiga", "Um(a) vilão(ã) novo(a) ou recorrente"
  ],
  PLOT_REWARDS: [
    "Dinheiro ou valores", "Dinheiro ou valores", "Conhecimento e segredos", "Apoio de um(a) aliado(a)", "Avançar um arco da trama", "Um item único de poder"
  ],
  DUNGEON_LOCATION: [
    "Área típica", "Área de transição", "Área de vivência ou reunião", "Área de trabalho ou utilitária", "Área com característica especial", "Local para propósito especializado"
  ],
  DUNGEON_ENCOUNTER: [
    "Nenhum", "Nenhum", "Inimigos(as) hostis", "Inimigos(as) hostis", "Um obstáculo bloqueia o caminho", "NPC ou adversário(a) único(a)"
  ],
  DUNGEON_OBJECT: [
    "Nada, ou objetos mundanos", "Nada, ou objetos mundanos", "Um item ou pista interessante", "Uma ferramenta útil, chave ou dispositivo", "Algo valioso", "Item raro ou especial"
  ],
  HEX_TERRAIN: [
    "Igual ao hexágono atual", "Igual ao hexágono atual", "Terreno comum", "Terreno comum", "Terreno incomum", "Terreno raro"
  ],
  HEX_CONTENTS: [
    "Nada notável", "Nada notável", "Nada notável", "Nada notável", "Nada notável", "Rolar uma CARACTERÍSTICA"
  ],
  HEX_FEATURE: [
    "Estrutura notável", "Perigo Grave", "Um assentamento", "Característica natural estranha", "Nova região (definir novos tipos de terreno)", "Entrada de MASMORRA"
  ],
  HEX_EVENT: [
    "Nenhum", "Nenhum", "Nenhum", "Nenhum", "EVENTO ALEATÓRIO então DEFINIR A CENA", "EVENTO ALEATÓRIO então DEFINIR A CENA"
  ]
};

// --- FUNÇÕES AUXILIARES ---

const drawCard = () => {
  const rankIdx = Math.floor(Math.random() * 13);
  const suitIdx = Math.floor(Math.random() * 4);
  const rank = CARDS[rankIdx];
  const suit = SUITS[suitIdx];
  const domain = SUIT_DOMAINS[suit as keyof typeof SUIT_DOMAINS];
  const emoji = SUIT_EMOJIS[suit];
  
  return { rankIdx, suitIdx, rank, suit, domain, emoji };
};

const OracleOPSEView: React.FC<OracleOPSEViewProps> = ({ addLog }) => {
  const { activeThemeId, allThemes } = useTheme();
  const activeTheme = allThemes.find(t => t.id === activeThemeId);
  const isLightMode = activeTheme ? getLuminance(activeTheme.colors.appBg) > 128 : false;
  const { play } = useGameSound();

  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastTitle, setLastTitle] = useState<string>('Oráculo O.P.S.E.');
  const [lastDetail, setLastDetail] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Helper to calculate font size based on text length
  const getResultFontSize = (text: string | null) => {
    if (!text) return 'text-4xl';
    const len = text.length;
    if (len > 200) return 'text-xs';
    if (len > 100) return 'text-sm';
    if (len > 50) return 'text-base';
    if (len > 25) return 'text-xl';
    return 'text-4xl';
  };

  const handleCopy = async () => {
    if (!lastResult) return;
    try {
        const cleanText = lastResult.replace(/\*\*/g, '');
        await navigator.clipboard.writeText(cleanText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy!', err);
    }
  };

  const handleClear = () => {
    play('CLICK');
    setLastResult(null);
    setLastTitle('Oráculo O.P.S.E.');
    setLastDetail(null);
  };

  const logResult = (title: string, result: string, details: string, color?: string) => {
    setLastTitle(title);
    setLastResult(result);
    setLastDetail(details);

    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'ORACLE',
      title: `OPSE: ${title}`,
      result: result,
      details: details,
      color: color
    });
  };

  const handleOracleYesNo = (odds: 'Provável' | 'Média' | 'Improvável') => {
    play('ROLL');
    const answerDie = rollD(6);
    const modDie = rollD(6);
    
    let isYes = false;
    let target = "";
    let color = 'primary';
    if (odds === 'Provável') { 
      isYes = answerDie >= 3; 
      target = "3+"; 
      color = 'success';
    }
    else if (odds === 'Média') { 
      isYes = answerDie >= 4; 
      target = "4+"; 
      color = 'primary';
    }
    else if (odds === 'Improvável') { 
      isYes = answerDie >= 5; 
      target = "5+"; 
      color = 'red';
    }

    let modSuffix = "";
    let modDetail = "";
    if (modDie === 1) {
      modSuffix = ", mas...";
      modDetail = "Mas...";
    } else if (modDie === 6) {
      modSuffix = ", e...";
      modDetail = "E...";
    }

    const text = `**${isYes ? "Sim" : "Não"}**${modSuffix}`;
    const details = `Prob: ${odds} (${target}) | 1d6[${answerDie}] ➔ ${isYes ? 'Sim' : 'Não'} | 1d6[${modDie}]${modDetail ? ` ➔ ${modDetail}` : ''}`;
    
    logResult("Sim/Não", text, details, color);
  };

  const handleSimpleRoll = (title: string, table: string[], color?: string) => {
    play('ROLL');
    const roll = rollD(6);
    const result = `**${table[roll - 1]}**`;
    logResult(title, result, `1d6[${roll}]`, color);
  };

  const handleSetScene = () => {
    play('ROLL');
    const roll = rollD(6);
    if (roll >= 5) {
       const altRoll = rollD(6);
       const altResult = TABLES.ALTERED_SCENE[altRoll - 1];
       logResult("Definir Cena", `Cena: **Alterada**\n\nDetalhe: **${altResult}**`, `1d6[${roll}] | 1d6[${altRoll}]`, 'sky');
    } else {
       logResult("Definir Cena", "**Cena Padrão**", `1d6[${roll}]`, 'sky');
    }
  };

  const handleDrawFocus = (title: string, table: string[], color?: string) => {
    play('CARD');
    const { rankIdx, rank, emoji, domain } = drawCard();
    const focus = table[rankIdx];
    // Title is already passed as "Foco de Ação", "Foco de Detalhe" etc.
    const result = `**${focus}** (${domain})`;
    const details = `Carta[${rank}${emoji}]`;
    logResult(title, result, details, color);
  };

  const handleRandomEvent = () => {
    play('CARD');
    const act = drawCard();
    const topic = drawCard();
    
    const actionTxt = TABLES.ACTION_FOCUS[act.rankIdx];
    const topicTxt = TABLES.TOPIC_FOCUS[topic.rankIdx];
    
    const result = `Foco de Ação: **${actionTxt}** (${act.domain})\n\nFoco de Tópico: **${topicTxt}** (${topic.domain})`;
    const details = `Cartas[${act.rank}${act.emoji}, ${topic.rank}${topic.emoji}]`;
    
    logResult("Evento Aleatório", result, details, 'fuchsia');
  };

  const handleNpcGen = () => {
    play('CARD');
    play('ROLL');
    const id = drawCard();
    const goal = drawCard();
    const featRoll = rollD(6);
    
    const idTxt = TABLES.NPC_IDENTITY[id.rankIdx];
    const goalTxt = TABLES.NPC_GOAL[goal.rankIdx];
    const featTxt = TABLES.NPC_FEATURE[featRoll - 1];
    
    const detail = drawCard();
    const detailTxt = TABLES.DETAIL_FOCUS[detail.rankIdx];

    const result = `Identidade: **${idTxt}** (${id.domain})\n\nObjetivo: **${goalTxt}** (${goal.domain})\n\nCaracterística: **${featTxt}**\n\nDetalhe: **${detailTxt}** (${detail.domain})`;
    const details = `Cartas[${id.rank}${id.emoji}, ${goal.rank}${goal.emoji}, ${detail.rank}${detail.emoji}] + 1d6[${featRoll}]`;
    
    logResult("Gerador de NPC", result, details, 'pink');
  };

  const handlePlotGen = () => {
    play('ROLL');
    const r1 = rollD(6);
    const r2 = rollD(6);
    const r3 = rollD(6);
    
    const obj = TABLES.PLOT_OBJECTIVE[r1 - 1];
    const adv = TABLES.PLOT_ADVERSARIES[r2 - 1];
    const rew = TABLES.PLOT_REWARDS[r3 - 1];
    
    const result = `Objetivo: **${obj}**\n\nAdversário: **${adv}**\n\nRecompensa: **${rew}**`;
    logResult("Gancho de Trama", result, `3d6[${r1},${r2},${r3}]`, 'emerald');
  };

  const handleDungeon = () => {
    play('ROLL');
    const r1 = rollD(6);
    const r2 = rollD(6);
    const r3 = rollD(6);
    const r4 = rollD(6);

    const loc = TABLES.DUNGEON_LOCATION[r1 - 1];
    const enc = TABLES.DUNGEON_ENCOUNTER[r2 - 1];
    const obj = TABLES.DUNGEON_OBJECT[r3 - 1];
    
    const exits = r4 <= 2 ? "Sem saída" : (r4 <= 4 ? "1 Saída" : "2 Saídas");

    const result = `Local: **${loc}**\n\nEncontro: **${enc}**\n\nObjeto: **${obj}**\n\nSaídas: **${exits}**`;
    logResult("Masmorra", result, `4d6[${r1},${r2},${r3},${r4}]`, 'purple');
  };

  const handleHex = () => {
    play('ROLL');
    const r1 = rollD(6);
    const r2 = rollD(6);
    const r3 = rollD(6);

    const terr = TABLES.HEX_TERRAIN[r1 - 1];
    let content = TABLES.HEX_CONTENTS[r2 - 1];
    
    if (r2 === 6) {
        const featRoll = rollD(6);
        const feat = TABLES.HEX_FEATURE[featRoll - 1];
        content = `CARACTERÍSTICA: **${feat}**`;
    } else {
        content = `**${content}**`;
    }
    
    const evt = TABLES.HEX_EVENT[r3 - 1];
    
    const result = `Terreno: **${terr}**\n\nConteúdo: ${content}\n\nEvento: **${evt}**`;
    logResult("Hex Crawl", result, `3d6[${r1},${r2},${r3}]`, 'lime');
  };

  // Button Style helper
  const btnStyle = (colorClass: string) => `
    flex flex-col items-center justify-center p-1.5 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all shadow-sm ${colorClass} min-h-[48px]
  `;

  // Helper for theme-aware button colors - Using explicit classes for Tailwind JIT
  const getBtnColors = (color: 'fuchsia' | 'emerald' | 'pink' | 'purple' | 'lime' | 'slate' | 'sky' | 'orange' | 'cyan' | 'red' | 'violet' | 'indigo') => {
    switch (color) {
      case 'fuchsia': return 'bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400';
      case 'emerald': return 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
      case 'pink': return 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/30 text-pink-600 dark:text-pink-400';
      case 'purple': return 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-600 dark:text-purple-400';
      case 'lime': return 'bg-lime-500/10 hover:bg-lime-500/20 border-lime-500/30 text-lime-600 dark:text-lime-400';
      case 'slate': return 'bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/30 text-slate-600 dark:text-slate-400';
      case 'sky': return 'bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/30 text-sky-600 dark:text-sky-400';
      case 'orange': return 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-600 dark:text-orange-400';
      case 'cyan': return 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-600 dark:text-cyan-400';
      case 'red': return 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400';
      case 'violet': return 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 text-violet-600 dark:text-violet-400';
      case 'indigo': return 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-400';
      default: return '';
    }
  };

  // Helper for rendering formatted result
  const renderFormattedResult = (text: string | null) => {
    if (!text) return "...";
    
    const parseMarkdown = (val: string) => {
      const parts = val.split('**');
      return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} className="font-bold text-txt-main">{part}</strong> : part));
    };

    return text.split('\n').map((line, idx) => {
      const colonIndex = line.indexOf(':');
      const label = colonIndex !== -1 ? line.substring(0, colonIndex + 1) : '';
      
      // Only treat as Label: Value if colon exists AND label doesn't contain markdown formatting
      if (colonIndex !== -1 && !label.includes('**')) {
        const value = line.substring(colonIndex + 1);
        return (
          <React.Fragment key={idx}>
            <span className="font-medium text-txt-muted">{label}</span>
            <span className="text-txt-main">{parseMarkdown(value)}</span>
            {idx < text.split('\n').length - 1 && <br />}
          </React.Fragment>
        );
      }
      return (
        <React.Fragment key={idx}>
          <span className="text-txt-main">{parseMarkdown(line)}</span>
          {idx < text.split('\n').length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  const sectionHeader = (title: string, Icon: any) => (
    <h3 className="text-[10px] font-bold text-txt-muted uppercase tracking-wider mb-1 mt-2 first:mt-0 flex items-center gap-1">
      <Icon size={12} /> {title}
    </h3>
  );

  return (
    <div className="flex flex-col h-full w-full bg-app overflow-hidden">
      {/* Result Area - Fills remaining space */}
      <div className="flex-1 p-3 w-full max-w-none mx-auto min-h-0 flex flex-col">
        <div className={`w-full flex-1 bg-card border-2 ${lastResult?.includes('Sim') ? 'border-success/50 shadow-success/10' : (lastResult?.includes('Não') ? 'border-error/50 shadow-error/10' : 'border-border')} rounded-2xl p-4 text-center shadow-lg flex flex-col items-center justify-center relative transition-all duration-300 overflow-y-auto`}>
            <h2 className="text-txt-muted text-xs uppercase mb-2 tracking-widest sticky top-0 bg-card/90 w-full backdrop-blur-sm z-10">{lastTitle}</h2>
            <div className="flex-1 flex flex-col justify-center w-full">
              <p className={`font-serif leading-snug whitespace-pre-wrap ${getResultFontSize(lastResult)}`}>
                {renderFormattedResult(lastResult)}
              </p>
              {lastDetail && <p className="text-[10px] text-txt-dim mt-4 font-mono">{lastDetail}</p>}
            </div>
            
            {lastResult && (
              <>
                <button
                  onClick={handleClear}
                  className="absolute bottom-2 left-2 p-2 text-txt-dim hover:text-error hover:bg-error/10 rounded-full transition-all duration-300"
                  title="Limpar resultado"
                >
                  <Trash2 size={20} />
                </button>

                <button 
                  onClick={handleCopy}
                  className={`absolute bottom-2 right-2 p-2 rounded-full transition-all duration-300 ${
                    isCopied 
                      ? 'bg-success text-on-success scale-110' 
                      : 'text-txt-dim hover:text-primary hover:bg-primary/10'
                  }`}
                  title="Copiar resultado"
                >
                  {isCopied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </>
            )}
        </div>
      </div>


      {/* Controls Footer - Grouped and Compact */}
      <div className="flex-none w-full bg-card/50 border-t border-border p-3 pb-safe">
        <div className="max-w-4xl mx-auto space-y-2">
          
          {/* Section 1: Generators (Now Top) */}
          <div>
            {sectionHeader("Geradores", Box)}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleRandomEvent} className={`${btnStyle(getBtnColors('fuchsia'))} !flex-row gap-2`}>
                  <AlertTriangle size={16} />
                  <span className="font-bold text-[12px]">Evento Aleat.</span>
              </button>
              <button onClick={handlePlotGen} className={`${btnStyle(getBtnColors('emerald'))} !flex-row gap-2`}>
                  <MessageSquare size={16} />
                  <span className="font-bold text-[12px]">Trama</span>
              </button>
              <button onClick={handleNpcGen} className={`${btnStyle(getBtnColors('pink'))} !flex-row gap-2`}>
                  <User size={16} />
                  <span className="font-bold text-[12px]">NPC</span>
              </button>
              <button onClick={handleDungeon} className={`${btnStyle(getBtnColors('purple'))} !flex-row gap-2`}>
                  <Compass size={16} />
                  <span className="font-bold text-[12px]">Masmorra</span>
              </button>
              <button onClick={handleHex} className={`${btnStyle(getBtnColors('lime'))} !flex-row gap-2`}>
                  <Map size={16} />
                  <span className="font-bold text-[12px]">Hex Crawl</span>
              </button>
              <button onClick={() => {
                  play('ROLL');
                  play('CARD');
                  const act = drawCard();
                  const det = drawCard();
                  const how = rollD(6);
                  const res = `O que: **${TABLES.ACTION_FOCUS[act.rankIdx]}** (${act.domain})\n\nAparência: **${TABLES.DETAIL_FOCUS[det.rankIdx]}** (${det.domain})\n\nSignificância: **${TABLES.ORACLE_HOW[how-1]}**`;
                  logResult("Gerador Genérico", res, `Cartas[${act.rank}${act.emoji}, ${det.rank}${det.emoji}] + 1d6[${how}]`, 'slate');
              }} className={`${btnStyle(getBtnColors('slate'))} !flex-row gap-2`}>
                  <Box size={16} />
                  <span className="font-bold text-[12px]">Genérico</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4">
            {/* Section 2: Scene & Moves */}
            <div>
              {sectionHeader("Cena & Movimentos", Zap)}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleSetScene} className={btnStyle(getBtnColors('sky'))}>
                  <span className="font-bold text-[12px]">Definir Cena</span>
                </button>
                <button onClick={() => handleSimpleRoll('Complicação de Cena', TABLES.SCENE_COMPLICATION, 'orange')} className={btnStyle(getBtnColors('orange'))}>
                  <span className="font-bold text-[12px]">Complicação</span>
                </button>
                <button onClick={() => handleSimpleRoll('Movimento de Ritmo', TABLES.PACING_MOVES, 'cyan')} className={btnStyle(getBtnColors('cyan'))}>
                  <span className="font-bold text-[12px]">Mov. Ritmo</span>
                </button>
                <button onClick={() => handleSimpleRoll('Movimento de Falha', TABLES.FAILURE_MOVES, 'red')} className={btnStyle(getBtnColors('red'))}>
                  <span className="font-bold text-[12px]">Mov. Falha</span>
                </button>
              </div>
            </div>

            {/* Section 3: Focus */}
            <div>
              {sectionHeader("Questões Complexas", Dices)}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleSimpleRoll('Oráculo (Quão)', TABLES.ORACLE_HOW, 'violet')} className={btnStyle(getBtnColors('violet'))}>
                  <span className="font-bold text-[12px]">Quão?</span>
                </button>
                <button onClick={() => handleDrawFocus('Foco de Ação', TABLES.ACTION_FOCUS, 'indigo')} className={btnStyle(getBtnColors('indigo'))}>
                  <span className="font-bold text-[12px]">Ação</span>
                </button>
                <button onClick={() => handleDrawFocus('Foco de Detalhe', TABLES.DETAIL_FOCUS, 'indigo')} className={btnStyle(getBtnColors('indigo'))}>
                  <span className="font-bold text-[12px]">Detalhe</span>
                </button>
                <button onClick={() => handleDrawFocus('Foco de Tópico', TABLES.TOPIC_FOCUS, 'indigo')} className={btnStyle(getBtnColors('indigo'))}>
                  <span className="font-bold text-[12px]">Tópico</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Oracle (Bottom) */}
          <div>
            {sectionHeader("Oráculo (Sim/Não)", HelpCircle)}
            <div className="grid grid-cols-3 gap-3">
              {/* 5+ (Matches Desvantagem) */}
              <button 
                onClick={() => handleOracleYesNo('Improvável')} 
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all shadow-sm min-h-[56px] ${
                  isLightMode 
                    ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' 
                    : 'bg-red-900/20 text-red-400 border-red-700/50 hover:bg-red-900/30'
                }`}
              >
                  <span className="font-black text-lg">5+</span>
                  <span className={`text-[10px] uppercase font-bold ${isLightMode ? 'text-red-600/70' : 'text-red-400/70'}`}>Improvável</span>
              </button>

              {/* 4+ (Matches Rolar) */}
              <button 
                onClick={() => handleOracleYesNo('Média')} 
                className="flex flex-col items-center justify-center p-2 rounded-xl border-b-4 bg-primary hover:bg-primary-hover active:bg-primary-active border-primary-active active:border-b-0 active:translate-y-1 transition-all shadow-lg min-h-[56px]"
              >
                  <span className="font-black text-2xl text-on-primary">4+</span>
                  <span className="text-[10px] text-on-primary/80 uppercase font-bold tracking-widest">Média</span>
              </button>

              {/* 3+ (Matches Vantagem) */}
              <button 
                onClick={() => handleOracleYesNo('Provável')} 
                className={`flex flex-col items-center justify-center p-2 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all shadow-sm min-h-[56px] ${
                  isLightMode 
                    ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' 
                    : 'bg-green-900/20 text-green-400 border-green-700/50 hover:bg-green-900/30'
                }`}
              >
                  <span className="font-black text-lg">3+</span>
                  <span className={`text-[10px] uppercase font-bold ${isLightMode ? 'text-green-600/70' : 'text-green-400/70'}`}>Provável</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OracleOPSEView;
