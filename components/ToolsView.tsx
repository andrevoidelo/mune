import React, { useState } from 'react';
import { Collection, LogEntry, Clock, WikiEntry } from '../types';
import { Layers, Clock as ClockIcon } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';
import ClocksView from './ClocksView';
import CollectionsView from './CollectionsView';

interface ToolsViewProps {
  addLog: (entry: LogEntry) => void;
  collections: Collection[];
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  clocks: Clock[];
  setClocks: React.Dispatch<React.SetStateAction<Clock[]>>;
  entries: WikiEntry[];
  onCreateEntries?: (newEntries: WikiEntry[]) => void;
  onNavigateToWiki?: (entryId: string | null, createSlug?: string) => void;
}

const ToolsView: React.FC<ToolsViewProps> = ({ 
    addLog, 
    collections, 
    setCollections, 
    clocks, 
    setClocks, 
    entries, 
    onCreateEntries,
    onNavigateToWiki
}) => {
  const { play } = useGameSound();
  const [activeTab, setActiveTab] = useState<'COLLECTIONS' | 'CLOCKS'>('COLLECTIONS');

  return (
    <div className="flex flex-col h-full bg-app relative">
      <div className="flex-1 overflow-hidden relative">
        {/* Collections View (Always rendered, hidden when inactive to preserve state) */}
        <div className={`h-full w-full ${activeTab === 'COLLECTIONS' ? 'block' : 'hidden'}`}>
          <CollectionsView 
            addLog={addLog}
            collections={collections}
            setCollections={setCollections}
            entries={entries}
            onCreateEntries={onCreateEntries}
            onNavigateToWiki={onNavigateToWiki}
          />
        </div>

        {/* Clocks View (Always rendered, hidden when inactive) */}
        <div className={`h-full w-full ${activeTab === 'CLOCKS' ? 'block' : 'hidden'}`}>
          <ClocksView 
            clocks={clocks}
            setClocks={setClocks}
            addLog={addLog}
          />
        </div>
      </div>

      {/* Footer Bar */}
      <div className="flex-none h-12 bg-card border-t border-border flex items-stretch z-30">
         <button 
           onClick={() => { play('CLICK'); setActiveTab('COLLECTIONS'); }}
           className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'COLLECTIONS' ? 'text-primary bg-primary/5' : 'text-txt-muted hover:text-txt-main hover:bg-card-hover'}`}
         >
           <Layers size={16} /> Coleções
         </button>
         <div className="w-px bg-border my-3"></div>
         <button 
           onClick={() => { play('CLICK'); setActiveTab('CLOCKS'); }}
           className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'CLOCKS' ? 'text-primary bg-primary/5' : 'text-txt-muted hover:text-txt-main hover:bg-card-hover'}`}
         >
           <ClockIcon size={16} /> Relógios
         </button>
      </div>
    </div>
  );
};

export default ToolsView;