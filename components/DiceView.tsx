import React, { useState, useRef } from 'react';
import { LogEntry } from '../types';
import { rollDiceNotation, generateUUID } from '../utils';
import { Dices, Play, Delete, RefreshCw, ArrowDownToLine, ArrowUpToLine } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';

interface DiceViewProps {
  addLog: (entry: LogEntry) => void;
}

interface RollResult {
  total: number;
  detail: string;
  expression: string;
}

const DiceView: React.FC<DiceViewProps> = ({ addLog }) => {
  const [expression, setExpression] = useState('');
  const [lastResult, setLastResult] = useState<RollResult | null>(null); 
  const inputRef = useRef<HTMLInputElement>(null);
  const { play } = useGameSound();

  const handleRoll = (formulaOverride?: string) => {
    const formula = formulaOverride || expression;
    if (!formula.trim()) return;

    play('ROLL');

    const { total, detail } = rollDiceNotation(formula);

    setLastResult({
      total,
      detail,
      expression: formula
    });

    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'DICE',
      title: `Rolagem: ${formula}`,
      result: total.toString(),
      details: `${detail} = ${total}`
    });
  };

  const handleClear = () => {
    play('CLICK');
    setExpression('');
    setLastResult(null);
  };

  // Smart Handler para KH, KL, DH, DL
  const handleKeep = (mode: 'kh' | 'kl' | 'dh' | 'dl') => {
    play('CLICK');
    setExpression(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return prev;

      // Regex to find the last dice term and its modifiers
      const regex = /([+-]?\s*)d(\d+)((?:kh|kl|dh|dl)\d+)?$/;
      const match = trimmed.match(regex);

      if (!match) return prev;

      const prefix = match[1] || '';
      const sides = match[2];
      const currentMod = match[3];

      let newCount = 1;

      if (currentMod) {
        const currentType = currentMod.substring(0, 2);
        const val = parseInt(currentMod.substring(2));

        if (currentType === mode) {
          newCount = val + 1;
        }
      }

      return trimmed.replace(regex, `${prefix}d${sides}${mode}${newCount}`);
    });
  };

  // Smart Dice Adder
  const addDie = (sides: number) => {
    play('CLICK');
    setExpression(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return `1d${sides}`;

      // Check if the last term matches the die we are adding (ignoring modifiers for the match)
      // We look for: (optional operator)(count)d(sides)(modifiers)$
      const regex = new RegExp(`([+-]?\\s*)(\\d*)d${sides}([^d]*)$`);
      const match = trimmed.match(regex);

      if (match) {
        const prefix = match[1]; // operator or whitespace
        const currentCountStr = match[2];
        const tail = match[3] || ''; // modifiers

        const currentCount = currentCountStr === '' ? 1 : parseInt(currentCountStr);
        const newCount = currentCount + 1;
        
        // Use replace with the exact match to ensure we only update the end
        return trimmed.replace(regex, `${prefix}${newCount}d${sides}${tail}`);
      } else {
        // Append new term
        // Check if we need a + sign (if previous char is alphanumeric or !)
        const needsPlus = /[0-9a-z!]$/i.test(trimmed);
        return `${trimmed}${needsPlus ? '+' : ''}1d${sides}`;
      }
    });
  };

  const addModifier = (val: number) => {
    play('CLICK');
    setExpression(prev => {
      const trimmed = prev.trim();

      if (!trimmed) return val.toString();

      const regex = /([+-])\s*(\d+)$/;
      const match = trimmed.match(regex);

      if (match) {
        const operator = match[1];
        const currentNumber = parseInt(match[2]);

        const currentVal = operator === '-' ? -currentNumber : currentNumber;
        const newVal = currentVal + val;

        if (newVal === 0) {
            return trimmed.replace(regex, '').trim();
        }

        const newOperator = newVal >= 0 ? '+' : '-';
        const newAbsVal = Math.abs(newVal);

        return trimmed.replace(regex, `${newOperator}${newAbsVal}`);     
      }

      if (/[+-]$/.test(trimmed)) {
          return trimmed + Math.abs(val);
      }
      
      const newOperator = val >= 0 ? '+' : '';
      return `${trimmed}${newOperator}${val}`;
    });
  };
  
  const addSpecial = (text: string) => {
    play('CLICK');
    setExpression(prev => prev + text);
  };

  const diceTypes = [2, 4, 6, 8, 10, 12, 20, 100];

  const formatDetail = (text: string) => {
    // Split by ~~ to find strikethrough parts
    const parts = text.split(/~~(.*?)~~/g);
    return parts.map((part, i) => {
      // Even indices are normal text, odd are struck through
      if (i % 2 === 1) {
        return <span key={i} className="line-through opacity-50">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const modifierBtnClass = "bg-card border border-border rounded-lg py-2 landscape:py-1.5 text-sm font-bold text-txt-muted hover:text-txt-main uppercase tracking-wider flex items-center justify-center active:bg-card-hover font-mono";

  return (
    <div className="flex flex-col landscape:flex-row h-full bg-app overflow-hidden">
      
      {/* SECTION 1: Results Area */}
      <div className="flex-1 min-h-[20vh] w-full landscape:w-1/2 bg-app p-2 flex flex-col items-center justify-center relative overflow-hidden landscape:border-r landscape:border-border">
        {lastResult ? (
          <div className="w-full max-w-lg animate-in zoom-in fade-in duration-300 flex flex-col items-center text-center z-0">
            <span className="text-txt-dim text-xs sm:text-sm uppercase tracking-widest mb-2 font-mono break-all line-clamp-1 px-4 bg-card/50 rounded-full py-1">
              {lastResult.expression}
            </span>
            <div className="text-7xl sm:text-8xl leading-none font-black text-primary font-mono drop-shadow-[0_0_30px_rgba(var(--primary),0.2)] mb-4 select-all transition-all">
              {lastResult.total}
            </div>
            <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 border border-border w-full shadow-lg max-h-[20vh] overflow-y-auto mx-4">  
               <p className="text-xs sm:text-sm text-txt-muted font-mono break-words leading-relaxed">
                 {formatDetail(lastResult.detail)}
               </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-txt-dim flex flex-col items-center animate-pulse opacity-30 select-none">
            <Dices size={80} className="mb-4" />
            <p className="text-lg font-bold uppercase tracking-widest">Rolador</p>
          </div>
        )}
      </div>

      {/* SECTION 2: Input & Modifiers */}
      <div className="flex-none landscape:w-1/2 landscape:h-full landscape:overflow-y-auto bg-app p-3 landscape:p-2 pt-4 pb-6 landscape:pb-2 border-t landscape:border-t-0 border-border shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 rounded-t-2xl landscape:rounded-none flex flex-col justify-center landscape:justify-start">
        <div className="flex flex-col gap-2 landscape:gap-1 max-w-md mx-auto w-full">
           
           {/* Input Row */}
           <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => addModifier(-1)}
                className="w-12 h-12 landscape:h-9 flex-none flex items-center justify-center bg-error/20 border border-error/50 rounded-xl text-error font-bold transition-all active:scale-95 shadow-sm text-lg"
              >
                -1
              </button>

              <div className="relative flex-1">
                 <input
                  ref={inputRef}
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}        
                  onKeyDown={(e) => { if(e.key === 'Enter') handleRoll(); }}
                  placeholder="Ex: 2d20kh1+5"
                  className="w-full h-12 landscape:h-9 bg-app border-2 border-border focus:border-primary rounded-xl pl-9 pr-2 text-center text-lg landscape:text-base font-mono text-txt-main outline-none transition-colors placeholder-txt-dim shadow-inner"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-dim pointer-events-none">
                  <Dices size={18} />
                </div>
              </div>

              <button
                onClick={() => addModifier(1)}
                className="w-12 h-12 landscape:h-9 flex-none flex items-center justify-center bg-success/20 border border-success/50 rounded-xl text-success font-bold transition-all active:scale-95 shadow-sm text-lg"   
              >
                +1
              </button>
           </div>
           
           {/* Row 0: Comparison & Range (New) */}
           <div className="grid grid-cols-4 gap-2 w-full">
               <button onClick={() => addSpecial('<')} className={modifierBtnClass}>&lt;</button>
               <button onClick={() => addSpecial('>')} className={modifierBtnClass}>&gt;</button>
               <button onClick={() => addSpecial('min')} className={modifierBtnClass}>min</button>
               <button onClick={() => addSpecial('max')} className={modifierBtnClass}>max</button>
           </div>

           {/* Row 1: Keep/Drop */}
           <div className="grid grid-cols-4 gap-2 w-full">
               <button onClick={() => handleKeep('kh')} className={modifierBtnClass} title="Manter Maior (Keep Highest)">KH</button>
               <button onClick={() => handleKeep('kl')} className={modifierBtnClass} title="Manter Menor (Keep Lowest)">KL</button>
               <button onClick={() => handleKeep('dh')} className={modifierBtnClass} title="Descartar Maior (Drop Highest)">DH</button>
               <button onClick={() => handleKeep('dl')} className={modifierBtnClass} title="Descartar Menor (Drop Lowest)">DL</button>
           </div>

           {/* Row 2: Advanced & Clear */}
           <div className="grid grid-cols-4 gap-2 w-full">
              <button
                 onClick={() => addSpecial('x')}
                 className={modifierBtnClass}
                 title="Explodir (x)"
              >
                 ! x
              </button>
              <button
                 onClick={() => addSpecial('r')}
                 className={modifierBtnClass}
                 title="Rolar Novamente (r)"
              >
                 R
              </button>
              <button
                 onClick={() => addSpecial('rr')}
                 className={modifierBtnClass}
                 title="Rolar Novamente Recursivo (rr)"
              >
                 RR
              </button>
              <button
                onClick={handleClear}
                className="bg-error/20 hover:bg-error/40 border border-error/50 rounded-lg py-2 landscape:py-1.5 text-[10px] sm:text-xs font-bold text-error hover:text-error uppercase tracking-wider active:scale-95 transition-colors flex items-center justify-center"
              >
                Limpar
              </button>
           </div>

           {/* Dice Grid */}
           <div className="grid grid-cols-4 gap-2 w-full">
             {diceTypes.map((sides) => {
               // Determine SVG shape
               const shape = `d${sides}`;

               return (
                 <button
                   key={sides}
                   onClick={() => addDie(sides)}
                   className="aspect-square relative flex items-center justify-center transition-all active:scale-95 group"
                 >
                   {/* Die Shape (Masked) */}
                   <div 
                      className="absolute inset-0 bg-txt-muted group-hover:bg-txt-main transition-colors opacity-50 group-hover:opacity-100"
                      style={{
                          maskImage: `url("/dice/${shape}.svg")`,
                          maskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          maskSize: 'contain',
                          WebkitMaskImage: `url("/dice/${shape}.svg")`,
                          WebkitMaskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          WebkitMaskSize: 'contain'
                      }}
                   />
                   
                   {/* Number */}
                   <span className="relative z-10 text-lg sm:text-xl font-black text-txt-main drop-shadow-md">
                     d{sides}
                   </span>
                 </button>
               );
             })}
           </div>

           {/* Roll Button */}
           <button
             onClick={() => handleRoll()}
             disabled={!expression.trim()}
             className="w-full mt-1 bg-primary hover:bg-primary-hover active:bg-primary-active border-b-4 enabled:border-primary-active disabled:border-border active:border-b-0 active:translate-y-1 disabled:bg-card disabled:text-txt-dim disabled:cursor-not-allowed text-on-primary font-black text-xl landscape:text-lg uppercase tracking-wider py-3.5 landscape:py-2.5 rounded-xl enabled:shadow-lg transition-all flex items-center justify-center gap-2"
           >
             <Dices size={22} /> Rolar
           </button>
        </div>
      </div>
    </div>
  );
};

export default DiceView;