import React, { useState } from 'react';
import { OracleBias, LogEntry, CollectionItem } from '../types';
import { ORACLE_ANSWERS, INTERVENTION_TYPES, NPC_ATTITUDES_ITEMS, TWENE_ITEMS } from '../constants';
import { rollD, generateUUID, getLuminance } from '../utils';
import { BrainCircuit, AlertTriangle, Dices, User, Zap, Trash2 } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';
import { useTheme } from '../contexts/ThemeContext';

interface OracleMuneViewProps {
  addLog: (entry: LogEntry) => void;
}

const OracleMuneView: React.FC<OracleMuneViewProps> = ({ addLog }) => {
  const { activeThemeId, allThemes } = useTheme();
  const activeTheme = allThemes.find(t => t.id === activeThemeId);
  const isLightMode = activeTheme ? getLuminance(activeTheme.colors.appBg) > 128 : false;

  const [interventionPoints, setInterventionPoints] = useState(0);
  const [interventionsEnabled, setInterventionsEnabled] = useState(true);
  const [resultTitle, setResultTitle] = useState('Oráculo M.U.N.E.');
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastIntervention, setLastIntervention] = useState<string | null>(null);

  const { play } = useGameSound();

  const handleClear = () => {
    play('CLICK');
    setLastAnswer(null);
    setLastRoll(null);
    setLastIntervention(null);
    setResultTitle('Oráculo M.U.N.E.');
  };

  // Styles injected for the shake animation
  const shakeStyle = `
    @keyframes shake-alert {
      0% { transform: translate(0, 0) rotate(0deg); }
      15% { transform: translate(-4px, 0) rotate(-1deg); }
      30% { transform: translate(4px, 0) rotate(1deg); }
      45% { transform: translate(-2px, 0) rotate(0deg); }
      60% { transform: translate(2px, 0) rotate(0deg); }
      75% { transform: translate(-1px, 0); }
      100% { transform: translate(0, 0); }
    }
    .animate-shake-alert {
      animation: shake-alert 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
  `;

  const handleOracleRoll = (bias: OracleBias) => {
    play('ROLL');
    setResultTitle('Resposta do Oráculo');
    
    let roll1 = rollD(6);
    let roll2 = 0;
    let finalRoll = roll1;
    let sixRolled = roll1 === 6;
    let rolls = [roll1];

    if (bias === 'LIKELY') {
      roll2 = rollD(6);
      rolls.push(roll2);
      finalRoll = Math.max(roll1, roll2);
      if (roll2 === 6) sixRolled = true;
    } else if (bias === 'UNLIKELY') {
      roll2 = rollD(6);
      rolls.push(roll2);
      finalRoll = Math.min(roll1, roll2);
      if (roll2 === 6) sixRolled = true;
    }

    const answer = ORACLE_ANSWERS.find(a => a.roll === finalRoll);
    if (!answer) return;

    setLastAnswer(answer.text);
    setLastRoll(finalRoll);
    setLastIntervention(null);

    // Calculation Logic
    let newPoints = interventionPoints;
    let interventionTriggered = false;

    // Only process interventions if enabled
    if (interventionsEnabled) {
      if (sixRolled) {
        newPoints += 1;
      }

      if (newPoints >= 3) {
        interventionTriggered = true;
        newPoints = 0;
      }
      
      setInterventionPoints(newPoints);
    }

    let diceNote = `1d6[${rolls.join(',')}] ➔ ${finalRoll}`;
    let extraInfo = interventionTriggered 
        ? ' (Intervenção!)' 
        : (sixRolled && interventionsEnabled ? ' (+1 Ponto)' : '');

    // 1. Log Oracle FIRST (The Cause)
    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'ORACLE',
      title: 'M.U.N.E.',
      result: answer.text,
      details: `${diceNote}${extraInfo}`
    });

    // 2. Log Intervention SECOND (The Effect)
    if (interventionTriggered) {
      setTimeout(() => {
         play('FAILURE'); // Sound for intervention alert
      }, 500);

      const interventionRoll = rollD(6);
      const interventionType = INTERVENTION_TYPES.find(i => i.roll === interventionRoll);
      const interventionText = interventionType ? interventionType.text : "Erro";
      
      setLastIntervention(interventionText);
      
      addLog({
        id: generateUUID(),
        // Add minimal delay to ensure correct sorting order if sorting strictly by ms
        timestamp: Date.now() + 10, 
        type: 'ORACLE',
        title: 'M.U.N.E.',
        result: `Intervenção: **${interventionText}**`,
        highlight: true
      });
    }
  };

  const handleTableRoll = (tableName: string, items: CollectionItem[]) => {
    play('ROLL');
    setResultTitle(tableName);
    
    // Determine dice size based on table
    const sides = items.length;
    const roll = rollD(sides);
    const result = items[roll - 1]; // 1-based roll to 0-based index
    
    setLastAnswer(result.text);
    setLastRoll(null); // Clear dice badge if not using it, or show it? Mune usually shows result.
    setLastIntervention(null);

    // Format footnote
    const diceNotation = `1d${sides}[${roll}] ➔ ${roll}`;

    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'ORACLE', // Match normal oracle color
      title: `M.U.N.E. ${tableName}`,
      result: result.text,
      details: diceNotation
    });
  };

  const getPointsColor = () => {
    if (!interventionsEnabled) return 'bg-card-hover opacity-50'; // Gray when disabled
    if (interventionPoints === 0) return 'bg-card-hover';
    if (interventionPoints === 1) return 'bg-yellow-700'; // Keep absolute for semantic meaning (Traffic light)
    if (interventionPoints === 2) return 'bg-orange-600';
    return 'bg-error'; // Red
  };

  return (
    <div className="flex flex-col h-full w-full">
      <style>{shakeStyle}</style>

      {/* Main Content Area: Display + Tracker */}
      <div className="flex-1 flex flex-col items-center p-4 gap-4 w-full max-w-4xl mx-auto">
          
          {/* Intervention Tracker */}
          <div className={`flex-none w-full bg-card rounded-xl p-4 shadow-lg border border-border transition-opacity ${interventionsEnabled ? 'opacity-100' : 'opacity-80'}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm uppercase tracking-wider text-txt-muted font-bold flex items-center gap-2">
                <BrainCircuit size={16} />
                Pontos de Intervenção
              </h3>
              
              <div className="flex items-center gap-3">
                 <span className={`text-2xl font-bold font-mono transition-colors ${interventionsEnabled ? 'text-txt-main' : 'text-txt-dim'}`}>
                    {interventionPoints}/3
                 </span>
                 
                 {/* Toggle Switch */}
                 <button 
                   onClick={() => { play('CLICK'); setInterventionsEnabled(!interventionsEnabled); }}
                   className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out border border-border ${interventionsEnabled ? 'bg-primary border-primary' : 'bg-app'}`}
                   title={interventionsEnabled ? "Intervenções Ativadas" : "Intervenções Desativadas"}
                 >
                   <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-on-primary rounded-full shadow-sm transition-transform duration-200 ${interventionsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                 </button>
              </div>
            </div>
            
            <div className="w-full h-4 bg-app rounded-full overflow-hidden border border-border/50">
              <div 
                className={`h-full transition-all duration-300 ${getPointsColor()}`} 
                style={{ width: `${(interventionPoints / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Result Display Container */}
          <div className="flex-1 w-full relative flex flex-col min-h-[200px]">
            
            <div className={`w-full h-full bg-card border-2 ${lastAnswer?.includes('Sim') ? 'border-success/50' : (lastAnswer?.includes('Não') ? 'border-error/50' : 'border-border')} rounded-2xl p-8 text-center shadow-xl transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden`}>
              <h2 className="text-txt-muted text-sm uppercase mb-2 tracking-widest">{resultTitle}</h2>
              <p className={`font-extrabold text-txt-main tracking-tight leading-tight transition-all ${lastAnswer && lastAnswer.length > 20 ? 'text-2xl lg:text-3xl' : 'text-4xl lg:text-5xl'}`}>
                {lastAnswer || "..."}
              </p>
              
              {/* Dice Result Badge */}
              {lastRoll !== null && (
                <div className="mt-6 animate-in zoom-in duration-300">
                   <div className="w-12 h-12 flex items-center justify-center bg-app border border-border rounded-xl shadow-inner relative group">
                      <Dices size={12} className="absolute top-1 right-1 text-txt-dim" />
                      <span className="text-xl font-black font-mono text-txt-main">{lastRoll}</span>
                   </div>
                </div>
              )}

              {/* Clear Button */}
              {lastAnswer && (
                <button
                  onClick={handleClear}
                  className="absolute bottom-2 left-2 p-2 text-txt-dim hover:text-error hover:bg-error/10 rounded-full transition-all duration-300"
                  title="Limpar resultado"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            {/* Overlay Layer: Intervention */}
            {lastIntervention && (
              <div className="absolute inset-0 z-20 bg-app/95 backdrop-blur-sm border-2 border-error rounded-2xl p-4 text-center flex flex-col items-center justify-center animate-in fade-in duration-200 animate-shake-alert shadow-2xl">
                <div className="flex justify-center mb-4 text-error">
                  <AlertTriangle size={48} />
                </div>
                <h2 className="text-lg font-bold text-error uppercase tracking-widest mb-1">Intervenção!</h2>
                <p className="text-3xl font-extrabold text-txt-main leading-tight uppercase drop-shadow-lg">
                  {lastIntervention}
                </p>
                <p className="text-xs text-txt-muted mt-4">A cena foi interrompida.</p>
              </div>
            )}
          </div>
      </div>

      {/* Controls Section */}
      <div className="flex-none w-full bg-card/50 border-t border-border p-4 pb-safe">
          <div className="max-w-4xl mx-auto space-y-3">
              {/* Quick Table Buttons (Now Top) */}
              <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleTableRoll('Atitude de NPC', NPC_ATTITUDES_ITEMS)}
                    className={`flex flex-col items-center justify-center gap-1 active:border-b-0 active:translate-y-1 rounded-xl py-4 transition-all text-sm font-bold border-b-4 ${
                      isLightMode 
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200' 
                        : 'bg-yellow-900/20 text-yellow-400 border-yellow-700/50 hover:bg-yellow-900/30'
                    }`}
                  >
                    <User size={20} /> Atitude de NPC
                  </button>
                  <button
                    onClick={() => handleTableRoll('TWENE', TWENE_ITEMS)}
                    className={`flex flex-col items-center justify-center gap-1 active:border-b-0 active:translate-y-1 rounded-xl py-4 transition-all text-sm font-bold border-b-4 ${
                      isLightMode 
                        ? 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200' 
                        : 'bg-orange-900/20 text-orange-400 border-orange-700/50 hover:bg-orange-900/30'
                    }`}
                  >
                    <Zap size={20} /> TWENE
                  </button>
              </div>

              {/* Main Oracle Buttons (Now Bottom) */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleOracleRoll('UNLIKELY')}
                  className={`flex flex-col items-center justify-center gap-1 active:border-b-0 active:translate-y-1 rounded-xl p-3 transition-all border-b-4 ${
                    isLightMode 
                      ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200' 
                      : 'bg-red-900/20 text-red-400 border-red-700/50 hover:bg-red-900/30'
                  }`}
                >
                  <span className="text-lg font-bold">Desvant.</span>
                  <span className={`text-[10px] uppercase font-bold ${isLightMode ? 'text-red-600/70' : 'text-red-400/70'}`}>Improvável</span>
                </button>

                <button
                  onClick={() => handleOracleRoll('NORMAL')}
                  className="flex flex-col items-center justify-center gap-1 bg-primary hover:bg-primary-hover active:bg-primary-active border-b-4 border-primary-active active:border-b-0 active:translate-y-1 rounded-xl p-3 transition-all shadow-lg"
                >
                  <span className="text-2xl font-black text-on-primary">Rolar</span>
                  <span className="text-[10px] text-on-primary/80 uppercase font-bold tracking-widest">Oráculo</span>
                </button>

                <button
                  onClick={() => handleOracleRoll('LIKELY')}
                  className={`flex flex-col items-center justify-center gap-1 active:border-b-0 active:translate-y-1 rounded-xl p-3 transition-all border-b-4 ${
                    isLightMode 
                      ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' 
                      : 'bg-green-900/20 text-green-400 border-green-700/50 hover:bg-green-900/30'
                  }`}
                >
                  <span className="text-lg font-bold">Vantagem</span>
                  <span className={`text-[10px] uppercase font-bold ${isLightMode ? 'text-green-600/70' : 'text-green-400/70'}`}>Provável</span>
                </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default OracleMuneView;
