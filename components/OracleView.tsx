import React, { useState } from 'react';
import { OracleBias, LogEntry } from '../types';
import { ORACLE_ANSWERS, INTERVENTION_TYPES } from '../constants';
import { rollD, generateUUID } from '../utils';
import { BrainCircuit, AlertTriangle, Dices } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';

interface OracleViewProps {
  addLog: (entry: LogEntry) => void;
}

const OracleView: React.FC<OracleViewProps> = ({ addLog }) => {
  const [interventionPoints, setInterventionPoints] = useState(0);
  const [interventionsEnabled, setInterventionsEnabled] = useState(true);
  const [lastAnswer, setLastAnswer] = useState<string | null>(null);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const [lastIntervention, setLastIntervention] = useState<string | null>(null);

  const { play } = useGameSound();

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
    
    let roll1 = rollD(6);
    let roll2 = 0;
    let finalRoll = roll1;
    let sixRolled = roll1 === 6;

    let logDetails = `Rolagem: [${roll1}]`;

    if (bias === 'LIKELY') {
      roll2 = rollD(6);
      finalRoll = Math.max(roll1, roll2);
      if (roll2 === 6) sixRolled = true;
      logDetails = `Provável (Vantagem): [${roll1}, ${roll2}] -> ${finalRoll}`;
    } else if (bias === 'UNLIKELY') {
      roll2 = rollD(6);
      finalRoll = Math.min(roll1, roll2);
      if (roll2 === 6) sixRolled = true;
      logDetails = `Improvável (Desvantagem): [${roll1}, ${roll2}] -> ${finalRoll}`;
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

    // 1. Log Oracle FIRST (The Cause)
    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'ORACLE',
      title: 'Oráculo',
      result: answer.text,
      details: `${logDetails}${interventionTriggered ? ' -> Intervenção Desencadeada!' : (sixRolled && interventionsEnabled ? ' (+1 Ponto de Intervenção)' : '')}`
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
        type: 'INTERVENTION',
        title: 'Intervenção!',
        result: interventionText,
        highlight: true
      });
    }
  };

  const getPointsColor = () => {
    if (!interventionsEnabled) return 'bg-card-hover opacity-50'; // Gray when disabled
    if (interventionPoints === 0) return 'bg-card-hover';
    if (interventionPoints === 1) return 'bg-yellow-700'; // Keep absolute for semantic meaning (Traffic light)
    if (interventionPoints === 2) return 'bg-orange-600';
    return 'bg-error'; // Red
  };

  return (
    <div className="flex flex-col landscape:flex-row items-center justify-between h-full p-4 overflow-y-auto relative gap-4">
      <style>{shakeStyle}</style>

      {/* LEFT SECTION (Landscape): Intervention + Result */}
      <div className="w-full max-w-md landscape:max-w-none landscape:w-3/5 landscape:h-full flex flex-col items-center justify-center gap-4">
          
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

          {/* Result Display Container (Relative for Overlay) */}
          <div className="flex-1 w-full relative flex flex-col min-h-[160px] landscape:flex-1">
            
            {/* 1. Base Layer: Oracle Answer (Always rendered to maintain layout shape) */}
            <div className={`w-full h-full bg-card border-2 ${lastAnswer?.includes('Sim') ? 'border-success/50' : (lastAnswer?.includes('Não') ? 'border-error/50' : 'border-border')} rounded-2xl p-8 text-center shadow-xl transition-all duration-300 flex flex-col items-center justify-center`}>
              <h2 className="text-txt-muted text-sm uppercase mb-2">Resposta do Oráculo</h2>
              <p className="text-4xl lg:text-5xl font-extrabold text-txt-main tracking-tight leading-tight">
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
            </div>

            {/* 2. Overlay Layer: Intervention (Appears ON TOP) */}
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

      {/* RIGHT SECTION (Landscape): Controls */}
      <div className="w-full max-w-md landscape:max-w-none landscape:w-2/5 landscape:h-full flex flex-col justify-end gap-2">
         
          {/* Controls */}
          <div className="grid grid-cols-3 landscape:grid-cols-1 gap-3 h-full">
            <button
              onClick={() => handleOracleRoll('UNLIKELY')}
              className="flex flex-col landscape:flex-row items-center justify-center gap-2 bg-card hover:bg-card-hover active:bg-border border-b-4 border-app active:border-b-0 active:translate-y-1 rounded-xl p-3 landscape:p-4 transition-all"
            >
              <span className="text-xs text-txt-muted uppercase font-bold landscape:order-2">Improvável</span>
              <span className="text-lg font-bold landscape:order-1 text-txt-main">Desvant.</span>
            </button>

            <button
              onClick={() => handleOracleRoll('NORMAL')}
              className="flex flex-col landscape:flex-row items-center justify-center gap-2 bg-primary hover:bg-primary-hover active:bg-primary-active border-b-4 border-primary-active active:border-b-0 active:translate-y-1 rounded-xl p-4 landscape:py-6 transition-all shadow-lg"
            >
              <span className="text-xs text-on-primary uppercase font-bold landscape:order-2">Normal</span>
              <span className="text-2xl font-bold text-on-primary landscape:order-1">Rolar</span>
            </button>

            <button
              onClick={() => handleOracleRoll('LIKELY')}
              className="flex flex-col landscape:flex-row items-center justify-center gap-2 bg-card hover:bg-card-hover active:bg-border border-b-4 border-app active:border-b-0 active:translate-y-1 rounded-xl p-3 landscape:p-4 transition-all"
            >
              <span className="text-xs text-txt-muted uppercase font-bold landscape:order-2">Provável</span>
              <span className="text-lg font-bold landscape:order-1 text-txt-main">Vantagem</span>
            </button>
          </div>
      </div>
    </div>
  );
};

export default OracleView;