import React from 'react';
import { X, Dices } from 'lucide-react';

interface RollResultModalProps {
  title: string;
  icon?: React.ReactNode;
  roll: number;
  diceNotation: string;
  detailText: string;
  isRevealing: boolean;
  onClose: () => void;
}

const RollResultModal: React.FC<RollResultModalProps> = ({
  title,
  icon,
  roll,
  diceNotation,
  detailText,
  isRevealing,
  onClose
}) => {
  const containerBase = "w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl relative transition-all duration-300";
  const borderClass = "border-primary shadow-primary/20"; 

  const containerState = isRevealing 
    ? "bg-card border-2 border-border scale-100" 
    : `bg-app border-2 ${borderClass} scale-105`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className={`${containerBase} ${containerState}`}
        onClick={e => e.stopPropagation()}
      >
        {!isRevealing && (
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 text-txt-muted hover:text-txt-main bg-card rounded-full p-1 animate-in fade-in"
          >
            <X size={16} />
          </button>
        )}

        <h3 className="text-txt-muted uppercase text-[10px] font-bold tracking-widest mb-4 flex items-center justify-center gap-2">
          {icon} {title}
        </h3>
        
        <div className="flex flex-col items-center relative mb-4">
          <span className="text-[10px] uppercase font-bold text-txt-dim mb-2">Resultado</span>
          
          {isRevealing ? (
            <div className="h-16 flex items-center justify-center">
              <Dices className="text-txt-dim animate-spin" size={40} />
            </div>
          ) : (
            <div className="animate-in zoom-in spin-in-180 duration-500">
              <span className="text-6xl font-black text-primary drop-shadow-lg">
                {roll}
              </span>
            </div>
          )}
          
          <span className="text-xs text-txt-dim font-mono mt-2 bg-card px-2 py-1 rounded border border-border min-h-[24px] flex items-center">
             {!isRevealing && diceNotation}
          </span>
        </div>

         <div className="mt-2 text-xs text-txt-muted font-mono min-h-[16px] flex items-center justify-center">
            {isRevealing ? (
              <span className="text-txt-dim font-bold uppercase tracking-widest text-sm animate-pulse">Rolando...</span>
            ) : (
              detailText
            )}
         </div>
      </div>
    </div>
  );
};

export default RollResultModal;