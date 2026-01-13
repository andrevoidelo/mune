
import React, { useState, useRef, useEffect } from 'react';
import { Character, Attribute, AttributeType, LogEntry, InventoryItem, Resource } from '../types';
import { generateUUID, rollDiceNotation } from '../utils';
import { User, Plus, Trash2, Edit2, X, ChevronLeft, Shield, Backpack, Image as ImageIcon, Upload, Minus, CheckSquare, Square, Dices, Activity, Zap, TrendingUp, TrendingDown, Target, Sword, FileText } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';

interface PersonaViewProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  addLog: (entry: LogEntry) => void;
}

type ViewMode = 'LIST' | 'DETAIL' | 'FORM';
type RollMode = 'NORMAL' | 'ADVANTAGE' | 'DISADVANTAGE';

interface AttributeRollResult {
  charName: string;
  attrName: string;
  roll: number;
  target: number;
  isSuccess: boolean;
  rollType: AttributeType;
  diceNotation: string;
  detailText?: string;
}

interface ItemRollResult {
  itemName: string;
  roll: number;
  detailText: string;
  diceNotation: string;
}

interface ItemToUse {
  charName: string;
  item: InventoryItem | string;
}

interface PendingRoll {
  charName: string;
  attr: Attribute;
}

const PersonaView: React.FC<PersonaViewProps> = ({ characters, setCharacters, addLog }) => {
  const [mode, setMode] = useState<ViewMode>('LIST');
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Character | null>(null);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  
  // Rolling States
  const [pendingRoll, setPendingRoll] = useState<PendingRoll | null>(null);
  const [rollConfig, setRollConfig] = useState({ modifier: 0, mode: 'NORMAL' as RollMode });
  
  // Result States
  const [rollResult, setRollResult] = useState<AttributeRollResult | null>(null);
  const [itemRollResult, setItemRollResult] = useState<ItemRollResult | null>(null);
  const [isRevealing, setIsRevealing] = useState(false); // Controls the suspense animation for Attributes
  const [isItemRevealing, setIsItemRevealing] = useState(false); // Controls the suspense animation for Items

  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [itemToUse, setItemToUse] = useState<ItemToUse | null>(null);
  const [charToDelete, setCharToDelete] = useState<Character | null>(null);
  
  // State for adding new item in Form Mode
  const [newItemName, setNewItemName] = useState('');
  const [newItemDice, setNewItemDice] = useState('');
  const [newItemIsPermanent, setNewItemIsPermanent] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { play } = useGameSound();

  // --- Actions ---

  const handleCreateNew = () => {
    setFormData({
      id: generateUUID(),
      name: '',
      profession: '',
      description: '',
      imageUrl: '',
      attributes: [],
      resources: [],
      inventory: []
    });
    setNewItemName('');
    setNewItemDice('');
    setNewItemIsPermanent(false);
    setValidationErrors(new Set());
    setMode('FORM');
  };

  const handleEdit = (char: Character) => {
    // Data Migration for old string-based inventory
    const migratedInventory = char.inventory.map(item => {
      if (typeof item === 'string') {
        return {
          id: generateUUID(),
          name: item as string,
          quantity: 1,
          isPermanent: false
        };
      }
      return item;
    });

    setFormData({ 
      ...char, 
      inventory: migratedInventory,
      resources: char.resources || [] // Migration for resources
    });
    setNewItemName('');
    setNewItemDice('');
    setNewItemIsPermanent(false);
    setValidationErrors(new Set());
    setMode('FORM');
  };

  const handleDelete = (id: string) => {
    const char = characters.find(c => c.id === id);
    if (char) {
      setCharToDelete(char);
    }
  };

  const confirmDelete = () => {
    if (charToDelete) {
      setCharacters(prev => prev.filter(c => c.id !== charToDelete.id));
      if (selectedCharId === charToDelete.id) {
        setMode('LIST');
        setSelectedCharId(null);
      }
      setCharToDelete(null);
    }
  };

  const handleSave = () => {
    if (!formData || !formData.name.trim()) return;

    // Validation Logic
    const errors = new Set<string>();
    formData.attributes.forEach(attr => {
      if (!attr.dice || attr.dice.trim() === '') {
        errors.add(attr.id);
      }
    });

    if (errors.size > 0) {
      setValidationErrors(errors);
      // Optional: Add a toast notification here if desired
      return; 
    }

    setCharacters(prev => {
      const exists = prev.find(c => c.id === formData.id);
      if (exists) {
        return prev.map(c => c.id === formData.id ? formData : c);
      }
      return [...prev, formData];
    });
    
    // If we were editing the selected char, ensure selection stays valid
    if (selectedCharId === formData.id) {
       setSelectedCharId(formData.id);
    }
    
    setMode(selectedCharId && selectedCharId === formData.id ? 'DETAIL' : 'LIST');
    setFormData(null);
    setValidationErrors(new Set());
  };

  // 1. Trigger Pre-Roll Modal
  const initiateAttributeRoll = (charName: string, attr: Attribute) => {
    play('CLICK');
    // Allowed for all types, including NONE
    setPendingRoll({ charName, attr });
    setRollConfig({ modifier: 0, mode: 'NORMAL' });
  };

  // 2. Execute Roll with Config
  const executeRoll = () => {
    if (!pendingRoll) return;
    const { charName, attr } = pendingRoll;

    play('ROLL');

    // Use default 'd20' if undefined
    const diceNotation = attr.dice || 'd20';
    
    let val1 = rollDiceNotation(diceNotation);
    let val2 = rollDiceNotation(diceNotation);
    
    let finalRoll = val1.total;
    let logDetail = val1.detail; // e.g. "3d6 [1+2+3]"

    // Handle Advantage/Disadvantage Logic
    if (rollConfig.mode !== 'NORMAL') {
      const isUnder = attr.rollType === 'UNDER';
      const isAdv = rollConfig.mode === 'ADVANTAGE';
      
      let wantLow = isUnder;
      if (attr.rollType === 'NONE') wantLow = false;

      const takeLowest = (wantLow && isAdv) || (!wantLow && !isAdv);

      if (takeLowest) {
         finalRoll = Math.min(val1.total, val2.total);
      } else {
         finalRoll = Math.max(val1.total, val2.total);
      }
      // Re-format log detail for Adv/Disadv
      logDetail = `[${val1.total}, ${val2.total}] ➔ **${finalRoll}** (${rollConfig.mode === 'ADVANTAGE' ? 'Vant.' : 'Desv.'})`;
    } else {
      // Normal Mode formatting: append = Total
      logDetail = `${logDetail} = **${finalRoll}**`;
    }

    // Apply Modifier to Target
    const originalTarget = attr.value;
    const modifiedTarget = originalTarget + rollConfig.modifier;
    
    let success = false;
    let resultText = "";
    let logDetails = "";

    if (attr.rollType === 'NONE') {
        // No success/fail calculation
        resultText = finalRoll.toString();
        logDetails = `${logDetail}.`;
        setTimeout(() => play('DICE_RESULT'), 600);
    } else {
        if (attr.rollType === 'UNDER') {
          success = finalRoll <= modifiedTarget;
        } else {
          success = finalRoll >= modifiedTarget;
        }
        resultText = success ? "Sucesso" : "Falha";
        const modText = rollConfig.modifier !== 0 ? ` (Mod. Alvo: ${rollConfig.modifier > 0 ? '+' : ''}${rollConfig.modifier})` : '';
        logDetails = `${logDetail}. Alvo ${attr.rollType === 'UNDER' ? '≤' : '≥'} **${modifiedTarget}**${modText}`;

        setTimeout(() => {
            if (success) {
                play('SUCCESS');
            } else {
                play('FAILURE');
            }
        }, 600);
    }

    addLog({
      id: generateUUID(),
      timestamp: Date.now(),
      type: 'ATTRIBUTE',
      title: `${charName}: ${attr.name}`,
      result: resultText,
      details: logDetails,
      highlight: attr.rollType !== 'NONE' ? success : false
    });

    setPendingRoll(null);
    setRollResult({
      charName,
      attrName: attr.name,
      roll: finalRoll,
      target: modifiedTarget,
      isSuccess: success,
      rollType: attr.rollType,
      diceNotation,
      detailText: logDetail.replace(/\*\*/g, '') // Remove markup for modal display as it has its own styling
    });

    // Trigger Suspense Animation
    setIsRevealing(true);
    setTimeout(() => {
      setIsRevealing(false);
    }, 600); // 600ms suspense
  };

  const handleUseItem = (charName: string, item: InventoryItem | string) => {
    play('CLICK');
    // Always ask for confirmation first
    setItemToUse({ charName, item });
  };

  const confirmUseItem = () => {
    if (!itemToUse) return;

    const { charName, item } = itemToUse;
    const itemName = typeof item === 'string' ? item : item.name;
    const isPermanent = typeof item === 'string' ? false : item.isPermanent;
    const diceNotation = typeof item === 'string' ? undefined : item.dice;

    // If item has dice, roll it AFTER confirmation
    if (diceNotation && diceNotation.trim() !== '') {
        play('ROLL');
        const diceResult = rollDiceNotation(diceNotation);
        
        setTimeout(() => {
           play('DICE_RESULT');
        }, 600);

        addLog({
          id: generateUUID(),
          timestamp: Date.now(),
          type: 'ITEM',
          title: `${charName} usou ${itemName}`,
          result: diceResult.total.toString(),
          details: `${diceNotation} -> ${diceResult.detail}`,
          highlight: false
        });
  
        setItemRollResult({
          itemName: itemName,
          roll: diceResult.total,
          detailText: diceResult.detail,
          diceNotation: diceNotation
        });

        // Trigger Suspense Animation for Item
        setIsItemRevealing(true);
        setTimeout(() => {
          setIsItemRevealing(false);
        }, 600); 

    } else {
        // Standard usage logic (no dice)
        play('CLICK');
        addLog({
            id: generateUUID(),
            timestamp: Date.now(),
            type: 'ITEM',
            title: `${charName} usou item`,
            result: itemName,
            details: isPermanent ? '(Item Permanente)' : '(Consumível)',
            highlight: false
        });
    }

    setItemToUse(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => prev ? ({ ...prev, imageUrl: reader.result as string }) : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // --- Resource Logic ---

  const updateResourceValue = (charId: string, resourceId: string, delta: number) => {
    play('CLICK');
    setCharacters(prev => prev.map(char => {
      if (char.id !== charId) return char;

      const newResources = (char.resources || []).map(res => {
        if (res.id === resourceId) {
          const newValue = Math.max(0, Math.min(res.max, res.current + delta));
          return { ...res, current: newValue };
        }
        return res;
      });

      return { ...char, resources: newResources };
    }));
  };

  // --- Inventory Logic (Detail View) ---

  const updateInventoryItem = (charId: string, itemId: string, updates: Partial<InventoryItem>) => {
    play('CLICK');
    setCharacters(prev => prev.map(char => {
      if (char.id !== charId) return char;
      
      const newInventory = char.inventory.map(item => {
        // Migration check just in case
        if (typeof item === 'string') return item;
        
        if (item.id === itemId) {
           return { ...item, ...updates };
        }
        return item;
      }) as InventoryItem[];

      return { ...char, inventory: newInventory };
    }));
  };

  const deleteInventoryItem = (charId: string, itemId: string) => {
    play('CLICK');
    setCharacters(prev => prev.map(char => {
      if (char.id !== charId) return char;
      return { 
        ...char, 
        inventory: char.inventory.filter((item: any) => 
          typeof item === 'string' ? true : item.id !== itemId
        ) 
      };
    }));
  };

  // --- Renderers ---

  const renderPreRollModal = () => {
    if (!pendingRoll) return null;
    const { attr } = pendingRoll;
    const isNone = attr.rollType === 'NONE';

    return (
      <div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={() => { play('CLICK'); setPendingRoll(null); }}
      >
        <div 
          className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <button 
            type="button"
            onClick={() => { play('CLICK'); setPendingRoll(null); }}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-100"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
               <Shield size={24} className="text-amber-500" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-slate-100 leading-none">{pendingRoll.charName}</h3>
               <p className="text-sm text-slate-400 mt-1 uppercase font-bold tracking-wider">
                 {attr.name} {!isNone && `• ${attr.value}`}
               </p>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="space-y-6">
            
            {/* Advantage/Disadvantage */}
            <div className="grid grid-cols-3 gap-2">
               <button
                 onClick={() => { play('CLICK'); setRollConfig(prev => ({ ...prev, mode: 'DISADVANTAGE' })); }}
                 className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                   rollConfig.mode === 'DISADVANTAGE' 
                   ? 'bg-red-900/30 border-red-500 text-red-100' 
                   : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                 }`}
               >
                 <TrendingDown size={20} className="mb-1" />
                 <span className="text-[10px] uppercase font-bold">Desvant.</span>
               </button>

               <button
                 onClick={() => { play('CLICK'); setRollConfig(prev => ({ ...prev, mode: 'NORMAL' })); }}
                 className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                   rollConfig.mode === 'NORMAL' 
                   ? 'bg-slate-700 border-slate-500 text-slate-100' 
                   : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                 }`}
               >
                 <Shield size={20} className="mb-1" />
                 <span className="text-[10px] uppercase font-bold">Normal</span>
               </button>

               <button
                 onClick={() => { play('CLICK'); setRollConfig(prev => ({ ...prev, mode: 'ADVANTAGE' })); }}
                 className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                   rollConfig.mode === 'ADVANTAGE' 
                   ? 'bg-green-900/30 border-green-500 text-green-100' 
                   : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
                 }`}
               >
                 <TrendingUp size={20} className="mb-1" />
                 <span className="text-[10px] uppercase font-bold">Vantagem</span>
               </button>
            </div>

            {/* Target Modifier - Only show if not NONE */}
            {!isNone && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                       <Target size={14} /> Modificar Alvo
                     </span>
                     <span className="text-xs font-mono text-slate-500">
                       Alvo Final: <span className="text-slate-100 font-bold text-sm">{attr.value + rollConfig.modifier}</span>
                     </span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={() => { play('CLICK'); setRollConfig(prev => ({ ...prev, modifier: prev.modifier - 1 })); }}
                       className="w-12 h-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 active:scale-95 transition-all"
                     >
                       <Minus size={20} />
                     </button>
                     
                     <div className="flex-1 text-center font-mono text-2xl font-black text-slate-100 bg-slate-900 rounded-lg py-2 border border-slate-700">
                       {rollConfig.modifier > 0 ? '+' : ''}{rollConfig.modifier}
                     </div>

                     <button 
                       onClick={() => { play('CLICK'); setRollConfig(prev => ({ ...prev, modifier: prev.modifier + 1 })); }}
                       className="w-12 h-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-600 active:scale-95 transition-all"
                     >
                       <Plus size={20} />
                     </button>
                   </div>
                </div>
            )}

            <button
              onClick={executeRoll}
              className="w-full bg-amber-600 hover:bg-amber-500 text-on-primary font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-amber-900/20 active:translate-y-1 transition-all"
            >
              Rolar {attr.dice || 'd20'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRollResultModal = () => {
    if (!rollResult) return null;

    const isNone = rollResult.rollType === 'NONE';

    // Animation Classes
    const containerBase = "w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl relative transition-all duration-300";
    
    let borderClass = "";
    if (isNone) {
        borderClass = "border-blue-500 shadow-blue-900/20";
    } else {
        borderClass = rollResult.isSuccess ? 'border-green-500 shadow-green-900/20' : 'border-red-500 shadow-red-900/20';
    }

    const containerState = isRevealing 
      ? "bg-slate-800 border-2 border-slate-600 scale-100" 
      : `bg-slate-900 border-2 ${borderClass} scale-105`;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={() => { if (!isRevealing) { play('CLICK'); setRollResult(null); } }}
      >
        <div 
          className={`${containerBase} ${containerState}`}
          onClick={e => e.stopPropagation()}
        >
          {!isRevealing && (
             <button 
               type="button"
               onClick={() => { play('CLICK'); setRollResult(null); }}
               className="absolute top-3 right-3 text-slate-500 hover:text-slate-100 bg-slate-800 rounded-full p-1 animate-in fade-in"
             >
               <X size={16} />
             </button>
          )}

          <h3 className="text-slate-400 uppercase text-[10px] font-bold tracking-widest mb-4">
            {rollResult.charName} • {rollResult.attrName}
          </h3>
          
          <div className="flex items-center justify-center gap-3 mb-6">
             <div className="flex flex-col items-center relative">
                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">Resultado</span>
                
                {isRevealing ? (
                  <div className="h-16 flex items-center justify-center">
                    <Dices className="text-slate-600 animate-spin" size={40} />
                  </div>
                ) : (
                  <div className="animate-in zoom-in spin-in-180 duration-500">
                    <span className={`text-6xl font-black ${!isNone && rollResult.isSuccess ? 'text-slate-100' : (isNone ? 'text-blue-200' : 'text-slate-200')}`}>
                      {rollResult.roll}
                    </span>
                  </div>
                )}
                
                <span className="text-[10px] text-slate-500 font-mono mt-1 min-h-[15px]">
                   {!isRevealing && rollResult.diceNotation}
                </span>
             </div>
             
             {!isNone && (
                 <>
                     <div className="h-12 w-px bg-slate-700 mx-2"></div>

                     <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-500 mb-1">Alvo</span>
                        <span className="text-3xl font-bold text-slate-400 font-mono">
                          {rollResult.target}
                        </span>
                     </div>
                 </>
             )}
          </div>

          <div className="h-8 flex items-center justify-center">
            {isRevealing ? (
               <span className="text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse">Rolando...</span>
            ) : (
               !isNone && (
                   <div className={`text-2xl font-black uppercase tracking-tight animate-in slide-in-from-bottom-2 duration-300 ${rollResult.isSuccess ? 'text-green-500' : 'text-red-500'}`}>
                     {rollResult.isSuccess ? 'SUCESSO!' : 'FALHA!'}
                   </div>
               )
            )}
          </div>
          
          {!isRevealing && !isNone && (
            <div className="mt-4 inline-block bg-slate-800 px-3 py-1 rounded-full border border-slate-700 animate-in fade-in delay-100">
               <span className="text-[10px] text-slate-400 uppercase font-bold">
                 {rollResult.rollType === 'UNDER' ? 'Roll Under (Menor)' : 'Roll Over (Maior)'}
               </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderItemRollResultModal = () => {
    if (!itemRollResult) return null;

    // Animation Classes matching Attribute Modal
    const containerBase = "w-full max-w-xs rounded-2xl p-6 text-center shadow-2xl relative transition-all duration-300";
    const borderClass = "border-blue-500 shadow-blue-900/20"; // Items are always Blue/Neutral

    const containerState = isItemRevealing 
      ? "bg-slate-800 border-2 border-slate-600 scale-100" 
      : `bg-slate-900 border-2 ${borderClass} scale-105`;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={() => { if (!isItemRevealing) { play('CLICK'); setItemRollResult(null); } }}
      >
        <div 
          className={`${containerBase} ${containerState}`}
          onClick={e => e.stopPropagation()}
        >
          {!isItemRevealing && (
            <button 
              type="button"
              onClick={() => { play('CLICK'); setItemRollResult(null); }}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-100 bg-slate-800 rounded-full p-1 animate-in fade-in"
            >
              <X size={16} />
            </button>
          )}

          <h3 className="text-slate-400 uppercase text-[10px] font-bold tracking-widest mb-4 flex items-center justify-center gap-2">
            <Backpack size={12} /> {itemRollResult.itemName}
          </h3>
          
          <div className="flex flex-col items-center relative mb-4">
            <span className="text-[10px] uppercase font-bold text-slate-500 mb-2">Resultado</span>
            
            {isItemRevealing ? (
              <div className="h-16 flex items-center justify-center">
                <Dices className="text-slate-600 animate-spin" size={40} />
              </div>
            ) : (
              <div className="animate-in zoom-in spin-in-180 duration-500">
                <span className="text-6xl font-black text-blue-400 drop-shadow-lg">
                  {itemRollResult.roll}
                </span>
              </div>
            )}
            
            <span className="text-xs text-slate-500 font-mono mt-2 bg-slate-800 px-2 py-1 rounded border border-slate-700 min-h-[24px] flex items-center">
               {!isItemRevealing && itemRollResult.diceNotation}
            </span>
          </div>

           <div className="mt-2 text-xs text-slate-400 font-mono min-h-[16px] flex items-center justify-center">
              {isItemRevealing ? (
                <span className="text-slate-500 font-bold uppercase tracking-widest text-sm animate-pulse">Rolando...</span>
              ) : (
                itemRollResult.detailText
              )}
           </div>
        </div>
      </div>
    );
  };

  const renderUseItemModal = () => {
    if (!itemToUse) return null;

    const itemName = typeof itemToUse.item === 'string' ? itemToUse.item : itemToUse.item.name;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={() => { play('CLICK'); setItemToUse(null); }}
      >
        <div 
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <button 
            type="button"
            onClick={() => { play('CLICK'); setItemToUse(null); }}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
          >
            <X size={20} />
          </button>
          
          <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
            <Backpack size={20} className="text-amber-500" />
            Usar Item
          </h3>
          
          <p className="text-slate-300 mb-6 text-sm leading-relaxed">
            Deseja usar o item <span className="text-slate-100 font-bold">"{itemName}"</span>?
            <br />
            <span className="text-xs text-slate-500 mt-1 block">Isso registrará a ação no log.</span>
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => { play('CLICK'); setItemToUse(null); }}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmUseItem}
              className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-on-primary rounded-lg font-bold text-sm transition-colors shadow-lg shadow-amber-900/20"
            >
              Sim, usar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteConfirmModal = () => {
    if (!charToDelete) return null;
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={() => { play('CLICK'); setCharToDelete(null); }}
      >
        <div 
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <button 
            type="button"
            onClick={() => { play('CLICK'); setCharToDelete(null); }}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
          >
            <X size={20} />
          </button>
          
          <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
            <Trash2 size={20} className="text-red-500" />
            Excluir Personagem
          </h3>
          
          <p className="text-slate-300 mb-6 text-sm leading-relaxed">
            Tem certeza que deseja excluir permanentemente <strong>{charToDelete.name}</strong>?
            <br/>
            <span className="text-xs text-slate-500 mt-1 block">Esta ação não pode ser desfeita.</span>
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => { play('CLICK'); setCharToDelete(null); }}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { play('CLICK'); confirmDelete(); }}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-slate-100 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-red-900/20"
            >
              Sim, excluir
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div className="h-full overflow-y-auto bg-slate-900">
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-24 max-w-7xl mx-auto">
        {characters.map(char => (
          <div 
            key={char.id}
            onClick={() => { play('CLICK'); setSelectedCharId(char.id); setMode('DETAIL'); }}
            className="aspect-[3/4] rounded-xl bg-slate-800 border border-slate-700 overflow-hidden relative shadow-lg hover:shadow-amber-900/10 hover:border-amber-500/50 transition-all active:scale-95 cursor-pointer flex flex-col"
          >
            <div className="flex-1 bg-slate-900 relative min-h-0">
               {char.imageUrl ? (
                 <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover object-top" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-700">
                   <User size={48} />
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
            </div>
            <div className="p-3 bg-slate-800 border-t border-slate-700/50">
              <h3 className="font-bold text-slate-100 leading-tight truncate">{char.name}</h3>
              <p className="text-xs text-amber-500 truncate">{char.profession}</p>
            </div>
          </div>
        ))}

        <button 
          type="button"
          onClick={() => { play('CLICK'); handleCreateNew(); }}
          className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-500 bg-slate-800/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-amber-500 transition-all active:scale-95 group"
        >
          <div className="bg-slate-800 p-3 rounded-full group-hover:bg-amber-500/10 transition-colors">
            <Plus size={32} />
          </div>
          <span className="font-bold uppercase text-xs tracking-wider">Novo Personagem</span>
        </button>
      </div>
    </div>
  );

  const renderDetail = () => {
    const char = characters.find(c => c.id === selectedCharId);
    if (!char) return null;

    return (
      <div className="h-full bg-slate-900 relative flex flex-col landscape:flex-row overflow-y-auto landscape:overflow-hidden">
        
        {/* LEFT COLUMN: Identity & Resources */}
        {/* Landscape: Fixed sidebar. Portrait: Part of the main scroll flow */}
        <div className="w-full landscape:w-[45%] landscape:h-full landscape:overflow-y-auto landscape:border-r border-slate-800 bg-slate-900 flex-none">
          
          {/* Header Image With Info */}
          <div className="relative w-full flex-none bg-slate-950 h-64 landscape:h-40">
            {char.imageUrl ? (
              <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover object-top opacity-60" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-800 bg-slate-900">
                <User size={50} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
            
            {/* Top Buttons */}
            <button 
              type="button"
              onClick={() => {
                setMode('LIST');
                play('CLICK');
              }}
              className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-black/60 z-10"
            >
              <ChevronLeft size={24} />
            </button>
            
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button 
                type="button"
                onClick={() => {
                  handleDelete(char.id);
                  play('CLICK');
                }}
                className="p-2 bg-red-900/40 backdrop-blur-md rounded-full text-red-200 hover:bg-red-900/60"
              >
                <Trash2 size={20} />
              </button>
              <button 
                type="button"
                onClick={() => {
                  handleEdit(char);
                  play('CLICK');
                }}
                className="p-2 bg-amber-900/40 backdrop-blur-md rounded-full text-amber-200 hover:bg-amber-900/60"
              >
                <Edit2 size={20} />
              </button>
            </div>

            {/* Text Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-slate-900 to-transparent">
              <h2 className="text-3xl font-black text-slate-100 drop-shadow-md leading-none mb-1 line-clamp-2">{char.name}</h2>
              <p className="text-amber-500 font-bold uppercase tracking-wider text-xs shadow-black drop-shadow-sm">{char.profession}</p>
              {char.description && (
                 <p className="text-slate-300 text-sm italic mt-2 leading-snug drop-shadow-sm line-clamp-3">
                   "{char.description}"
                 </p>
              )}
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Resources Block */}
            <div>
              <h3 className="flex items-center gap-2 text-slate-400 uppercase font-bold text-xs tracking-wider mb-3">
                <Activity size={14} /> Recursos
              </h3>
              <div className={`grid gap-2 ${(char.resources?.length || 0) > 0 && (char.resources?.length || 0) % 4 === 0 ? "grid-cols-4" : "grid-cols-3"}`}>
                {(!char.resources || char.resources.length === 0) ? (
                  <div className="col-span-full">
                    <p className="text-slate-600 text-sm italic">Sem recursos.</p>
                  </div>
                ) : (
                  char.resources.map(res => (
                    <div key={res.id} className="flex flex-col items-center justify-between p-2 rounded-lg border border-slate-700 bg-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mb-2 w-full truncate text-center" title={res.name}>
                        {res.name}
                      </span>
                      
                      <div className="flex items-center justify-between w-full bg-slate-900 rounded p-1">
                        <button 
                          onClick={() => updateResourceValue(char.id, res.id, -1)}
                          className="text-slate-400 hover:text-slate-100 p-1 hover:bg-slate-700 rounded transition-colors active:scale-90"
                        >
                          <Minus size={14} />
                        </button>
                        
                        <div className="flex flex-col items-center leading-none">
                           <span className="text-lg font-black text-slate-100">{res.current}</span>
                           <div className="w-full h-px bg-slate-700 my-0.5"></div>
                           <span className="text-[9px] text-slate-500 font-mono">{res.max}</span>
                        </div>

                        <button 
                          onClick={() => updateResourceValue(char.id, res.id, 1)}
                          className="text-slate-400 hover:text-slate-100 p-1 hover:bg-slate-700 rounded transition-colors active:scale-90"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Stats & Inventory */}
        {/* Landscape: Independent scroll. Portrait: Part of the main scroll flow */}
        <div className="w-full landscape:flex-1 landscape:h-full landscape:overflow-y-auto bg-slate-900 flex-none">
          <div className="p-4 space-y-6 pb-24">
             {/* Attributes Block */}
             <div>
                <h3 className="flex items-center gap-2 text-slate-400 uppercase font-bold text-xs tracking-wider mb-3">
                  <Shield size={14} /> Atributos
                </h3>
                <div className={`grid gap-2 ${char.attributes.length > 0 && char.attributes.length % 4 === 0 ? "grid-cols-4" : "grid-cols-3"}`}>
                  {char.attributes.length === 0 ? (
                    <div className="col-span-3">
                      <p className="text-slate-600 text-sm italic">Sem atributos definidos.</p>
                    </div>
                  ) : (
                    char.attributes.map(attr => (
                      <button
                        type="button"
                        key={attr.id}
                        onClick={() => initiateAttributeRoll(char.name, attr)}
                        className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-700 bg-slate-800 hover:border-amber-500 hover:bg-slate-700 active:scale-[0.98]"
                      >
                        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 w-full truncate text-center" title={attr.name}>{attr.name}</span>
                        
                        <div className="flex items-center justify-center bg-slate-900/50 rounded px-2 w-full mb-1">
                            <span className="text-2xl font-black text-amber-500 font-mono">
                                {attr.value}
                            </span>
                        </div>

                        <div className="flex flex-col items-center">
                             <span className="text-[9px] text-slate-600 font-mono">{attr.dice || 'd20'}</span>
                             {attr.rollType !== 'NONE' && (
                                 <span className="text-[8px] text-slate-500 uppercase font-bold">
                                    {attr.rollType === 'UNDER' ? 'Menor' : 'Maior'}
                                 </span>
                             )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
             </div>

             {/* Inventory Block */}
             <div>
                <h3 className="flex items-center gap-2 text-slate-400 uppercase font-bold text-xs tracking-wider mb-3">
                  <Backpack size={14} /> Inventário ({char.inventory.length})
                </h3>
                <div className="space-y-2">
                  {char.inventory.length === 0 ? (
                    <p className="text-slate-600 text-sm italic col-span-full">Mochila vazia.</p>
                  ) : (
                    char.inventory.map((item: InventoryItem | string, idx) => {
                      const displayName = typeof item === 'string' ? item : item.name;
                      const displayId = typeof item === 'string' ? `idx-${idx}` : item.id;
                      const isPerm = typeof item === 'string' ? false : item.isPermanent;
                      const diceNotation = typeof item === 'string' ? undefined : item.dice;
                      const quantity = typeof item === 'string' ? 1 : item.quantity;

                      if (typeof item === 'string') {
                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleUseItem(char.name, item)}
                            className="flex items-center gap-2 text-slate-300 text-sm p-3 bg-slate-800/30 rounded border border-slate-800 cursor-pointer hover:bg-slate-800 hover:border-slate-700 transition-colors active:scale-[0.98]"
                          >
                            <span className="text-amber-500">•</span> {item} (Antigo)
                          </div>
                        );
                      }

                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                          <div 
                            onClick={() => handleUseItem(char.name, item)}
                            className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer group active:opacity-80 transition-opacity"
                          >
                            {isPerm ? (
                              <Shield size={16} className="text-blue-400 flex-none group-hover:text-blue-300 transition-colors" />
                            ) : (
                              <div className="w-4 flex-none" />
                            )}
                            <span className={`text-sm font-bold truncate transition-colors ${item.isPermanent ? 'text-blue-100 group-hover:text-slate-100' : 'text-slate-200 group-hover:text-amber-500'}`}>
                              {item.name}
                            </span>
                            {diceNotation && (
                               <span className="text-[10px] bg-slate-900 border border-slate-600 text-slate-400 px-1.5 py-0.5 rounded font-mono group-hover:border-amber-500/50 group-hover:text-amber-500">
                                 {diceNotation}
                               </span>
                            )}
                          </div>
                          
                          {item.isPermanent ? (
                            <button 
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteInventoryItem(char.id, item.id); }} 
                              className="p-2 text-slate-500 hover:text-red-400 bg-slate-900 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-slate-900 rounded p-1">
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateInventoryItem(char.id, item.id, { quantity: Math.max(0, item.quantity - 1) }); }}
                                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              
                              {editingQtyId === item.id ? (
                                <input
                                  autoFocus
                                  type="number"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  className="w-12 bg-slate-700 text-slate-100 text-center font-bold text-sm rounded py-1 outline-none border border-amber-500"
                                  defaultValue={item.quantity}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) updateInventoryItem(char.id, item.id, { quantity: val });
                                    setEditingQtyId(null);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    }
                                  }}
                                />
                              ) : (
                                <span 
                                  onClick={(e) => { e.stopPropagation(); setEditingQtyId(item.id); }}
                                  className="w-8 text-center text-amber-500 font-black font-mono text-lg cursor-text"
                                >
                                  {item.quantity}
                                </span>
                              )}

                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateInventoryItem(char.id, item.id, { quantity: item.quantity + 1 }); }}
                                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                              
                              <div className="w-px h-6 bg-slate-700 mx-1"></div>
                              
                              <button 
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteInventoryItem(char.id, item.id); }} 
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
             </div>
          </div>
        </div>

      </div>
    );
  };

  const renderForm = () => {
    if (!formData) return null;

    const addAttribute = () => {
      setFormData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          attributes: [
            ...prev.attributes,
            { id: generateUUID(), name: 'Novo Atributo', value: 10, rollType: 'UNDER', dice: '' }
          ]
        };
      });
    };

    const removeAttribute = (id: string) => {
        setFormData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                attributes: prev.attributes.filter(a => a.id !== id)
            };
        });
    };

    const updateAttribute = (id: string, field: keyof Attribute, val: any) => {
        // Clear error if user is typing in dice field
        if (field === 'dice' && val.trim() !== '') {
            setValidationErrors(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }

        setFormData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                attributes: prev.attributes.map(a => a.id === id ? { ...a, [field]: val } : a)
            };
        });
    };
    
    const addResource = () => {
      setFormData(prev => {
        if (!prev) return null;
        return {
          ...prev,
          resources: [
            ...prev.resources,
            { id: generateUUID(), name: 'Novo Recurso', current: 10, max: 10 }
          ]
        };
      });
    };

    const removeResource = (id: string) => {
        setFormData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                resources: prev.resources.filter(r => r.id !== id)
            };
        });
    };

    const updateResource = (id: string, field: keyof Resource, val: any) => {
        setFormData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                resources: prev.resources.map(r => r.id === id ? { ...r, [field]: val } : r)
            };
        });
    };

    const addNewItem = () => {
        if (!newItemName.trim()) return;
        
        setFormData(prev => {
            if (!prev) return null;
            const newItem: InventoryItem = {
                id: generateUUID(),
                name: newItemName,
                quantity: 1,
                isPermanent: newItemIsPermanent,
                dice: newItemDice
            };
            return {
                ...prev,
                inventory: [...prev.inventory, newItem]
            };
        });
        
        setNewItemName('');
        setNewItemDice('');
        setNewItemIsPermanent(false);
    };
    
    const removeItem = (id: string) => {
        setFormData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                inventory: prev.inventory.filter((item: any) => typeof item === 'string' ? true : item.id !== id)
            };
        });
    };

    return (
      <div className="flex flex-col h-full bg-slate-900 relative">
        {/* Persistent Form Header */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-center pointer-events-none">
            <button 
              type="button"
              onClick={(e) => { play('CLICK'); e.stopPropagation(); setMode('LIST'); }}
              className="p-2 bg-black/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-black/60 shadow-lg pointer-events-auto transition-all active:scale-95"
            >
              <X size={24} />
            </button>
            
            <button 
              type="button"
              onClick={(e) => { play('CLICK'); e.preventDefault(); e.stopPropagation(); handleSave(); }}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-on-primary font-bold rounded-full shadow-lg pointer-events-auto flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckSquare size={18} /> Salvar
            </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-24 w-full">
          <div className="max-w-3xl mx-auto w-full min-h-full">
            {/* Header / Image Upload */}
            <div className="relative h-48 w-full flex-none bg-slate-950 group cursor-pointer" onClick={() => { play('CLICK'); triggerFileUpload(); }}>
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-40 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-800 bg-slate-900 group-hover:bg-slate-800 transition-colors">
                  <ImageIcon size={64} />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-slate-900/90 border border-slate-600 text-slate-100 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
                  <Upload size={16} /> Alterar Imagem
                </span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
            </div>

            <div className="p-4 space-y-6">
            {/* Basic Info */}
            <div>
               <h3 className="flex items-center gap-2 text-slate-400 uppercase font-bold text-xs tracking-wider mb-3">
                  <FileText size={14} /> Dados Básicos
               </h3>
               <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                 <div>
                   <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Nome do Personagem</label>
                   <input 
                     type="text" 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 font-bold text-lg focus:border-amber-500 outline-none"
                     placeholder="Ex: Gandalf, o Cinzento"
                   />
                 </div>
                 
                 <div>
                   <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Arquétipo / Profissão</label>
                   <input 
                     type="text" 
                     value={formData.profession}
                     onChange={e => setFormData({...formData, profession: e.target.value})}
                     className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 focus:border-amber-500 outline-none"
                     placeholder="Ex: Mago, Guerreiro, Detetive..."
                   />
                 </div>

                 <div>
                   <label className="text-xs uppercase font-bold text-slate-500 mb-1 block">Descrição / Notas</label>
                   <textarea 
                     value={formData.description}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 text-sm focus:border-amber-500 outline-none min-h-[80px]"
                     placeholder="Detalhes sobre o personagem..."
                   />
                 </div>
               </div>
            </div>

            {/* Resources Management */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Activity size={16} /> Recursos
                </h3>
                <button 
                  type="button" 
                  onClick={() => { play('CLICK'); addResource(); }}
                  className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
                >
                  <Plus size={12} /> Adicionar
                </button>
              </div>

              <div className="space-y-3">
                {formData.resources.map((res, idx) => (
                    <div key={res.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                        <div className="flex justify-between gap-2">
                          <input 
                            type="text" 
                            value={res.name}
                            onChange={(e) => updateResource(res.id, 'name', e.target.value)}
                            className="flex-1 bg-transparent border-b border-slate-700 text-slate-100 font-bold outline-none focus:border-amber-500 pb-1"
                            placeholder="Nome do Recurso"
                          />
                          <button onClick={() => { play('CLICK'); removeResource(res.id); }} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Atual</label>
                              <input 
                                type="number" 
                                value={res.current}
                                onChange={(e) => updateResource(res.id, 'current', parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-900 rounded p-2 text-slate-100 font-mono text-center outline-none border border-slate-700 focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Máximo</label>
                              <input 
                                type="number" 
                                value={res.max}
                                onChange={(e) => {
                                  const newMax = parseInt(e.target.value) || 0;
                                  setFormData(prev => {
                                    if (!prev) return null;
                                    return {
                                      ...prev,
                                      resources: prev.resources.map(r => {
                                        if (r.id === res.id) {
                                          return { 
                                            ...r, 
                                            max: newMax, 
                                            // Enforce logical constraint: Current cannot be > Max
                                            current: r.current > newMax ? newMax : r.current 
                                          };
                                        }
                                        return r;
                                      })
                                    };
                                  });
                                }}
                                className="w-full bg-slate-900 rounded p-2 text-slate-100 font-mono text-center outline-none border border-slate-700 focus:border-amber-500"
                              />
                            </div>
                        </div>
                    </div>
                ))}
                {formData.resources.length === 0 && <p className="text-xs text-slate-600 italic text-center">Nenhum recurso adicionado.</p>}
              </div>
            </div>

            {/* Attributes Management */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Shield size={16} /> Atributos
                </h3>
                <button 
                  type="button" 
                  onClick={() => { play('CLICK'); addAttribute(); }}
                  className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded"
                >
                  <Plus size={12} /> Adicionar
                </button>
              </div>

              <div className="space-y-3">
                {formData.attributes.map((attr) => {
                  const isDiceEmpty = !attr.dice || attr.dice.trim() === '';
                  return (
                    <div key={attr.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                        <div className="flex justify-between gap-2">
                          <input 
                            type="text" 
                            value={attr.name}
                            onChange={(e) => updateAttribute(attr.id, 'name', e.target.value)}
                            className="flex-1 bg-transparent border-b border-slate-700 text-slate-100 font-bold outline-none focus:border-amber-500 pb-1"
                            placeholder="Nome do Atributo"
                          />
                          <button onClick={() => { play('CLICK'); removeAttribute(attr.id); }} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Valor</label>
                            <input 
                              type="number" 
                              value={attr.value}
                              onChange={(e) => updateAttribute(attr.id, 'value', parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-900 rounded p-2 text-slate-100 font-mono text-center outline-none border border-slate-700 focus:border-amber-500 h-10"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Tipo de Teste</label>
                            <select 
                              value={attr.rollType}
                              onChange={(e) => updateAttribute(attr.id, 'rollType', e.target.value)}
                              className="w-full bg-slate-900 rounded px-2 text-slate-100 text-xs outline-none border border-slate-700 focus:border-amber-500 appearance-none h-10"
                            >
                                <option value="UNDER">≤ (Rolar Abaixo)</option>
                                <option value="OVER">≥ (Rolar Acima)</option>
                                <option value="NONE">Apenas Rolar</option>
                            </select>
                          </div>
                          <div>
                            <label className={`text-[9px] uppercase font-bold block mb-1 ${isDiceEmpty ? 'text-red-400' : 'text-slate-500'} ${validationErrors.has(attr.id) ? 'animate-pulse' : ''}`}>
                                Dado {isDiceEmpty && '*'}
                            </label>
                            <input 
                              type="text" 
                              value={attr.dice || ''}
                              onChange={(e) => updateAttribute(attr.id, 'dice', e.target.value)}
                              className={`w-full bg-slate-900 rounded p-2 text-slate-100 font-mono text-center text-xs outline-none border ${isDiceEmpty ? 'border-red-500/60 focus:border-red-500' : 'border-slate-700 focus:border-amber-500'} h-10 placeholder-slate-600`}
                              placeholder="Ex: 1d20"
                            />
                          </div>
                        </div>
                    </div>
                  );
                })}
                {formData.attributes.length === 0 && <p className="text-xs text-slate-600 italic text-center">Nenhum atributo adicionado.</p>}
              </div>
            </div>

            {/* Inventory Management */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Backpack size={16} /> Inventário
                </h3>
              </div>

              {/* Add New Item Form */}
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 mb-4">
                  <div className="flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-100 outline-none focus:border-amber-500 placeholder-slate-600"
                      placeholder="Nome do Item (Ex: Corda, Espada...)"
                    />
                    <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newItemDice}
                          onChange={(e) => setNewItemDice(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-100 outline-none focus:border-amber-500 placeholder-slate-600 font-mono"
                          placeholder="Dano/Efeito (Ex: 1d8)"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setNewItemIsPermanent(!newItemIsPermanent);
                            play('CLICK');
                          }}
                          className={`px-3 rounded border transition-colors flex items-center justify-center ${newItemIsPermanent ? 'bg-blue-900/50 border-blue-500 text-blue-200' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                          title="Item Permanente?"
                        >
                          <Shield size={16} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            addNewItem();
                            play('CLICK');
                          }}
                          disabled={!newItemName.trim()}
                          className="px-4 bg-amber-600 hover:bg-amber-500 text-on-primary rounded font-bold uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
<Plus size={16} />
                        </button>
                    </div>
                  </div>
              </div>

              <div className="space-y-2">
                {formData.inventory.map((item, idx) => {
                  // Safe rendering for migrated items or new structure
                  const isString = typeof item === 'string';
                  const id = isString ? `str-${idx}` : item.id;
                  const name = isString ? item : item.name;
                  const quantity = isString ? 1 : item.quantity;
                  const isPerm = isString ? false : item.isPermanent;
                  const dice = isString ? undefined : item.dice;

                  return (
                    <div key={id} className="flex items-center justify-between p-2 bg-slate-800 rounded border border-slate-700 group">
                        <div className="flex items-center gap-2 overflow-hidden">
                          {isPerm ? <Shield size={14} className="text-blue-400 flex-none" /> : <div className="w-3.5" />}
                          <span className="text-sm font-bold text-slate-200 truncate">{name}</span>
                          {quantity > 1 && <span className="text-xs text-amber-500 font-mono">x{quantity}</span>}
                          {dice && <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-1 rounded">{dice}</span>}
                        </div>
                        <button 
                          type="button"
                          onClick={() => { play('CLICK'); removeItem(isString ? name : item.id); }} // For string items we might have issues removing exact one if duplicates exist, but minimal impact for now
                          className="text-slate-600 hover:text-red-500 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                    </div>
                  );
                })}
                {formData.inventory.length === 0 && <p className="text-xs text-slate-600 italic text-center">Inventário vazio.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="h-full bg-slate-900 relative">
      {mode === 'LIST' && renderList()}
      {mode === 'DETAIL' && renderDetail()}
      {mode === 'FORM' && renderForm()}
      {renderRollResultModal()}
      {renderItemRollResultModal()}
      {renderPreRollModal()}
      {renderUseItemModal()}
      {renderDeleteConfirmModal()}
    </div>
  );
};

export default PersonaView;
