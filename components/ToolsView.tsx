
import React, { useState, useEffect } from 'react';
import { Collection, CollectionItem, CollectionType, LogEntry } from '../types';
import { generatePortent, generateUUID, shuffleArray, getLuminance, adjustColorBrightness } from '../utils';
import { Sparkles, User, Plus, Trash2, Edit2, Dices, Layers, X, Save, RefreshCw, ChevronLeft, Zap, HelpCircle, Sticker, Eye } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';
import { useTheme } from '../contexts/ThemeContext';
import IconPicker, { PRESET_COLORS } from './IconPicker';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface ToolsViewProps {
  addLog: (entry: LogEntry) => void;
  collections: Collection[];
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
}

const ToolsView: React.FC<ToolsViewProps> = ({ addLog, collections, setCollections }) => {
  const { activeThemeId, allThemes } = useTheme();
  const activeTheme = allThemes.find(t => t.id === activeThemeId);
  // Threshold can be tweaked, but > 128 usually means light background
  const isLightMode = activeTheme ? getLuminance(activeTheme.colors.appBg) > 128 : false;

  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Deck State (Local to View for simplicity in this version, could be Global if persistence needed)
  const [deckState, setDeckState] = useState<{ id: string, items: CollectionItem[], discarded: CollectionItem[] } | null>(null);
  const [currentDraw, setCurrentDraw] = useState<CollectionItem | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Table State
  const [tableResult, setTableResult] = useState<CollectionItem | null>(null);
  const [visualResult, setVisualResult] = useState<{ name: string; url: string; color: string }[] | null>(null);
  const [allIcons, setAllIcons] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/icons.json?t=${new Date().getTime()}`)
      .then(res => {
         if (!res.ok) throw new Error(`Status: ${res.status}`);
         return res.json();
      })
      .then((data: string[]) => setAllIcons(data))
      .catch(err => console.error("Failed to load icons manifest", err));
  }, []);

  // Form State
  const [formData, setFormData] = useState<Partial<Collection>>({ title: '', description: '', type: 'TABLE', items: [] });
  const [bulkItems, setBulkItems] = useState('');

  // Delete Modal State
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  
  // Icon Picker State
  const [showIconPicker, setShowIconPicker] = useState(false);

  const { play } = useGameSound();

  // --- ACTIONS ---

  const handleOpenCollection = (col: Collection) => {
    play('CLICK');
    setActiveCollection(col);
    setTableResult(null);
    setVisualResult(null);
    setCurrentDraw(null);

    if (col.type === 'DECK') {
      // Initialize or Reset Deck
      // In a more persistent version, check if deckState.id === col.id matches existing state
      if (deckState?.id !== col.id) {
        setDeckState({
          id: col.id,
          items: shuffleArray(col.items),
          discarded: []
        });
      }
    }
  };

  const handleCloseCollection = () => {
    play('CLICK');
    setActiveCollection(null);
    // Not clearing deckState so user can go back to same deck state if they don't switch adventures
  };

  const handleRollTable = () => {
    if (!activeCollection) return;
    play('ROLL');

    if (activeCollection.id === 'built-in-visual-portent') {
       if (allIcons.length === 0) return;
       
       const newVisuals = [];
       for (let i = 0; i < 3; i++) {
          const randomIcon = allIcons[Math.floor(Math.random() * allIcons.length)];
          const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
          const name = randomIcon.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          newVisuals.push({
             name,
             url: `/icons/${randomIcon}.svg`,
             color: randomColor
          });
       }
       setVisualResult(newVisuals);
       
       addLog({
          id: generateUUID(),
          timestamp: Date.now(),
          type: 'GENERATOR',
          title: 'Presságio Visual',
          result: '',
          visualIcons: newVisuals
       });
       return;
    }

    let result: CollectionItem;

    if (activeCollection.id === 'built-in-portent') {
      // Lógica especial para Presságio (Combinação de 2 listas)
      result = { text: generatePortent() };
    } else {
      const idx = Math.floor(Math.random() * activeCollection.items.length);
      result = activeCollection.items[idx];
    }

    setTableResult(result);
    setTimeout(() => {
    }, 200);

    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'GENERATOR',
      title: activeCollection.title,
      result: result.text
    });
  };

  const handleDrawCard = () => {
    if (!deckState || deckState.items.length === 0) return;

    setIsDrawing(true);
    setTimeout(() => {
      const [drawn, ...remaining] = deckState.items;
      
      setDeckState({
        ...deckState,
        items: remaining,
        discarded: [drawn, ...deckState.discarded]
      });

      setCurrentDraw(drawn);
      setIsDrawing(false);
      play('CARD');

      addLog({
        id: generateUUID(),
        timestamp: Date.now(),
        type: 'DRAW',
        title: `Saque: ${activeCollection?.title}`,
        result: drawn.text,
        details: drawn.subtext
      });
    }, 400); // Animation delay
  };

  const handleShuffle = () => {
    if (!activeCollection) return;
    setDeckState({
      id: activeCollection.id,
      items: shuffleArray(activeCollection.items),
      discarded: []
    });
    setCurrentDraw(null);
    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'NOTE',
      title: 'Baralho',
      result: `${activeCollection.title} foi embaralhado.`
    });
  };

  // --- CRUD Actions ---

  const confirmDeleteCollection = () => {
    if (collectionToDelete) {
      setCollections(prev => prev.filter(c => c.id !== collectionToDelete.id));
      setCollectionToDelete(null);
      handleCloseCollection();
    }
  };

  const handleEditCollection = (col: Collection) => {
    // Convert items back to string for textarea
    const itemsString = col.items.map(i => i.text).join('\n');
    
    setFormData({
      id: col.id,
      title: col.title,
      description: col.description,
      type: col.type,
      items: col.items,
      icon: col.icon,
      iconColor: col.iconColor
    });
    setBulkItems(itemsString);
    setIsEditing(true);
  };

  const handleCreateCollection = () => {
    setFormData({ id: generateUUID(), title: '', description: '', type: 'TABLE', items: [], icon: undefined, iconColor: '#ffffff' });
    setBulkItems('');
    setIsEditing(true);
  };

  const handleSaveCollection = () => {
    if (!formData.title) return;

    // Parse Bulk Items
    const items: CollectionItem[] = bulkItems.split('\n').filter(line => line.trim()).map(line => ({ text: line.trim() }));
    
    const newCol: Collection = {
       id: formData.id || generateUUID(),
       title: formData.title!,
       description: formData.description || '',
       type: formData.type as CollectionType,
       items: items.length > 0 ? items : (formData.items || []),
       isBuiltIn: false,
       icon: formData.icon,
       iconColor: formData.iconColor
    };

    // Update Global State
    setCollections(prev => {
       const existingIndex = prev.findIndex(c => c.id === newCol.id);
       if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newCol;
          return updated;
       } else {
          return [...prev, newCol];
       }
    });

    // Update Local State if this is the active collection
    if (activeCollection && activeCollection.id === newCol.id) {
       setActiveCollection(newCol);
       
       // Force re-initialization of deck state if saving a DECK
       if (newCol.type === 'DECK') {
          setDeckState({
             id: newCol.id,
             items: shuffleArray(newCol.items),
             discarded: []
          });
          setCurrentDraw(null);
       } else {
          // If changed to table, clear table result
          setTableResult(null);
       }
    }

    setIsEditing(false);
  };

  // --- STYLING HELPERS ---

  const getCollectionStyles = (col: Collection) => {
    // Specific colors for built-ins
    // We reverse the logic for Light Mode to ensure visibility (Light Bg + Dark Icon)
    
    if (col.id === 'built-in-portent') {
      return {
        container: 'hover:border-purple-500/50',
        iconBg: isLightMode ? 'bg-purple-200' : 'bg-purple-900/30',
        iconColor: isLightMode ? 'text-purple-800' : 'text-purple-400',
        icon: <Sparkles size={20} />
      };
    }
    if (col.id === 'built-in-visual-portent') {
      return {
        container: 'hover:border-teal-500/50',
        iconBg: isLightMode ? 'bg-teal-200' : 'bg-teal-900/30',
        iconColor: isLightMode ? 'text-teal-800' : 'text-teal-400',
        icon: <Eye size={20} />
      };
    }
    if (col.id === 'built-in-npc') {
      return {
        container: 'hover:border-yellow-500/50',
        iconBg: isLightMode ? 'bg-yellow-200' : 'bg-yellow-900/30',
        iconColor: isLightMode ? 'text-yellow-800' : 'text-yellow-400',
        icon: <User size={20} />
      };
    }
    if (col.id === 'built-in-twene') {
      return {
        container: 'hover:border-orange-500/50',
        iconBg: isLightMode ? 'bg-orange-200' : 'bg-orange-900/30',
        iconColor: isLightMode ? 'text-orange-800' : 'text-orange-400',
        icon: <Zap size={20} />
      };
    }

    // Default types
    if (col.type === 'DECK') {
      return {
        container: 'hover:border-primary/50',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        icon: <Layers size={20} />
      };
    }

    return {
      container: 'hover:border-success/50',
      iconBg: 'bg-success/20',
      iconColor: 'text-success',
      icon: <Dices size={20} />
    };
  };

  // --- RENDERERS ---

  if (isEditing) {
    return (
      <div className="h-full p-4 overflow-y-auto bg-app">
        <div className="max-w-md mx-auto space-y-4">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-txt-main">
               {formData.id && collections.some(c => c.id === formData.id) ? 'Editar Coleção' : 'Nova Coleção'}
             </h2>
             <button onClick={() => { play('CLICK'); setIsEditing(false); }}><X className="text-txt-muted" /></button>
           </div>
           
           <div className="flex gap-2">
               <button
                  onClick={() => { play('CLICK'); setShowIconPicker(true); }}
                  className={`p-3 hover:bg-card-hover text-txt-muted hover:text-txt-main rounded-xl border border-border transition-colors flex-none ${formData.icon ? 'bg-card border-primary' : 'bg-card'}`}
                  title="Selecionar Ícone"
               >
                  {formData.icon ? (
                      <div 
                          className="w-6 h-6"
                          style={{
                              backgroundColor: formData.iconColor || 'currentColor',
                              maskImage: `url("/icons/${formData.icon}.svg")`,
                              maskRepeat: 'no-repeat',
                              maskPosition: 'center',
                              maskSize: 'contain',
                              WebkitMaskImage: `url("/icons/${formData.icon}.svg")`,
                              WebkitMaskRepeat: 'no-repeat',
                              WebkitMaskPosition: 'center',
                              WebkitMaskSize: 'contain'
                          }}
                      />
                  ) : (
                      <Sticker size={24} />
                  )}
               </button>

               <input 
                 className="flex-1 w-full bg-card border border-border rounded p-3 text-txt-main outline-none focus:border-primary placeholder-txt-dim" 
                 placeholder="Título (ex: Encontros na Floresta)"
                 value={formData.title}
                 onChange={e => setFormData({...formData, title: e.target.value})}
               />
           </div>
           
           {showIconPicker && (
              <div 
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                onClick={() => { play('CLICK'); setShowIconPicker(false); }}
              >
                <div 
                  className="w-full max-w-2xl bg-app border border-border rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col h-[70vh]"
                  onClick={e => e.stopPropagation()}
                >
                     <div className="flex-1 min-h-0 overflow-hidden">
                        <IconPicker 
                            selectedIcon={formData.icon}
                            selectedColor={formData.iconColor}
                            onSelect={(newIcon, newColor) => {
                                setFormData(prev => ({ ...prev, icon: newIcon, iconColor: newColor }));
                            }}
                            onClose={() => setShowIconPicker(false)}
                        />
                     </div>
                     <div className="p-4 border-t border-border flex justify-end">
                        <button 
                            onClick={() => { play('CLICK'); setShowIconPicker(false); }}
                            className="px-6 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-lg font-bold"
                        >
                            Confirmar
                        </button>
                     </div>
                </div>
              </div>
           )}
           
           <input 
             className="w-full bg-card border border-border rounded p-3 text-txt-main text-sm outline-none focus:border-primary placeholder-txt-dim" 
             placeholder="Descrição curta"
             value={formData.description}
             onChange={e => setFormData({...formData, description: e.target.value})}
           />
           
           <div className="flex gap-2 p-1 bg-card rounded border border-border">
              <button 
                onClick={() => { play('CLICK'); setFormData({...formData, type: 'TABLE'}); }}
                className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${formData.type === 'TABLE' ? 'bg-primary text-on-primary' : 'text-txt-muted hover:text-txt-main'}`}
              >
                Tabela
              </button>
              <button 
                onClick={() => { play('CLICK'); setFormData({...formData, type: 'DECK'}); }}
                className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${formData.type === 'DECK' ? 'bg-primary text-on-primary' : 'text-txt-muted hover:text-txt-main'}`}
              >
                Baralho
              </button>
           </div>

           <div>
              <label className="text-xs uppercase font-bold text-txt-muted mb-1 block">Itens (Um por linha)</label>
              <textarea 
                className="w-full h-40 bg-card border border-border rounded p-3 text-txt-main text-sm font-mono outline-none focus:border-primary placeholder-txt-dim"
                placeholder="Item 1&#10;Item 2&#10;Item 3"
                value={bulkItems}
                onChange={e => setBulkItems(e.target.value)}
              />
           </div>

           <button 
             onClick={() => { play('CLICK'); handleSaveCollection(); }}
             className="w-full bg-success hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg"
           >
             <Save size={18} /> Salvar Coleção
           </button>
        </div>
      </div>
    );
  }

  // ACTIVE COLLECTION VIEW (TABLE OR DECK)
  if (activeCollection) {
    const isDeck = activeCollection.type === 'DECK';
    
    return (
      <div className="flex flex-col h-full bg-app relative">
        {/* Header */}
        <div className="flex-none p-4 flex items-center justify-between gap-3 border-b border-border bg-app z-10">
           <div className="flex items-center gap-3">
              <button onClick={handleCloseCollection} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-black/60 shadow-lg transition-all active:scale-95">
                <X size={24} />
              </button>
              <div>
                <h2 className="text-lg font-bold text-txt-main leading-none">{activeCollection.title}</h2>
                <p className="text-xs text-txt-dim">{isDeck ? `${deckState?.items.length} cartas restantes` : 'Tabela de Rolagem'}</p>
              </div>
           </div>

           {!activeCollection.isBuiltIn && (
              <div className="flex gap-2">
                 <button 
                    onClick={() => { play('CLICK'); handleEditCollection(activeCollection); }}
                    className="p-2 bg-card rounded-full text-primary hover:text-on-primary hover:bg-primary transition-colors"
                    title="Editar"
                 >
                    <Edit2 size={20} />
                 </button>
                 <button 
                    onClick={() => { play('CLICK'); setCollectionToDelete(activeCollection); }}
                    className="p-2 bg-card rounded-full text-error hover:text-slate-100 hover:bg-error transition-colors"
                    title="Excluir"
                 >
                    <Trash2 size={20} />
                 </button>
              </div>
           )}
        </div>

        {/* Content Area - Responsive Flex (Col in Portrait, Row in Landscape) */}
        <div className="flex-1 flex flex-col landscape:flex-row items-center justify-center p-4 sm:p-6 gap-6 landscape:gap-8 overflow-hidden">
           
           {/* LEFT SIDE: RESULT (Card or Table Text) */}
           <div className="flex-1 w-full h-full flex items-center justify-center min-h-0">
             {isDeck ? (
               // Card Container
               <div className="relative w-56 h-80 sm:w-64 sm:h-96 landscape:w-48 landscape:h-72 lg:landscape:w-64 lg:landscape:h-96 perspective-1000">
                  {currentDraw ? (() => {
                    // Determine corner text: First letter/char if long, or full text if short (e.g. "10", "K")
                    const cornerText = currentDraw.text.length <= 2 
                      ? currentDraw.text 
                      : currentDraw.text.charAt(0).toUpperCase();

                    return (
                      <div className={`w-full h-full bg-white rounded-xl shadow-2xl border-4 border-white flex flex-col items-center justify-center relative animate-in zoom-in duration-300 ${isDrawing ? 'opacity-0' : 'opacity-100'}`}>
                         
                         {/* Top Left Corner */}
                         <div className="absolute top-2 left-2 text-2xl font-bold leading-none flex flex-col items-center" style={{ color: currentDraw.color || 'black' }}>
                            <span>{cornerText}</span>
                            {currentDraw.icon && <span className="text-lg mt-0.5">{currentDraw.icon}</span>}
                         </div>

                         {/* Center Content */}
                         <div className="flex flex-col items-center justify-center p-4 text-center w-full h-full" style={{ color: currentDraw.color || 'black' }}>
                            {currentDraw.icon ? (
                              // Standard Card Style (Big Icon)
                              <div className="text-7xl sm:text-8xl landscape:text-6xl font-black">{currentDraw.icon}</div>
                            ) : (
                              // Custom Card Style (Full Text Adjusted)
                              <div className={`font-black leading-tight break-words w-full ${currentDraw.text.length > 15 ? 'text-xl' : (currentDraw.text.length > 8 ? 'text-2xl' : 'text-4xl')}`}>
                                  {currentDraw.text}
                              </div>
                            )}
                            
                            {/* Subtext (if any) */}
                            {currentDraw.subtext && <p className="mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest absolute bottom-12">{currentDraw.subtext}</p>}
                         </div>

                         {/* Bottom Right Corner */}
                         <div className="absolute bottom-2 right-2 text-2xl font-bold rotate-180 leading-none flex flex-col items-center" style={{ color: currentDraw.color || 'black' }}>
                            <span>{cornerText}</span>
                            {currentDraw.icon && <span className="text-lg mt-0.5">{currentDraw.icon}</span>}
                         </div>
                      </div>
                    );
                  })() : (
                    <div className="w-full h-full bg-card rounded-xl border-2 border-border flex flex-col items-center justify-center text-txt-dim border-dashed">
                       <Layers size={48} className="mb-2" />
                       <span className="text-sm font-bold uppercase">Baralho</span>
                    </div>
                  )}
               </div>
             ) : (
               // Table Result Container
               <div className="w-full max-w-sm min-h-[160px] bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-lg transition-all landscape:h-full landscape:max-h-[80%]">
                  {activeCollection.id === 'built-in-visual-portent' && visualResult ? (
                      <div className="flex gap-2 sm:gap-4 animate-in fade-in zoom-in duration-300">
                          {visualResult.map((res, i) => (
                              <div key={i} className="flex flex-col items-center gap-2 group">
                                  <div 
                                      className="w-20 h-20 sm:w-28 sm:h-28 bg-card-hover rounded-xl flex items-center justify-center border border-border shadow-lg group-hover:border-primary/50 transition-colors"
                                      title={res.name}
                                  >
                                      <div 
                                          className="w-12 h-12 sm:w-16 sm:h-16 transition-transform group-hover:scale-110"
                                          style={{
                                              backgroundColor: res.color,
                                              maskImage: `url("${res.url}")`,
                                              maskRepeat: 'no-repeat',
                                              maskPosition: 'center',
                                              maskSize: 'contain',
                                              WebkitMaskImage: `url("${res.url}")`,
                                              WebkitMaskRepeat: 'no-repeat',
                                              WebkitMaskPosition: 'center',
                                              WebkitMaskSize: 'contain'
                                          }}
                                      />
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : tableResult ? (
                     <div className="animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-bold text-txt-main mb-1">{tableResult.text}</h3>
                        {tableResult.subtext && <p className="text-txt-muted">{tableResult.subtext}</p>}
                     </div>
                  ) : (
                     <div className="text-txt-dim flex flex-col items-center">
                        <Dices size={32} className="mb-2" />
                        <p className="text-sm uppercase font-bold">Role para ver o resultado</p>
                     </div>
                  )}
               </div>
             )}
           </div>

           {/* RIGHT SIDE: CONTROLS */}
           <div className="w-full max-w-xs space-y-3 landscape:max-w-sm landscape:w-1/3 landscape:space-y-0 landscape:gap-4 landscape:h-full landscape:flex landscape:flex-col landscape:justify-center">
              {isDeck ? (
                <>
                   <button 
                     onClick={handleDrawCard}
                     disabled={deckState?.items.length === 0}
                     className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:bg-card-hover text-on-primary font-bold py-4 landscape:py-8 rounded-xl shadow-lg active:translate-y-1 transition-all flex items-center justify-center gap-2 text-lg"
                   >
                     <Layers size={24} /> Sacar Carta
                   </button>
                   <button 
                     onClick={() => { play('CLICK'); handleShuffle(); }}
                     className="w-full bg-card hover:bg-card-hover text-txt-muted font-bold py-3 landscape:py-4 rounded-xl border border-border flex items-center justify-center gap-2"
                   >
                     <RefreshCw size={18} /> Embaralhar ({deckState?.discarded.length})
                   </button>
                </>
              ) : (
                 <button 
                   onClick={handleRollTable}
                   className="w-full bg-primary hover:bg-primary-hover text-on-primary font-bold py-4 landscape:py-8 rounded-xl shadow-lg active:translate-y-1 transition-all flex items-center justify-center gap-2 text-lg"
                 >
                   <Dices size={24} /> Rolar Tabela
                 </button>
              )}
           </div>
        </div>

        {/* DELETE CONFIRMATION MODAL */}
        <ConfirmDeleteModal 
          isOpen={!!collectionToDelete}
          title="Excluir Coleção"
          description={
            <>
              Tem certeza que deseja excluir permanentemente <strong>{collectionToDelete?.title}</strong>?
              <br/>
              <span className="text-xs text-txt-dim mt-1 block">Esta ação não pode ser desfeita.</span>
            </>
          }
          onConfirm={confirmDeleteCollection}
          onCancel={() => setCollectionToDelete(null)}
        />
      </div>
    );
  }

  // COLLECTION LIST VIEW
  return (
    <div className="flex flex-col h-full bg-app overflow-y-auto">
      {/* Responsive Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-24 max-w-7xl mx-auto w-full">
         
         {collections.map(col => {
            const styles = getCollectionStyles(col);
            const customIconUrl = col.icon ? `/icons/${col.icon}.svg` : undefined;
            
            // Calculate dynamic contrast bg for custom icons
            let dynamicBgStyle = {};
            if (customIconUrl && col.iconColor) {
                const lum = getLuminance(col.iconColor);
                // If icon is light (>128), we want a Dark background (-150).
                // If icon is dark (<128), we want a Light background (+150).
                const bg = adjustColorBrightness(col.iconColor, lum > 128 ? -150 : 150);
                dynamicBgStyle = { backgroundColor: bg };
            }

            return (
              <div 
                key={col.id}
                onClick={() => handleOpenCollection(col)}
                className={`bg-card border border-border ${styles.container} rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-all relative group shadow-sm flex flex-col aspect-[4/3]`}
              >
                 <div className="flex items-start justify-between mb-2">
                    <div 
                        className={`p-2 rounded-lg ${!customIconUrl ? styles.iconBg : ''} ${styles.iconColor}`}
                        style={dynamicBgStyle}
                    >
                       {customIconUrl ? (
                           <div 
                               className="w-5 h-5"
                               style={{
                                   backgroundColor: col.iconColor || 'currentColor',
                                   maskImage: `url("${customIconUrl}")`,
                                   maskRepeat: 'no-repeat',
                                   maskPosition: 'center',
                                   maskSize: 'contain',
                                   WebkitMaskImage: `url("${customIconUrl}")`,
                                   WebkitMaskRepeat: 'no-repeat',
                                   WebkitMaskPosition: 'center',
                                   WebkitMaskSize: 'contain'
                               }}
                           />
                       ) : (
                           styles.icon
                       )}
                    </div>
                 </div>
                 <div className="flex-1">
                   <h3 className="font-bold text-txt-main text-sm leading-tight line-clamp-1">{col.title}</h3>
                   <p className="text-[10px] text-txt-muted mt-1 line-clamp-3 opacity-80">{col.description}</p>
                 </div>
              </div>
            );
         })}

         {/* Add New Button */}
         <button 
           onClick={() => { play('CLICK'); handleCreateCollection(); }}
           className="w-full aspect-[4/3] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-txt-dim hover:text-primary hover:border-primary/50 bg-card/50 transition-all group"
         >
           <div className="bg-card p-3 rounded-full group-hover:bg-primary/10 transition-colors">
             <Plus size={32} />
           </div>
           <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-center">Nova Coleção</span>
         </button>
      </div>
    </div>
  );
};

export default ToolsView;
