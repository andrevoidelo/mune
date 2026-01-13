
import React, { useState, useRef } from 'react';
import { LogEntry } from '../types';
import { rollDiceNotation, generateUUID } from '../utils';
import { Dices, Play, Delete } from 'lucide-react';
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
    
    // Determine sound based on result quality (generic heuristic)
    // We look at the total or if it's a single d20 roll
    const isSingleD20 = formula.includes('d20') && !formula.includes('2d20'); // Crude check

    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'DICE',
      title: `Rolagem: ${formula}`,
      result: total.toString(),
      details: detail
    });
  };

  const handleClear = () => {
    play('CLICK');
    setExpression('');
    setLastResult(null);
    // Foco removido para evitar abrir teclado no mobile
  };

  // Smart Handler para KH e KL (Keep Highest / Keep Lowest)
  const handleKeep = (mode: 'kh' | 'kl') => {
    play('CLICK');
    setExpression(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return prev;

      const regex = /([+-]?\s*[\d]*)d(\d+)(kh\d+|kl\d+)?$/;
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
    // Foco removido para evitar abrir teclado no mobile
  };

  // Smart Dice Adder
  const addDie = (sides: number) => {
    play('CLICK');
    setExpression(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return `1d${sides}`;

      const regex = new RegExp(`([+-]?\\s*)(\\d*)d${sides}(kh\\d+|kl\\d+)?$`);
      const match = trimmed.match(regex);

      if (match) {
        const prefix = match[1];
        const currentCount = match[2] === '' ? 1 : parseInt(match[2]);
        const modifiers = match[3] || '';
        
        const newCount = currentCount + 1;
        return trimmed.replace(regex, `${prefix}${newCount}d${sides}${modifiers}`);
      } else {
        const needsPlus = /[\w\d\)\]]$/.test(trimmed);
        return `${trimmed}${needsPlus ? '+' : ''}1d${sides}`;
      }
    });
    // Foco removido para evitar abrir teclado no mobile
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

  const diceTypes = [2, 4, 6, 8, 10, 12, 20, 100];

  return (
    <div className="flex flex-col landscape:flex-row h-full bg-slate-900 overflow-hidden">
      
      {/* SECTION 1: Results Area */}
      <div className="flex-1 min-h-[20vh] w-full landscape:w-1/2 bg-slate-900 p-2 flex flex-col items-center justify-center relative overflow-hidden landscape:border-r landscape:border-slate-800">
        {lastResult ? (
          <div className="w-full max-w-lg animate-in zoom-in fade-in duration-300 flex flex-col items-center text-center z-0">
            <span className="text-slate-500 text-xs sm:text-sm uppercase tracking-widest mb-2 font-mono break-all line-clamp-1 px-4 bg-slate-800/50 rounded-full py-1">
              {lastResult.expression}
            </span>
            <div className="text-7xl sm:text-8xl leading-none font-black text-amber-500 font-mono drop-shadow-[0_0_30px_rgba(245,158,11,0.2)] mb-4 select-all transition-all">
              {lastResult.total}
            </div>
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 border border-slate-700 w-full shadow-lg max-h-[20vh] overflow-y-auto mx-4">
               <p className="text-xs sm:text-sm text-slate-300 font-mono break-words leading-relaxed">
                 {lastResult.detail}
               </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-700 flex flex-col items-center animate-pulse opacity-30 select-none">
            <Dices size={80} className="mb-4" />
            <p className="text-lg font-bold uppercase tracking-widest">Rolador</p>
          </div>
        )}
      </div>

      {/* SECTION 2: Input & Modifiers */}
      <div className="flex-none landscape:w-1/2 landscape:h-full landscape:overflow-y-auto bg-slate-950 p-3 pt-4 pb-6 border-t landscape:border-t-0 border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 rounded-t-2xl landscape:rounded-none flex flex-col justify-center">
        <div className="flex flex-col gap-2 max-w-md mx-auto w-full">
           
           {/* Input Row */}
           <div className="flex items-center gap-2 w-full">
              <button 
                onClick={() => addModifier(-1)}
                className="w-12 h-12 flex-none flex items-center justify-center bg-modifier-red-bg border border-modifier-red/50 rounded-xl text-modifier-red font-bold transition-all active:scale-95 shadow-sm text-lg"
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
                  className="w-full h-12 bg-slate-900 border-2 border-slate-700 focus:border-amber-500 rounded-xl pl-9 pr-2 text-center text-lg font-mono text-slate-100 outline-none transition-colors placeholder-slate-600 shadow-inner"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
                  <Dices size={18} />
                </div>
              </div>

              <button 
                onClick={() => addModifier(1)}
                className="w-12 h-12 flex-none flex items-center justify-center bg-modifier-green-bg border border-modifier-green/50 rounded-xl text-modifier-green font-bold transition-all active:scale-95 shadow-sm text-lg"
              >
                +1
              </button>
           </div>

           {/* Toolbar: KH, KL, Delete, Clear */}
           <div className="grid grid-cols-4 gap-2 w-full">
               <button 
                 onClick={() => handleKeep('kh')}
                 className="bg-slate-800 border border-slate-700 rounded-lg py-2 text-sm font-bold text-slate-400 hover:text-slate-100 uppercase tracking-wider flex items-center justify-center active:bg-slate-700 font-mono"
                 title="Manter Maior (Keep Highest)"
               >
                 KH
               </button>
               <button 
                 onClick={() => handleKeep('kl')}
                 className="bg-slate-800 border border-slate-700 rounded-lg py-2 text-sm font-bold text-slate-400 hover:text-slate-100 uppercase tracking-wider flex items-center justify-center active:bg-slate-700 font-mono"
                 title="Manter Menor (Keep Lowest)"
               >
                 KL
               </button>
               
              <button 
                onClick={() => { play('CLICK'); setExpression(prev => prev.slice(0, -1)); }}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-2 flex items-center justify-center text-slate-400 hover:text-slate-100 active:scale-95 transition-colors"
              >
                <Delete size={18} />
              </button>
              <button 
                onClick={handleClear}
                className="bg-orange-900/20 hover:bg-orange-900/40 border border-orange-900/50 rounded-lg py-2 text-[10px] sm:text-xs font-bold text-orange-500 hover:text-orange-400 uppercase tracking-wider active:scale-95 transition-colors"
              >
                Limpar
              </button>
           </div>

           {/* Dice Grid */}
           <div className="grid grid-cols-4 gap-2 w-full">
             {diceTypes.map((sides) => (
               <button
                 key={sides}
                 onClick={() => addDie(sides)}
                 className="aspect-square bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-600 active:border-amber-500 rounded-xl flex items-center justify-center transition-all active:scale-95 group shadow-sm"
               >
                 <span className="text-sm sm:text-base font-bold font-mono text-slate-400 group-hover:text-slate-100">
                   d{sides}
                 </span>
               </button>
             ))}
           </div>

           {/* Roll Button */}
           <button
             onClick={() => handleRoll()}
             disabled={!expression.trim()}
             className="w-full mt-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-on-primary font-black text-xl uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-amber-900/20 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
           >
             <Play size={22} fill="currentColor" /> Rolar
           </button>
        </div>
      </div>
    </div>
  );
};

export default DiceView;
