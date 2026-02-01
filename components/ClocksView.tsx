import React, { useState } from 'react';
import { Clock, ClockType, LogEntry } from '../types';
import { generateUUID } from '../utils';
import { useGameSound } from '../hooks/useGameSound';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Plus, Minus, Trash2, Edit2, Archive, RotateCcw, X, Save, AlertTriangle, BookOpen, Clock as ClockIcon, Flag, Activity, ChevronDown, ChevronUp, Check, Search } from 'lucide-react';

interface ClocksViewProps {
  clocks: Clock[];
  setClocks: React.Dispatch<React.SetStateAction<Clock[]>>;
  addLog: (entry: LogEntry) => void;
}

const CLOCK_TYPES: { type: ClockType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'THREAT', label: 'Ameaça', icon: <AlertTriangle size={16} />, color: '#ef4444' }, // Red
  { type: 'PROGRESS', label: 'Progresso', icon: <BookOpen size={16} />, color: '#22c55e' }, // Green
  { type: 'COUNTDOWN', label: 'Contagem', icon: <ClockIcon size={16} />, color: '#eab308' }, // Yellow
  { type: 'RACING', label: 'Disputa', icon: <Flag size={16} />, color: '#3b82f6' }, // Blue
  { type: 'TUG_OF_WAR', label: 'Cabo de Guerra', icon: <Activity size={16} />, color: '#a855f7' }, // Purple
];

