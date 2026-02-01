import React, { useState } from 'react';
import { ConflictParticipant, ConflictState, Character, LogEntry } from '../types';
import { generateUUID } from '../utils';
import { useGameSound } from '../hooks/useGameSound';
import { 
  Sword, Shield, User, Plus, Trash2, ChevronUp, ChevronDown, 
  Play, Square, RotateCcw, MoreHorizontal, GripVertical, 
  Heart, Skull, ArrowRight, UserPlus
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ConflictViewProps {
  conflictState: ConflictState;
  setConflictState: (state: ConflictState) => void;
  characters: Character[]; // To allow adding existing characters
  addLog: (entry: LogEntry) => void;
}

const SortableParticipantItem = ({
  participant,
  isActive,
  onRemove,
  onUpdate,
  onActivate
}: {
  participant: ConflictParticipant;
  isActive: boolean;
  onRemove: () => void;
  onUpdate: (updates: Partial<ConflictParticipant>) => void;
  onActivate: () => void;
}) => {  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: participant.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' as const : 'static' as const,
  };
  
  const { play } = useGameSound();

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-2 group ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Drag Handle */}
      <button 
        {...attributes} 
        {...listeners} 
        className="touch-none cursor-grab active:cursor-grabbing text-txt-dim hover:text-txt-main p-2 rounded hover:bg-card-hover transition-colors flex-none" 
        style={{ touchAction: 'none' }}
      >
        <GripVertical size={20} />
      </button>

      {/* Card Content */}
      <div className={`flex-1 min-w-0 relative flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isActive 
          ? 'bg-primary/10 border-primary shadow-md scale-[1.02] z-10' 
          : 'bg-card border-border hover:border-primary/30'
      }`}>
        {/* Active Indicator */}
        <button 
          onClick={() => { play('CLICK'); onActivate(); }}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-none ${
            isActive 
              ? 'bg-primary text-on-primary shadow-lg scale-110' 
              : 'bg-app border border-border text-txt-dim hover:border-primary hover:text-primary'
          }`}
        >
          {isActive ? <Sword size={16} /> : <div className="w-2 h-2 rounded-full bg-current opacity-50" />}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-1">
             <input 
               value={participant.name}
               onChange={(e) => onUpdate({ name: e.target.value })}
               className="font-bold text-txt-main bg-transparent outline-none w-full truncate placeholder-txt-dim/50"
               placeholder="Nome..."
             />
          </div>
          <div className="flex items-center gap-2">
             {/* HP Control */}
             <div className="flex items-center bg-app rounded px-1.5 py-0.5 border border-border gap-1">
                <Heart size={10} className="text-error" />
                <input 
                  type="number" 
                  value={participant.hp || 0}
                  onChange={(e) => onUpdate({ hp: parseInt(e.target.value) || 0 })}
                  className="w-8 text-xs font-mono text-center bg-transparent outline-none text-txt-main"
                  placeholder="HP"
                />
                <span className="text-[10px] text-txt-dim">/</span>
                <input 
                  type="number" 
                  value={participant.maxHp || 0}
                  onChange={(e) => onUpdate({ maxHp: parseInt(e.target.value) || 0 })}
                  className="w-8 text-xs font-mono text-center bg-transparent outline-none text-txt-dim"
                  placeholder="Max"
                />
             </div>
             
             {/* Initiative Field (Optional) */}
             <div className="flex items-center bg-app rounded px-1.5 py-0.5 border border-border gap-1" title="Iniciativa">
                <span className="text-[10px] font-bold text-txt-dim">INI</span>
                <input 
                  type="number" 
                  value={participant.initiative || 0}
                  onChange={(e) => onUpdate({ initiative: parseInt(e.target.value) || 0 })}
                  className="w-6 text-xs font-mono text-center bg-transparent outline-none text-txt-main"
                />
             </div>
          </div>
        </div>

        {/* Actions */}
        <button 
          onClick={() => { play('CLICK'); onRemove(); }}
          className="p-2 text-txt-muted hover:text-error hover:bg-app rounded-lg transition-colors flex-none"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const ConflictView: React.FC<ConflictViewProps> = ({ conflictState, setConflictState, characters, addLog }) => {
  const { play } = useGameSound();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = conflictState.participants.findIndex((p) => p.id === active.id);
      const newIndex = conflictState.participants.findIndex((p) => p.id === over.id);
      
      setConflictState({
        ...conflictState,
        participants: arrayMove(conflictState.participants, oldIndex, newIndex)
      });
    }
  };

  const addParticipant = (type: 'PLAYER' | 'ENEMY', charTemplate?: Character) => {
    const newParticipant: ConflictParticipant = {
      id: generateUUID(),
      name: charTemplate ? charTemplate.name : (type === 'PLAYER' ? 'Novo Jogador' : 'Inimigo'),
      type,
      initiative: 0,
      hp: charTemplate ? (charTemplate.resources.find(r => r.name.match(/vida|hp|saúde/i))?.current || 10) : 10,
      maxHp: charTemplate ? (charTemplate.resources.find(r => r.name.match(/vida|hp|saúde/i))?.max || 10) : 10,
      active: false
    };

    setConflictState({
      ...conflictState,
      participants: [...conflictState.participants, newParticipant]
    });
    setShowAddMenu(false);
  };

  const updateParticipant = (id: string, updates: Partial<ConflictParticipant>) => {
    setConflictState({
      ...conflictState,
      participants: conflictState.participants.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const removeParticipant = (id: string) => {
    setConflictState({
      ...conflictState,
      participants: conflictState.participants.filter(p => p.id !== id)
    });
  };

  const nextTurn = () => {
    if (conflictState.participants.length === 0) return;
    play('CLICK');

    // If starting conflict
    if (!conflictState.isActive) {
        addLog({
            id: generateUUID(),
            timestamp: Date.now(),
            type: 'NOTE',
            title: '⚔️ Conflito',
            result: 'Um conflito se inicia.'
        });
        
        setConflictState({
            ...conflictState,
            isActive: true,
            turnIndex: 0,
            round: 1
        });
        return;
    }

    let nextIndex = conflictState.turnIndex + 1;
    let nextRound = conflictState.round;

    if (nextIndex >= conflictState.participants.length) {
      nextIndex = 0;
      nextRound++;
    }

    setConflictState({
      ...conflictState,
      turnIndex: nextIndex,
      round: nextRound,
      isActive: true
    });
  };

  const prevTurn = () => {
    if (conflictState.participants.length === 0) return;
    play('CLICK');

    let prevIndex = conflictState.turnIndex - 1;
    let prevRound = conflictState.round;

    if (prevIndex < 0) {
      prevIndex = conflictState.participants.length - 1;
      prevRound = Math.max(1, prevRound - 1);
    }

    setConflictState({
      ...conflictState,
      turnIndex: prevIndex,
      round: prevRound
    });
  };

  const endConflict = () => {
    play('CLICK');
    addLog({
        id: generateUUID(),
        timestamp: Date.now(),
        type: 'NOTE',
        title: '⚔️ Conflito',
        result: 'Um conflito se encerra.'
    });

    setConflictState({
      ...conflictState,
      isActive: false,
      turnIndex: 0,
      round: 1
    });
  };

  const setTurn = (index: number) => {
      setConflictState({
          ...conflictState,
          turnIndex: index,
          isActive: true
      });
  };

  return (
    <div className="h-full flex flex-col bg-app">
      {/* Header / Round Tracker */}
      <div className="flex-none p-4 border-b border-border bg-card flex items-center justify-between shadow-sm z-10">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xl border border-primary/20">
               {conflictState.round}
            </div>
            <div>
               <h2 className="font-bold text-txt-main text-sm uppercase tracking-wide">Rodada</h2>
               <p className="text-[10px] text-txt-muted flex items-center gap-1">
                  {conflictState.isActive ? <span className="text-success flex items-center gap-1">● Em Combate</span> : 'Combate Encerrado'}
               </p>
            </div>
         </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
         {conflictState.participants.length === 0 ? (
            <div className="text-center py-12 text-txt-dim border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-3">
               <Sword size={48} className="opacity-20" />
               <p>Nenhum participante no conflito.</p>
               <button 
                 onClick={() => setShowAddMenu(true)}
                 className="text-primary font-bold hover:underline"
               >
                 Adicionar Participantes
               </button>
            </div>
         ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
               <SortableContext items={conflictState.participants.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  {conflictState.participants.map((p, idx) => (
                     <SortableParticipantItem 
                        key={p.id} 
                        participant={p} 
                        isActive={idx === conflictState.turnIndex && conflictState.isActive}
                        onRemove={() => removeParticipant(p.id)}
                        onUpdate={(updates) => updateParticipant(p.id, updates)}
                        onActivate={() => setTurn(idx)}
                     />
                  ))}
               </SortableContext>
            </DndContext>
         )}
         
         <button 
            onClick={() => { play('CLICK'); setShowAddMenu(!showAddMenu); }}
            className="w-full py-3 mt-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-txt-dim hover:text-primary hover:border-primary transition-all font-bold uppercase text-xs tracking-wider"
         >
            {showAddMenu ? <ChevronUp size={16} /> : <Plus size={16} />} Adicionar
         </button>

         {showAddMenu && (
            <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
               <button 
                  onClick={() => { play('CLICK'); addParticipant('ENEMY'); }}
                  className="p-3 bg-error/10 hover:bg-error/20 border border-error/30 rounded-lg flex flex-col items-center justify-center gap-1 text-error font-bold transition-colors"
               >
                  <Skull size={20} />
                  Inimigo
               </button>
               <button 
                  onClick={() => { play('CLICK'); addParticipant('PLAYER'); }}
                  className="p-3 bg-success/10 hover:bg-success/20 border border-success/30 rounded-lg flex flex-col items-center justify-center gap-1 text-success font-bold transition-colors"
               >
                  <UserPlus size={20} />
                  Aliado/NPC
               </button>
               {characters.map(char => (
                  <button 
                     key={char.id}
                     onClick={() => { play('CLICK'); addParticipant('PLAYER', char); }}
                     className="col-span-2 p-2 bg-card hover:bg-card-hover border border-border rounded-lg flex items-center gap-3 text-left transition-colors"
                  >
                     <div className="w-8 h-8 rounded-full bg-app overflow-hidden flex-none">
                        {char.imageUrl ? <img src={char.imageUrl} className="w-full h-full object-cover" /> : <User size={16} className="m-auto text-txt-dim" />}
                     </div>
                     <span className="font-bold text-txt-main truncate">{char.name}</span>
                  </button>
               ))}
            </div>
         )}
      </div>

      {/* Footer Controls */}
      <div className="flex-none p-4 border-t border-border bg-app flex justify-between items-center">
         <button 
            onClick={endConflict}
            className="px-4 py-2 text-error hover:bg-error/10 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
         >
            <Square size={14} fill="currentColor" /> Encerrar Conflito
         </button>
         
         <div className="flex gap-2">
            <button 
               onClick={prevTurn}
               className="p-2.5 rounded-lg bg-card border border-border text-txt-muted hover:text-txt-main hover:border-primary/50 transition-all active:scale-95 shadow-sm"
               title="Turno Anterior"
            >
               <ChevronUp className="rotate-[-90deg]" size={20} />
            </button>
            <button 
               onClick={nextTurn}
               className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
               {conflictState.isActive ? 'Próximo' : 'Iniciar'} <ArrowRight size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default ConflictView;
