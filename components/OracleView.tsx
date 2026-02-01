import React from 'react';
import { LogEntry } from '../types';
import OracleMuneView from './OracleMuneView';
import OracleOPSEView from './OracleOPSEView';
import OracleIronView from './OracleIronView';
import { MessageSquare, FileText, Shield } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';

interface OracleViewProps {
  addLog: (entry: LogEntry) => void;
  activeSystem?: 'MUNE' | 'OPSE' | 'IRON';
  onSystemChange?: (system: 'MUNE' | 'OPSE' | 'IRON') => void;
}

const OracleView: React.FC<OracleViewProps> = ({ addLog, activeSystem = 'MUNE', onSystemChange }) => {
  const { play } = useGameSound();
  
  const handleSystemChange = (sys: 'MUNE' | 'OPSE' | 'IRON') => {
    play('CLICK');
    onSystemChange?.(sys);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-app">
      {/* Header */}
      <div className="flex-none h-16 border-b border-border bg-app/95 sticky top-0 z-10 backdrop-blur-sm no-print px-4 flex items-center gap-3">
          <button
            onClick={() => handleSystemChange('MUNE')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:translate-y-1 active:border-b-0 border-b-4 shadow-md ${
              activeSystem === 'MUNE'
                ? 'bg-primary text-on-primary border-primary-active shadow-primary/20'
                : 'bg-card text-txt-muted hover:bg-card-hover border-border'
            }`}
          >
            M.U.N.E.
          </button>
          
          <button
            onClick={() => handleSystemChange('OPSE')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:translate-y-1 active:border-b-0 border-b-4 shadow-md ${
              activeSystem === 'OPSE'
                ? 'bg-primary text-on-primary border-primary-active shadow-primary/20'
                : 'bg-card text-txt-muted hover:bg-card-hover border-border'
            }`}
          >
            O.P.S.E.
          </button>

          <button
            onClick={() => handleSystemChange('IRON')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all active:translate-y-1 active:border-b-0 border-b-4 shadow-md ${
              activeSystem === 'IRON'
                ? 'bg-primary text-on-primary border-primary-active shadow-primary/20'
                : 'bg-card text-txt-muted hover:bg-card-hover border-border'
            }`}
          >
            Ironsworn
          </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
          {activeSystem === 'MUNE' && <OracleMuneView addLog={addLog} />}
          {activeSystem === 'OPSE' && <OracleOPSEView addLog={addLog} />}
          {activeSystem === 'IRON' && <OracleIronView addLog={addLog} />}
      </div>
    </div>
  );
};

export default OracleView;