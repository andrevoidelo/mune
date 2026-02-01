import React, { useState } from 'react';
import { Character, LogEntry, ConflictState } from '../types';
import { User, Sword } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';
import CharacterView from './CharacterView';
import ConflictView from './ConflictView';

interface PersonaViewProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  addLog: (entry: LogEntry) => void;
  conflictState: ConflictState;
  setConflictState: (state: ConflictState) => void;
}

const PersonaView: React.FC<PersonaViewProps> = ({ 
  characters, 
  setCharacters, 
  addLog, 
  conflictState, 
  setConflictState 
}) => {
  const { play } = useGameSound();
  const [activeTab, setActiveTab] = useState<'CHARACTERS' | 'CONFLICT'>('CHARACTERS');

  return (
    <div className="flex flex-col h-full bg-app relative">
      <div className="flex-1 overflow-hidden relative">
        {/* Character View */}
        <div className={`h-full w-full ${activeTab === 'CHARACTERS' ? 'block' : 'hidden'}`}>
          <CharacterView 
            characters={characters}
            setCharacters={setCharacters}
            addLog={addLog}
          />
        </div>

        {/* Conflict View */}
        <div className={`h-full w-full ${activeTab === 'CONFLICT' ? 'block' : 'hidden'}`}>
          <ConflictView 
            conflictState={conflictState}
            setConflictState={setConflictState}
            characters={characters}
            addLog={addLog}
          />
        </div>
      </div>

      {/* Footer Bar */}
      <div className="flex-none h-12 bg-card border-t border-border flex items-stretch z-30">
         <button 
           onClick={() => { play('CLICK'); setActiveTab('CHARACTERS'); }}
           className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'CHARACTERS' ? 'text-primary bg-primary/5' : 'text-txt-muted hover:text-txt-main hover:bg-card-hover'}`}
         >
           <User size={16} /> Personas
         </button>
         <div className="w-px bg-border my-3"></div>
         <button 
           onClick={() => { play('CLICK'); setActiveTab('CONFLICT'); }}
           className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'CONFLICT' ? 'text-primary bg-primary/5' : 'text-txt-muted hover:text-txt-main hover:bg-card-hover'}`}
         >
           <Sword size={16} /> Combate
         </button>
      </div>
    </div>
  );
};

export default PersonaView;