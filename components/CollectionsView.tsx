import React, { useState, useEffect } from 'react';
import { Collection, CollectionItem, CollectionType, LogEntry, WikiEntry } from '../types';
import { generatePortent, generateUUID, shuffleArray, getLuminance, adjustColorBrightness, processCollectionText, parseLinkedContent, createAutoEntry } from '../utils';
import { Sparkles, User, Plus, Trash2, Edit2, Dices, Layers, X, Save, RefreshCw, Sticker, Eye, Zap, Search, Copy, Check } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';
import { useTheme } from '../contexts/ThemeContext';
import IconPicker, { PRESET_COLORS } from './IconPicker';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import TextareaWithAutocomplete from './TextareaWithAutocomplete';
import LinkedText from './LinkedText';

interface CollectionsViewProps {
  addLog: (entry: LogEntry) => void;
  collections: Collection[];
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;    
  entries: WikiEntry[];
  onCreateEntries?: (newEntries: WikiEntry[]) => void;
  onNavigateToWiki?: (entryId: string | null, createSlug?: string) => void;
}

const CollectionsView: React.FC<CollectionsViewProps> = ({
    addLog,
    collections,
    setCollections,
    entries,
    onCreateEntries,
    onNavigateToWiki
}) => {
  const { activeThemeId, allThemes } = useTheme();
  const activeTheme = allThemes.find(t => t.id === activeThemeId);
  const isLightMode = activeTheme ? getLuminance(activeTheme.colors.appBg) > 128 : false;

  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);
  const [isEditingCollection, setIsEditingCollection] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Global toggle for edit mode

  // Deck State Map: { [collectionId]: { items, discarded } }
  const [deckStates, setDeckStates] = useState<Record<string, { items: CollectionItem[], discarded: CollectionItem[] }>>({});

  // Result Area State
  const [lastResult, setLastResult] = useState<{ 
    type: 'TEXT' | 'CARD' | 'VISUAL';
    title: string;
    text: string;
    subtext?: string;
    icon?: string;
    color?: string;
    visuals?: { name: string; url: string; color: string }[];
    collectionId?: string;
  } | null>(null);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const { play } = useGameSound();

  const handleCopy = async () => {
    if (!lastResult) return;
    try {
        const textToCopy = lastResult.text; 
        const cleanText = textToCopy.replace(/\*\*/g, '');
        await navigator.clipboard.writeText(cleanText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error('Failed to copy!', err);
    }
  };

  const handleClear = () => {
      play('CLICK');
      setLastResult(null);
  };

  const filteredCollections = collections.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||       
      c.description.toLowerCase().includes(searchQuery.toLowerCase())    
  );

  // --- ACTIONS ---

  const handleRollTable = (col: Collection) => {
    play('ROLL');
    
    // Special: Visual Portent
    if (col.id === 'built-in-visual-portent') {
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
       
       setLastResult({
         type: 'VISUAL',
         title: 'Presságio Visual',
         text: '',
         visuals: newVisuals,
         collectionId: col.id
       });
       
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

    if (col.id === 'built-in-portent') {
      result = { text: generatePortent() };
    } else {
      const idx = Math.floor(Math.random() * col.items.length);
      const rawResult = col.items[idx];
      
      const { text, details } = processCollectionText(rawResult.text, collections);
      const combinedDetails = [rawResult.subtext, ...details].filter(Boolean).join(' | ');

      result = { 
          ...rawResult, 
          text: text,
          subtext: combinedDetails
      };

      if (onCreateEntries) {
          const { links } = parseLinkedContent(text, entries);
          const mentions = links.filter(l => l.type === 'mention' && !l.entryId);
          const uniqueTitles = [...new Set(mentions.map(m => m.value.replace(/_/g, ' ')))];
          const newWikiEntries = uniqueTitles.map(t => createAutoEntry(t, entries));
          if (newWikiEntries.length > 0) onCreateEntries(newWikiEntries);
      }
    }

    setLastResult({
      type: 'TEXT',
      title: col.title,
      text: result.text,
      subtext: result.subtext,
      collectionId: col.id
    });

    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'GENERATOR',
      title: col.title,
      result: result.text,
      details: result.subtext
    });
  };

  const handleDrawCard = (col: Collection) => {
    // Get current state or init
    const currentState = deckStates[col.id] || { items: shuffleArray(col.items), discarded: [] };
    
    if (currentState.items.length === 0) {
      // Auto reshuffle if empty? Or just show empty?
      // Let's show empty in result
      setLastResult({
        type: 'TEXT',
        title: col.title,
        text: 'Baralho Vazio',
        subtext: 'Reembaralhe para sacar mais cartas.',
        collectionId: col.id
      });
      return;
    }

    const [drawnItem, ...remaining] = currentState.items;
    
    const { text, details } = processCollectionText(drawnItem.text, collections);
    // Use raw subtext if available, fallback to processed details for consistency
    const combinedDetails = drawnItem.subtext || details.join(' | ');

    const drawn = {
        ...drawnItem,
        text: text,
        subtext: combinedDetails
    };

    if (onCreateEntries) {
        const { links } = parseLinkedContent(text, entries);
        const mentions = links.filter(l => l.type === 'mention' && !l.entryId);
        const uniqueTitles = [...new Set(mentions.map(m => m.value.replace(/_/g, ' ')))];
        const newWikiEntries = uniqueTitles.map(t => createAutoEntry(t, entries));
        if (newWikiEntries.length > 0) onCreateEntries(newWikiEntries);
    }
    
    // Update Deck State
    setDeckStates(prev => ({
      ...prev,
      [col.id]: {
        items: remaining,
        discarded: [drawn, ...currentState.discarded]
      }
    }));

    setLastResult({
      type: 'CARD',
      title: `Saque: ${col.title}`,
      text: drawn.text,
      subtext: drawn.subtext,
      icon: drawn.icon,
      color: drawn.color,
      collectionId: col.id
    });

    play('CARD');

    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'DRAW',
      title: `Saque: ${col.title}`,
      result: drawn.text,
      details: drawn.subtext
    });
  };

  const handleShuffle = (col: Collection) => {
    setDeckStates(prev => ({
      ...prev,
      [col.id]: {
        items: shuffleArray(col.items),
        discarded: []
      }
    }));
    
    setLastResult({
      type: 'TEXT',
      title: col.title,
      text: 'Baralho Embaralhado',
      subtext: `${col.items.length} cartas prontas.`,
      collectionId: col.id
    });

    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'NOTE',
      title: 'Baralho',
      result: `${col.title} foi embaralhado.`
    });
  };

  // --- CRUD Actions ---

  const confirmDeleteCollection = () => {
    if (collectionToDelete) {
      setCollections(prev => prev.filter(c => c.id !== collectionToDelete.id));
      setCollectionToDelete(null);
    }
  };

  const handleEditCollection = (col: Collection) => {
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
    setIsEditingCollection(true);
  };

  const handleCreateCollection = () => {
    setFormData({ id: generateUUID(), title: '', description: '', type: 'TABLE', items: [], icon: undefined, iconColor: '#ffffff' });
    setBulkItems('');
    setIsEditingCollection(true);
  };

  const handleSaveCollection = () => {
    if (!formData.title) return;

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

    setIsEditingCollection(false);
  };

  // --- STYLING HELPERS ---

  const getCollectionStyles = (col: Collection) => {
    if (col.id === 'built-in-portent') {
      return {
        container: 'border-purple-500/30 hover:border-purple-500',       
        iconBg: isLightMode ? 'bg-purple-200' : 'bg-purple-900/30',      
        iconColor: isLightMode ? 'text-purple-800' : 'text-purple-400',  
        icon: <Sparkles size={24} />
      };
    }
    if (col.id === 'built-in-visual-portent') {
      return {
        container: 'border-teal-500/30 hover:border-teal-500',
        iconBg: isLightMode ? 'bg-teal-200' : 'bg-teal-900/30',
        iconColor: isLightMode ? 'text-teal-800' : 'text-teal-400',      
        icon: <Eye size={24} />
      };
    }
    if (col.id === 'built-in-npc') {
      return {
        container: 'border-yellow-500/30 hover:border-yellow-500',       
        iconBg: isLightMode ? 'bg-yellow-200' : 'bg-yellow-900/30',      
        iconColor: isLightMode ? 'text-yellow-800' : 'text-yellow-400',  
        icon: <User size={24} />
      };
    }
    if (col.id === 'built-in-twene') {
      return {
        container: 'border-orange-500/30 hover:border-orange-500',       
        iconBg: isLightMode ? 'bg-orange-200' : 'bg-orange-900/30',      
        iconColor: isLightMode ? 'text-orange-800' : 'text-orange-400',  
        icon: <Zap size={24} />
      };
    }

    if (col.type === 'DECK') {
      return {
        container: 'border-primary/30 hover:border-primary',
        iconBg: 'bg-primary/20',
        iconColor: 'text-primary',
        icon: <Layers size={24} />
      };
    }

    return {
      container: 'border-success/30 hover:border-success',
      iconBg: 'bg-success/20',
      iconColor: 'text-success',
      icon: <Dices size={24} />
    };
  };

  // --- RENDERERS ---

  if (isEditingCollection) {
    return (
      <div className="h-full bg-app relative flex flex-col">
        {/* Floating Header */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-center pointer-events-none">
            <button 
              type="button"
              onClick={() => { play('CLICK'); setIsEditingCollection(false); }}
              className="p-2 bg-black/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-black/60 shadow-lg pointer-events-auto transition-all active:scale-95"
            >
              <X size={24} />
            </button>
            
            <button 
              type="button"
              onClick={() => { play('CLICK'); handleSaveCollection(); }} 
              disabled={!formData.title?.trim()}
              className="p-2 bg-success/20 backdrop-blur-md text-success hover:bg-success/30 rounded-full shadow-lg pointer-events-auto transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"    
              title="Salvar"
            >
              <Save size={24} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-20">
          <div className="max-w-md mx-auto space-y-4">
             {/* Form Content */}
             <div>
               <label className="text-xs uppercase font-bold text-txt-muted block mb-1">Título</label>
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
                                  maskImage: `url(\"/icons/${formData.icon}.svg\")`,
                                  maskRepeat: 'no-repeat',
                                  maskPosition: 'center',
                                  maskSize: 'contain',
                                  WebkitMaskImage: `url(\"/icons/${formData.icon}.svg\")`,
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
                     placeholder="Ex: Encontros na Floresta"
                     value={formData.title}
                     onChange={e => setFormData({...formData, title: e.target.value})}
                   />
               </div>
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
                </div>
              </div>
           )}
           
           <div>
             <label className="text-xs uppercase font-bold text-txt-muted block mb-1">Descrição</label>
             <input 
               className="w-full bg-card border border-border rounded p-3 text-txt-main text-sm outline-none focus:border-primary placeholder-txt-dim"
               placeholder="Ex: Combates ou boas surpresas"
               value={formData.description}
               onChange={e => setFormData({...formData, description: e.target.value})}
             />
           </div>
           
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
              <TextareaWithAutocomplete 
                className="w-full min-h-[160px] bg-card border border-border rounded p-3 text-txt-main text-sm font-mono outline-none focus:border-primary placeholder-txt-dim"
                placeholder={"Item 1\nItem 2\nItem 3"}
                value={bulkItems}
                onChange={setBulkItems}
                entries={[]}
                customCategories={[]}
                collections={collections}
              />
           </div>
        </div>
      </div>
      </div>
    );
  }

  // --- RESULT AREA COMPONENT ---

  const renderResultArea = () => {
    if (!lastResult) {
       return (
         <div className="flex flex-col items-center justify-center p-8 text-txt-dim border-b border-border bg-card/50 h-56 shrink-0">
            <Dices size={48} className="mb-2 opacity-50" />
            <p className="font-bold text-sm uppercase tracking-wider">Selecione uma ferramenta</p>
         </div>
       );
    }

    const canReshuffle = lastResult && lastResult.collectionId && deckStates[lastResult.collectionId]?.discarded.length > 0;

    // Card Rendering Logic
    if (lastResult.type === 'CARD') {
        const index = Array.from(lastResult.text)[0]?.toUpperCase() || '';
        const isRed = lastResult.color === 'red';
        const colorClass = isRed ? 'text-red-600' : 'text-black';
        
        return (
          <div className="p-4 border-b border-border bg-card shadow-sm animate-in fade-in slide-in-from-top-2 relative h-56 flex flex-col items-center justify-center shrink-0 overflow-hidden">
             
             {/* Controls (Reshuffle, Clear, Copy) - Absolute Positioned */}
             {canReshuffle && (
                <button
                   onClick={() => { play('CLICK'); handleShuffle(collections.find(c => c.id === lastResult.collectionId!)!); }}
                   className="absolute top-2 left-2 p-2 text-txt-dim hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-300 z-20" 
                   title="Embaralhar"
                >
                   <RefreshCw size={20} />
                </button>
             )}
             
             <button
                onClick={handleClear}
                className="absolute bottom-2 left-2 p-2 text-txt-dim hover:text-error hover:bg-error/10 rounded-full transition-all duration-300 z-20"     
                title="Limpar resultado"
             >
                <Trash2 size={20} />
             </button>

             {/* The Physical Card */}
             <div className="relative group perspective-1000">
                 <div className="w-40 h-48 bg-white rounded-2xl shadow-xl border-2 border-gray-200 relative flex flex-col items-center justify-center p-4 text-black select-none transition-transform hover:scale-105 duration-300 animate-in zoom-in-95 slide-in-from-bottom-2">
                    
                    {/* Top Left Index */}
                    <div className={`absolute top-2 left-3 flex flex-col items-center leading-none ${colorClass}`}>
                        <span className="font-black text-xl">{index}</span>
                        {lastResult.icon && <div className="text-xs mt-0.5">{lastResult.icon}</div>}
                    </div>

                    {/* Bottom Right Index (Inverted) */}
                    <div className={`absolute bottom-2 right-3 flex flex-col items-center leading-none rotate-180 ${colorClass}`}>
                        <span className="font-black text-xl">{index}</span>
                        {lastResult.icon && <div className="text-xs mt-0.5">{lastResult.icon}</div>}
                    </div>

                    {/* Center Content */}
                    <div className={`text-center z-10 w-full ${colorClass}`}>
                        {(() => {
                            const emojiMatch = lastResult.text.match(/^([\p{Emoji}\uFE0F\u200D]+)\s*(.*)$/u);
                            if (emojiMatch && emojiMatch[1] && !lastResult.icon) {
                                const emoji = emojiMatch[1];
                                const rest = emojiMatch[2];
                                return (
                                    <>
                                        <div className="text-6xl mb-4 -mt-4">{emoji}</div>
                                        <h3 className={`font-black font-serif leading-tight px-1 ${
                                            rest.length < 4 ? 'text-3xl' :
                                            rest.length < 10 ? 'text-xl' :
                                            rest.length < 20 ? 'text-base' :
                                            'text-[10px] break-words hyphens-auto'
                                        }`}>
                                            {rest}
                                        </h3>
                                    </>
                                );
                            } else {
                                return (
                                    <>
                                        {lastResult.icon && (
                                            <div className="text-5xl mb-2 opacity-90">{lastResult.icon}</div>
                                        )}
                                        <h3 className={`font-black font-serif leading-tight px-1 ${
                                            lastResult.text.length < 4 ? 'text-4xl' :
                                            lastResult.text.length < 10 ? 'text-2xl' :
                                            lastResult.text.length < 20 ? 'text-lg' :
                                            'text-xs break-words hyphens-auto'
                                        }`}>
                                            {lastResult.text}
                                        </h3>
                                    </>
                                );
                            }
                        })()}
                        
                        {lastResult.subtext && (
                            <p className="text-[10px] text-gray-500 mt-2 border-t border-gray-200 pt-1 line-clamp-3 font-sans font-medium">
                                {lastResult.subtext}
                            </p>
                        )}
                    </div>
                 </div>
             </div>
          </div>
        );
    }

    // Default (Text/Visual) Rendering
    return (
      <div className="p-4 border-b border-border bg-card shadow-sm animate-in fade-in slide-in-from-top-2 relative h-56 flex flex-col items-center justify-center shrink-0">
         {/* Top Left: Reshuffle (If Deck) */}
         {canReshuffle && (
            <button
               onClick={() => { play('CLICK'); handleShuffle(collections.find(c => c.id === lastResult.collectionId!)!); }}
               className="absolute top-2 left-2 p-2 text-txt-dim hover:text-primary hover:bg-primary/10 rounded-full transition-all duration-300" 
               title="Embaralhar"
            >
               <RefreshCw size={20} />
            </button>
         )}

         {/* Title Badge - Centered */}
         <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-txt-muted bg-app px-2 py-1 rounded-lg border border-border shadow-sm">
               {lastResult.title}
            </span>
         </div>

         {/* Content */}
         <div className="text-center w-full max-w-lg mt-6 mb-6">
             {lastResult.type === 'VISUAL' && lastResult.visuals ? (     
                  <div className="flex justify-center gap-4 py-4">       
                      {lastResult.visuals.map((res, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 group">
                              <div 
                                  className="w-20 h-20 sm:w-28 sm:h-28 bg-card-hover rounded-2xl flex items-center justify-center border border-border shadow-md transition-transform group-hover:scale-105"
                                  title={res.name}
                              >
                                  <div 
                                      className="w-12 h-12 sm:w-18 sm:h-18"
                                      style={{
                                          backgroundColor: res.color,    
                                          maskImage: `url(\"${res.url}\")`,
                                          maskRepeat: 'no-repeat',       
                                          maskPosition: 'center',        
                                          maskSize: 'contain',
                                          WebkitMaskImage: `url(\"${res.url}\")`,
                                          WebkitMaskRepeat: 'no-repeat', 
                                          WebkitMaskPosition: 'center',  
                                          WebkitMaskSize: 'contain'      
                                      }}
                                  />
                              </div>
                          </div>
                      ))}
                  </div>
             ) : (
                <>
                  <div className={`font-black text-txt-main ${lastResult.text.length > 50 ? 'text-lg' : 'text-2xl'}`}>
                     <LinkedText 
                        content={lastResult.text}
                        entries={entries}
                        onMentionClick={(slug, id) => onNavigateToWiki?.(id || null, !id ? slug : undefined)}
                        onTagClick={(slug, id) => onNavigateToWiki?.(id || null, !id ? slug : undefined)}
                     />
                  </div>
                  {lastResult.subtext && (
                     <p className="mt-2 text-sm text-txt-muted border-t border-border/50 pt-2 inline-block px-4">
                        {lastResult.subtext}
                     </p>
                  )}
                  {lastResult.icon && (
                      <div className="mt-4 text-4xl">{lastResult.icon}</div>
                  )}
                </>
             )}
         </div>

         {/* Bottom Left: Trash/Clear */}
         <button 
            onClick={handleClear}
            className="absolute bottom-2 left-2 p-2 text-txt-dim hover:text-error hover:bg-error/10 rounded-full transition-all duration-300"     
            title="Limpar resultado"
         >
            <Trash2 size={20} />
         </button>

         {/* Bottom Right: Copy */}
         {lastResult.type !== 'VISUAL' && (
            <button 
                onClick={handleCopy}
                className={`absolute bottom-2 right-2 p-2 rounded-full transition-all duration-300 ${ 
                  isCopied 
                    ? 'bg-success text-on-success scale-110' 
                    : 'text-txt-dim hover:text-primary hover:bg-primary/10'
                }`}
                title="Copiar resultado"
            >
                {isCopied ? <Check size={20} /> : <Copy size={20} />}    
            </button>
         )}
      </div>
    );
  };

  // --- MAIN VIEW ---

  return (
    <div className="h-full flex flex-col overflow-hidden bg-app">        

      {/* 1. Toolbar (Now at the top) */}
      <div className="flex justify-between items-center p-4 border-b border-border bg-app/95 sticky top-0 z-10 backdrop-blur-sm h-16 no-print">   
          <div className="flex items-center gap-2 flex-1 bg-card/50 border border-border rounded-lg px-3 py-2 mr-2 focus-within:border-primary transition-colors">
              <Search size={16} className="text-txt-dim" />
              <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="bg-transparent border-none outline-none text-sm text-txt-main placeholder-txt-dim w-full"
              />
              {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-txt-dim hover:text-txt-main">
                  <X size={14} />
                  </button>
              )}
          </div>

          <div className="flex gap-2">
              <button 
                  onClick={() => { play('CLICK'); setIsEditMode(!isEditMode); }}
                  className={`px-4 py-2 transition-all rounded-xl flex items-center justify-center font-bold whitespace-nowrap uppercase tracking-wider text-[10px] shadow-sm active:scale-95 border ${isEditMode ? 'bg-primary text-on-primary border-primary' : 'bg-card text-txt-muted border-border hover:text-txt-main'}`}
              >
                  <Edit2 size={14} className="mr-1" />
                  Editar
              </button>
              <button 
                  onClick={() => { play('CLICK'); handleCreateCollection(); }}
                  className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-hover transition-all rounded-xl flex items-center justify-center font-bold whitespace-nowrap uppercase tracking-wider text-[10px] shadow-sm active:scale-95"
              >
                  <Plus size={14} className="mr-1" />
                  Nova
              </button>
          </div>
      </div>

      {/* 2. Common Result Area */}
      <div className="flex-none z-10">
          {renderResultArea()}
      </div>

      {/* 3. Grid of Buttons */}
      <div className="flex-1 overflow-y-auto p-4 bg-app">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-24">
            {filteredCollections.map(col => {
                const styles = getCollectionStyles(col);
                const customIconUrl = col.icon ? `/icons/${col.icon}.svg` : undefined;
                let dynamicBgStyle = {};
                if (customIconUrl && col.iconColor) {
                    const lum = getLuminance(col.iconColor);
                    const bg = adjustColorBrightness(col.iconColor, lum > 128 ? -150 : 150);
                    dynamicBgStyle = { backgroundColor: bg };
                }

                const deckInfo = deckStates[col.id];
                const itemsCount = col.type === 'DECK' && deckInfo       
                    ? deckInfo.items.length 
                    : col.items.length;

                return (
                  <button
                    key={col.id}
                    onClick={() => {
                        if (isEditMode) {
                          if (!col.isBuiltIn) {
                              play('CLICK');
                              handleEditCollection(col);
                          }
                        } else {
                          if (col.type === 'DECK') handleDrawCard(col);  
                          else handleRollTable(col);
                        }
                    }}
                    className={`relative flex items-start gap-3 p-3 rounded-xl border-b-4 shadow-md transition-all active:translate-y-1 active:border-b-0 text-left group 
                      ${isEditMode && !col.isBuiltIn ? 'animate-pulse border-dashed cursor-alias border-primary/50' : 'bg-card border-border hover:border-primary/50'}`}
                  >
                      {/* Icon Section */}
                      <div 
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center shrink-0 ${!customIconUrl ? styles.iconBg : ''} ${styles.iconColor}`}
                          style={dynamicBgStyle}
                      >
                          {customIconUrl ? (
                              <div 
                                  className="w-full h-full"
                                  style={{
                                      backgroundColor: col.iconColor || 'currentColor',
                                      maskImage: `url(\"${customIconUrl}\")`,
                                      maskRepeat: 'no-repeat',
                                      maskPosition: 'center',
                                      maskSize: '70%',
                                      WebkitMaskImage: `url(\"${customIconUrl}\")`,
                                      WebkitMaskRepeat: 'no-repeat',     
                                      WebkitMaskPosition: 'center',      
                                      WebkitMaskSize: '70%'
                                  }}
                              />
                          ) : (
                              React.cloneElement(styles.icon as any, { size: 24 })
                          )}
                      </div>

                      {/* Text Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="font-black text-[10px] sm:text-xs tracking-wider text-txt-main truncate mb-0.5">
                              {col.title}
                          </h3>
                          <p className="text-[9px] sm:text-[10px] text-txt-muted leading-tight line-clamp-2 opacity-80">
                              {col.description || (col.type === 'DECK' ? 'Baralho de cartas' : 'Tabela de resultados')}
                          </p>
                      </div>

                      {/* Count Badge (Top Right) */}
                      {col.id !== 'built-in-portent' && col.id !== 'built-in-visual-portent' && (
                        <span className={`absolute top-1 right-1.5 text-[8px] font-black opacity-30 group-hover:opacity-100 transition-opacity ${styles.iconColor}`}>
                            {itemsCount}
                        </span>
                      )}

                      {/* Delete Badge (Edit Mode) */}
                      {isEditMode && !col.isBuiltIn && (
                          <div 
                            onClick={(e) => { e.stopPropagation(); play('CLICK'); setCollectionToDelete(col); }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center shadow-lg z-10 hover:scale-110 transition-transform"
                          >
                                                          <Trash2 size={12} />                          </div>
                      )}
                  </button>
                );
            })}
          </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmDeleteModal 
        isOpen={!!collectionToDelete}
        title="Excluir Coleção"
        description={
          <>
            Tem certeza que deseja excluir permanentemente <strong>{collectionToDelete?.title}</strong>?
          </>
        }
        onConfirm={confirmDeleteCollection}
        onCancel={() => setCollectionToDelete(null)}
      />
    </div>
  );
};

export default CollectionsView;