const ClockBar: React.FC<{ 
  clock: Clock; 
  onTick: (delta: number, target?: 'player' | 'opponent') => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}> = ({ clock, onTick, onEdit, onDelete, onArchive }) => {
  const { play } = useGameSound();
  const typeDef = CLOCK_TYPES.find(t => t.type === clock.type) || CLOCK_TYPES[1];
  const color = clock.color || typeDef.color;
  const isRacing = clock.type === 'RACING';
  const isTug = clock.type === 'TUG_OF_WAR';

  const renderBar = (filled: number, target: 'player' | 'opponent', barColor: string) => (
      <div className="flex items-center gap-1 h-8 w-full relative mb-1">
         <button 
           onClick={() => { play('CLICK'); onTick(-1, target); }}
           disabled={filled === 0 || clock.isComplete}
           className="h-full w-8 flex items-center justify-center rounded bg-card-hover hover:bg-border text-txt-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors relative z-10"
         >
           <Minus size={16} />
         </button>

         <div className="flex-1 h-full bg-app rounded overflow-hidden flex gap-0.5 border border-border p-0.5 relative">
            {Array.from({ length: clock.segments }).map((_, idx) => {
               const isFilled = idx < filled;
               return (
                  <div 
                    key={idx} 
                    className={`flex-1 h-full rounded-sm transition-all duration-300 ${isFilled ? '' : 'bg-transparent'}`}
                    style={{ backgroundColor: isFilled ? barColor : undefined, opacity: isFilled ? 1 : 0.1 }}
                  >
                     {isFilled && <div className="w-full h-full bg-white/20"></div>}
                  </div>
               );
            })}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-baseline gap-1 bg-black/40 backdrop-blur-[2px] px-2 py-0.5 rounded-full border border-white/10">
                    <span className="text-sm font-black text-white">{filled} / {clock.segments}</span>
                </div>
            </div>
         </div>

         <button 
           onClick={() => { play('CLICK'); onTick(1, target); }}
           disabled={filled >= clock.segments || clock.isComplete}
           className="h-full w-8 flex items-center justify-center rounded bg-card-hover hover:bg-border text-txt-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors relative z-10"
         >
           <Plus size={16} />
         </button>
      </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 max-w-[70%]">
           <div className="p-2 rounded-lg bg-app border border-border" style={{ color: color }}>
              {typeDef.icon}
           </div>
           <div>
              <h3 className="font-bold text-txt-main leading-tight line-clamp-2">{clock.name}</h3>
              {clock.completionText && (
                 <p className="text-[10px] text-txt-muted mt-0.5 line-clamp-1">{clock.completionText}</p>
              )}
           </div>
        </div>

        <div className="flex flex-col items-end gap-2">
            {/* Card Actions */}
            <div className="flex gap-1.5">
                <button 
                    onClick={(e) => { e.stopPropagation(); play('CLICK'); onArchive(); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-card-hover text-txt-muted hover:text-txt-main transition-colors shadow-sm"
                    title="Arquivar"
                >
                    <Archive size={14} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); play('CLICK'); onEdit(); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors shadow-sm"
                    title="Editar"
                >
                    <Edit2 size={14} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); play('CLICK'); onDelete(); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-error/20 text-error hover:bg-error/30 transition-colors shadow-sm"
                    title="Excluir"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
      </div>

      {/* Progress Bars */}
      {isRacing ? (
          <div className="flex flex-col gap-2">
              <div className="text-[10px] uppercase font-bold text-txt-muted flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Jogadores
              </div>
              {renderBar(clock.filled, 'player', '#3b82f6')}
              
              <div className="text-[10px] uppercase font-bold text-txt-muted flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Oponente
              </div>
              {renderBar(clock.filledOpponent || 0, 'opponent', '#ef4444')}
          </div>
      ) : (
          renderBar(clock.filled, 'player', color)
      )}
      
      {/* Completion Overlay */}
      {clock.isComplete && (
         <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4 animate-in fade-in duration-300 z-10">
            <h4 className="text-lg font-black text-white uppercase tracking-tight drop-shadow-md mb-1 leading-tight">
                {isTug && clock.filled === 0 
                    ? (clock.completionTextMin || 'Relógio Recuou!')
                    : (clock.completionText || 'Relógio Completo!')}
            </h4>
            <p className="text-[10px] text-white/70 font-bold mb-4 uppercase tracking-widest">
                {clock.name}
            </p>
            <div className="flex gap-2">
               <button 
                  onClick={() => { 
                      play('CLICK'); 
                      if (isTug) {
                          const target = Math.floor(clock.segments / 2);
                          onTick(target - clock.filled);
                      } else {
                          onTick(-clock.segments); 
                      }
                  }}
                  className="px-3 py-1.5 bg-card-hover hover:bg-border text-white rounded text-xs font-bold flex items-center gap-1 transition-colors"
               >
                  <RotateCcw size={12} /> Reabrir
               </button>
               <button 
                  onClick={() => { play('CLICK'); onArchive(); }}
                  className="px-3 py-1.5 bg-primary text-on-primary rounded text-xs font-bold flex items-center gap-1 shadow-lg transition-colors"
               >
                  <Archive size={12} /> Arquivar
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

const ClocksView: React.FC<ClocksViewProps> = ({ clocks, setClocks, addLog }) => {
  const { play } = useGameSound();
  const [clockToDelete, setClockToDelete] = useState<Clock | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create/Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Clock>>({
      name: '',
      segments: 4,
      type: 'THREAT',
      completionText: ''
  });

  const filteredClocks = clocks.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.completionText || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeClocks = filteredClocks.filter(c => !c.isArchived);
  const archivedClocks = filteredClocks.filter(c => c.isArchived);

  // Actions
  const handleTick = (clock: Clock, delta: number, target: 'player' | 'opponent' = 'player') => {
     // Removed early return to allow manual changes/reopen
     
     let changes: Partial<Clock> = {};
     let logEntry: Partial<LogEntry> | null = null;
     
     const isTug = clock.type === 'TUG_OF_WAR';
     const isRacing = clock.type === 'RACING';

     if (target === 'player') {
         const newFilled = Math.max(0, Math.min(clock.segments, clock.filled + delta));
         if (newFilled === clock.filled) return;

         changes.filled = newFilled;
         
         // Check completion
         let isNowComplete = false;
         let completionMsg = '';
         
         if (isTug) {
             if (newFilled === 0) {
                 isNowComplete = true;
                 completionMsg = clock.completionTextMin || `"${clock.name}" recuou totalmente!`;
             } else if (newFilled === clock.segments) {
                 isNowComplete = true;
                 completionMsg = clock.completionText || `"${clock.name}" foi completado!`;
             }
         } else {
             isNowComplete = newFilled === clock.segments;
             completionMsg = clock.completionText || `"${clock.name}" foi completado!`;
         }

         if (isNowComplete && !clock.isComplete) {
             changes.isComplete = true;
             changes.completedAt = Date.now();
             play('SUCCESS');
             
             logEntry = {
                 type: 'NOTE',
                 title: '',
                 result: `**${clock.name}**: ${completionMsg}`,
                 details: isTug ? (newFilled === 0 ? 'Resultado Mínimo' : 'Resultado Máximo') : undefined,
                 highlight: true
             };
         } else {
             // Handle Reopen (Explicitly set false)
             if (clock.isComplete && !isNowComplete) {
                 changes.isComplete = false;
             }

             logEntry = {
                 type: 'NOTE',
                 title: '',
                 result: `**${clock.name}** ${delta > 0 ? 'avançou' : 'recuou'} para **${newFilled}/${clock.segments}**`
             };
         }
     } else {
         // Opponent Logic (Racing)
         const current = clock.filledOpponent || 0;
         const newFilled = Math.max(0, Math.min(clock.segments, current + delta));
         if (newFilled === current) return;

         changes.filledOpponent = newFilled;
         
         const isNowComplete = newFilled === clock.segments;
         
         if (isNowComplete && !clock.isComplete) {
             changes.isComplete = true;
             changes.completedAt = Date.now();
             play('FAILURE'); // Opponent won
             
             logEntry = {
                 type: 'NOTE',
                 title: '',
                 result: `**${clock.name} (Oponente)**: Completou o objetivo primeiro!`,
                 highlight: true
             };
         } else {
             // Handle Reopen (Explicitly set false)
             if (clock.isComplete && !isNowComplete) {
                 changes.isComplete = false;
             }

             logEntry = {
                 type: 'NOTE',
                 title: '',
                 result: `**${clock.name} (Oponente)** ${delta > 0 ? 'avançou' : 'recuou'} para **${newFilled}/${clock.segments}**`
             };
         }
     }
     
     // Update State
     setClocks(prev => prev.map(c => c.id === clock.id ? { ...c, ...changes } : c));

     // Log
     if (logEntry) {
         addLog({
             id: generateUUID(),
             timestamp: Date.now(),
             ...logEntry
         } as LogEntry);
     }
  };

  const handleCreate = () => {
      setFormData({
          id: generateUUID(),
          name: '',
          segments: 4,
          type: 'THREAT',
          completionText: '',
          completionTextMin: '',
          filled: 0,
          filledOpponent: 0,
          isComplete: false,
          isArchived: false,
          createdAt: Date.now()
      });
      setIsEditing(true);
  };

  const handleEdit = (clock: Clock) => {
      setFormData({ ...clock });
      setIsEditing(true);
  };

  const handleSave = () => {
      if (!formData.name?.trim()) return;

      const isTug = formData.type === 'TUG_OF_WAR';
      let initialFilled = formData.filled ?? 0;
      
      const isNew = !clocks.some(c => c.id === formData.id);
      if (isNew && isTug) {
          initialFilled = Math.floor((formData.segments || 4) / 2);
      }

      const newClock = {
          ...formData,
          segments: Math.max(2, Number(formData.segments) || 4),
          id: formData.id || generateUUID(),
          filled: initialFilled,
          filledOpponent: formData.filledOpponent ?? 0,
          createdAt: formData.createdAt || Date.now(),
          isArchived: formData.isArchived ?? false
      } as Clock;
      
      // Recalculate completion
      if (isTug) {
          if (newClock.filled === 0 || newClock.filled >= newClock.segments) newClock.isComplete = true;
          else newClock.isComplete = false;
      } else if (newClock.type === 'RACING') {
          if (newClock.filled >= newClock.segments || (newClock.filledOpponent || 0) >= newClock.segments) newClock.isComplete = true;
          else newClock.isComplete = false;
      } else {
          if (newClock.filled >= newClock.segments) newClock.isComplete = true;
          else newClock.isComplete = false;
      }

      setClocks(prev => {
          const exists = prev.some(c => c.id === newClock.id);
          if (exists) {
              return prev.map(c => c.id === newClock.id ? newClock : c);
          }
          return [newClock, ...prev];
      });

      setIsEditing(false);
  };

  const handleArchive = (clock: Clock) => {
      play('CLICK');
      setClocks(prev => prev.map(c => c.id === clock.id ? { ...c, isArchived: !c.isArchived } : c));
  };

  const handleDelete = () => {
      if (clockToDelete) {
          setClocks(prev => prev.filter(c => c.id !== clockToDelete.id));
          setClockToDelete(null);
      }
  };

  if (isEditing) {
      return (
        <div className="h-full bg-app relative flex flex-col">
            {/* Floating Header */}
            <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-center pointer-events-none">
                <button 
                  type="button"
                  onClick={() => { play('CLICK'); setIsEditing(false); }}
                  className="p-2 bg-black/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-black/60 shadow-lg pointer-events-auto transition-all active:scale-95"
                >
                  <X size={24} />
                </button>
                
                <button 
                  type="button"
                  onClick={() => { play('CLICK'); handleSave(); }}
                  disabled={!formData.name?.trim()}
                  className="p-2 bg-success/20 backdrop-blur-md text-success hover:bg-success/30 rounded-full shadow-lg pointer-events-auto transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Salvar"
                >
                  <Save size={24} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pt-20">
                <div className="max-w-md mx-auto space-y-4">
                   <div className="flex justify-between items-center mb-2">
                     <h2 className="text-xl font-bold text-txt-main">
                       {formData.id ? 'Editar Relógio' : 'Novo Relógio'}
                     </h2>
                   </div>

                   <div>
                     <label className="text-xs uppercase font-bold text-txt-muted block mb-1">Nome</label>
                     <input 
                       value={formData.name}
                       onChange={e => setFormData({...formData, name: e.target.value})}
                       className="w-full bg-card border border-border rounded p-3 text-txt-main outline-none focus:border-primary placeholder-txt-dim"
                       placeholder="Ex: Alerta dos Guardas"
                     />
                   </div>

               <div>
                 <label className="text-xs uppercase font-bold text-txt-muted block mb-1">Tipo</label>
                 <div className="grid grid-cols-2 gap-2">
                     {CLOCK_TYPES.map(t => (
                         <button
                           key={t.type}
                           onClick={() => { play('CLICK'); setFormData({...formData, type: t.type}); }}
                           className={`p-2 rounded border flex items-center gap-2 text-sm font-bold transition-all ${
                               formData.type === t.type 
                               ? 'bg-card-hover border-primary text-txt-main' 
                               : 'bg-card border-border text-txt-muted hover:text-txt-main'
                           }`}
                         >
                            <span style={{ color: t.color }}>{t.icon}</span>
                            {t.label}
                         </button>
                     ))}
                 </div>
               </div>

               <div>
                 <label className="text-xs uppercase font-bold text-txt-muted block mb-1">Segmentos</label>
                 <div className="grid grid-cols-5 gap-2 mb-4">
                     {[4, 6, 8, 10, 12].map(num => (
                         <button
                           key={num}
                           onClick={() => { play('CLICK'); setFormData({...formData, segments: num}); }}
                           className={`py-2 rounded border font-bold text-sm transition-all ${
                               formData.segments === num
                               ? 'bg-primary text-on-primary border-primary'
                               : 'bg-card border-border text-txt-muted hover:text-txt-main'
                           }`}
                         >
                             {num}
                         </button>
                     ))}
                 </div>

                 <label className="text-xs uppercase font-bold text-txt-muted block mb-1">Outro Valor</label>
                 <div className="flex flex-col items-center justify-center bg-card/50 p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-4">
                        <button 
                          onClick={() => { play('CLICK'); setFormData({...formData, segments: Math.max(2, (formData.segments || 4) - 1)}); }}
                          className="w-10 h-10 flex items-center justify-center bg-app hover:bg-card-hover text-txt-muted rounded-lg border border-border active:scale-95 transition-all"
                        >
                          <Minus size={20} />
                        </button>
                        
                        <div className="flex flex-col items-center min-w-[60px]">
                           <input 
                              type="number"
                              min="2"
                              value={formData.segments}
                              onChange={e => setFormData({...formData, segments: parseInt(e.target.value) || 0})}
                              className="w-full bg-transparent text-center font-black text-2xl text-primary outline-none"
                           />
                           <span className="text-[10px] uppercase font-bold text-txt-dim">Segmentos</span>
                        </div>

                        <button 
                          onClick={() => { play('CLICK'); setFormData({...formData, segments: (formData.segments || 4) + 1}); }}
                          className="w-10 h-10 flex items-center justify-center bg-app hover:bg-card-hover text-txt-muted rounded-lg border border-border active:scale-95 transition-all"
                        >
                          <Plus size={20} />
                        </button>
                    </div>
                 </div>
               </div>

               {formData.type === 'TUG_OF_WAR' && (
                   <div>
                     <label className="text-xs uppercase font-bold text-txt-muted block mb-1">Ao Atingir Mínimo (0) (Opcional)</label>
                     <input 
                       value={formData.completionTextMin || ''}
                       onChange={e => setFormData({...formData, completionTextMin: e.target.value})}
                       className="w-full bg-card border border-border rounded p-3 text-txt-main outline-none focus:border-primary placeholder-txt-dim text-sm"
                       placeholder="Ex: A revolução falha!"
                     />
                   </div>
               )}

               <div>
                 <label className="text-xs uppercase font-bold text-txt-muted block mb-1">Ao Completar (Opcional)</label>
                 <input 
                   value={formData.completionText}
                   onChange={e => setFormData({...formData, completionText: e.target.value})}
                   className="w-full bg-card border border-border rounded p-3 text-txt-main outline-none focus:border-primary placeholder-txt-dim text-sm"
                   placeholder="Ex: O combate começa!"
                 />
               </div>
            </div>
        </div>
      </div>
      );
  }

    return (
      <div className="h-full flex flex-col bg-app">
         <div className="flex justify-between items-center p-4 border-b border-border bg-app/95 sticky top-0 z-10 backdrop-blur-sm h-16 no-print">
            <div className="flex items-center gap-2 flex-1 bg-card/50 border border-border rounded-lg px-3 py-2 mr-2 focus-within:border-primary transition-colors">
               <Search size={16} className="text-txt-dim" />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Buscar..." 
                 className="bg-transparent border-none outline-none text-sm text-txt-main placeholder-txt-dim w-full"
               />
               {searchQuery && (
                 <button onClick={() => setSearchQuery('')} className="text-txt-dim hover:text-txt-main">
                   <X size={14} />
                 </button>
               )}
            </div>
                      <button 
                         onClick={() => { play('CLICK'); handleCreate(); }}
                         className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-hover transition-all rounded-xl flex items-center justify-center font-bold whitespace-nowrap uppercase tracking-wider text-[10px] shadow-sm active:scale-95"
                      >
                         <Plus size={16} className="mr-1" /> Novo
                      </button>         </div>
  
         {/* Active Clocks List */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex justify-between items-center mb-2 pt-2">
               <h3 className="text-xs font-bold text-txt-muted uppercase tracking-wider">Ativos ({activeClocks.length})</h3>
            </div>
          {activeClocks.length === 0 && (
              <div className="text-center py-8 text-txt-dim border-2 border-dashed border-border rounded-xl">
                  <p>Nenhum relógio ativo.</p>
              </div>
          )}

          {activeClocks.map(clock => (
              <div key={clock.id}>
                 <ClockBar 
                    clock={clock} 
                    onTick={(delta, target) => handleTick(clock, delta, target)}
                    onEdit={() => handleEdit(clock)}
                    onDelete={() => setClockToDelete(clock)}
                    onArchive={() => handleArchive(clock)}
                 />
              </div>
          ))}

          {/* Archived Section */}
          {archivedClocks.length > 0 && (
             <div className="pt-8 pb-24">
                 <div className="flex items-center gap-2 mb-4">
                    <Archive size={14} className="text-txt-muted" />
                    <h3 className="text-xs font-bold text-txt-muted uppercase tracking-wider">Arquivados ({archivedClocks.length})</h3>
                 </div>

                 <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {archivedClocks.map(clock => (
                        <div key={clock.id} className="bg-card/50 border border-border rounded-lg p-3 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-2">
                                <span className="text-txt-dim font-mono text-xs">[{clock.filled}/{clock.segments}]</span>
                                <span className="font-bold text-sm text-txt-main">{clock.name}</span>
                            </div>
                            <div className="flex gap-1.5">
                                <button 
                                   onClick={() => { play('CLICK'); handleArchive(clock); }}
                                   className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors shadow-sm"
                                   title="Restaurar"
                                >
                                   <Archive size={14} />
                                </button>
                                <button 
                                   onClick={() => { play('CLICK'); setClockToDelete(clock); }}
                                   className="w-7 h-7 flex items-center justify-center rounded-full bg-error/20 text-error hover:bg-error/30 transition-colors shadow-sm"
                                   title="Excluir"
                                >
                                   <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
          )}
       </div>

       {/* Delete Modal */}
       <ConfirmDeleteModal 
        isOpen={!!clockToDelete}
        title="Excluir Relógio"
        description={
          <>
            Tem certeza que deseja excluir permanentemente <strong>{clockToDelete?.name}</strong>?
            <br/>
            <span className="text-xs text-txt-dim mt-1 block">Esta ação não pode ser desfeita.</span>
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => { play('CLICK'); setClockToDelete(null); }}
      />
    </div>
  );
};

export default ClocksView;