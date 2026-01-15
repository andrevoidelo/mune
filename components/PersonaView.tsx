
import React, { useState, useRef, useEffect } from 'react';
import { Character, Attribute, AttributeType, LogEntry, InventoryItem, Resource } from '../types';
import { generateUUID, rollDiceNotation, getContrastColor } from '../utils';
import { CARD_THEMES } from '../constants';
import { User, Plus, Trash2, Edit2, X, ChevronLeft, Shield, Backpack, Image as ImageIcon, Upload, Minus, CheckSquare, Square, Dices, Activity, Zap, TrendingUp, TrendingDown, Target, Sword, FileText, PaintBucket, List, LayoutGrid, Sticker } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { ColorPicker } from './ColorPicker';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import InventoryGridItem from './InventoryGridItem';
import IconPicker from './IconPicker';

const PREVIEW_COLORS: Record<string, string> = {
  slate:  '#64748b', 
  red:    '#ef4444',
  blue:   '#3b82f6',
  amber:  '#f97316', // Orange-500
  green:  '#10b981',
  purple: '#a855f7',
  yellow: '#eab308',
  cyan:   '#06b6d4',
  pink:   '#ec4899',
};

interface PersonaViewProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  addLog: (entry: LogEntry) => void;
}

// Helper to resolve styles for themes vs custom hex
const getCardStyle = (color?: string) => {
  // If no color is provided or 'slate' is selected, use theme semantic variables
  if (!color || color === 'slate') {
    return { 
      className: 'border-border border shadow-sm transition-colors',
      style: {
        backgroundColor: 'rgb(var(--card-bg))',
        color: 'rgb(var(--text-main))'
      }
    };
  }
  
  // If it's a preset theme
  if (CARD_THEMES[color]) {
    return { className: CARD_THEMES[color] };
  }
  
  // If it's a custom hex
  if (color.startsWith('#')) {
    const textColor = getContrastColor(color);
    return {
      className: 'transition-colors border shadow-sm',
      style: {
        backgroundColor: color,
        borderColor: color, // Solid border matching bg
        color: textColor
      } as React.CSSProperties
    };
  }
  
  return { 
    className: 'border-border border shadow-sm transition-colors',
    style: {
      backgroundColor: 'rgb(var(--card-bg))',
      color: 'rgb(var(--text-main))'
    }
  };
};

// Helper for text elements inside custom cards
const getTextStyle = (color?: string) => {
  if (!color || color === 'slate') return 'text-txt-muted';
  if (CARD_THEMES[color]) return 'text-white/90';
  
  // For custom hex, we rely on the container's inline style 'color', 
  // but we return 'opacity-90' to mimic the hierarchy if needed, 
  // or just empty string to let inheritance work.
  return 'opacity-90'; 
};

const getLabelStyle = (color?: string) => {
    if (!color || color === 'slate') return 'text-txt-dim font-bold';
    if (CARD_THEMES[color]) return 'text-white/70';
    return 'opacity-70 font-bold'; 
};

const getInputStyle = (color?: string) => {
  if (!color || color === 'slate') {
    return 'border-border text-txt-main placeholder-txt-dim focus:border-primary';
  }
  if (CARD_THEMES[color]) {
    return 'border-white/30 text-white placeholder-white/50 focus:border-white';
  }
  // Custom Hex
  const textColor = getContrastColor(color);
  const isDark = textColor === '#ffffff';
  return `border-current bg-transparent ${isDark ? 'placeholder-white/50' : 'placeholder-black/50'} focus:brightness-110`;
};

const getButtonStyle = (color?: string) => {
    if (!color || color === 'slate') {
        return 'text-txt-muted hover:text-txt-main hover:bg-card-hover';
    }
    if (CARD_THEMES[color]) {
        return 'text-white/70 hover:text-white hover:bg-white/10';
    }
    return 'opacity-70 hover:opacity-100 hover:bg-black/10';
};

type ViewMode = 'LIST' | 'DETAIL' | 'FORM';
type RollMode = 'NORMAL' | 'ADVANTAGE' | 'DISADVANTAGE';
type InventoryViewMode = 'LIST' | 'GRID';

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
  charId: string;
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
  const [colorPickerTargetId, setColorPickerTargetId] = useState<string | null>(null); // ID of resource/attribute being colored
  const [itemToUse, setItemToUse] = useState<ItemToUse | null>(null);
  const [charToDelete, setCharToDelete] = useState<Character | null>(null);
  
  // State for adding new item in Form Mode
  const [newItemName, setNewItemName] = useState('');
  const [newItemDice, setNewItemDice] = useState('');
  const [newItemIsPermanent, setNewItemIsPermanent] = useState(false);
  const [newItemIcon, setNewItemIcon] = useState<string>('');
  const [newItemIconColor, setNewItemIconColor] = useState<string>('');
  const [showNewItemIconPicker, setShowNewItemIconPicker] = useState(false);

  // Auto-reduce quantity setting (persisted in localStorage)
  const [autoReduceOnUse, setAutoReduceOnUse] = useState<boolean>(() => {
    const saved = localStorage.getItem('mune_auto_reduce_on_use');
    return saved !== null ? saved === 'true' : true;
  });

  // Inventory view mode (LIST or GRID) persisted in localStorage
  const [inventoryViewMode, setInventoryViewMode] = useState<InventoryViewMode>(() => {
    const saved = localStorage.getItem('mune_inventory_view');
    return (saved as InventoryViewMode) || 'LIST';
  });

  // Icon picker state for editing inventory items
  const [editingIconForItem, setEditingIconForItem] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { play } = useGameSound();

  const toggleAutoReduce = () => {
    const newValue = !autoReduceOnUse;
    setAutoReduceOnUse(newValue);
    localStorage.setItem('mune_auto_reduce_on_use', String(newValue));
    play('CLICK');
  };

  // Persist inventory view mode to localStorage
  useEffect(() => {
    localStorage.setItem('mune_inventory_view', inventoryViewMode);
  }, [inventoryViewMode]);

  // --- Drag and Drop Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndResources = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        if (!prev) return null;
        const oldIndex = prev.resources.findIndex((item) => item.id === active.id);
        const newIndex = prev.resources.findIndex((item) => item.id === over.id);
        return {
          ...prev,
          resources: arrayMove(prev.resources, oldIndex, newIndex),
        };
      });
    }
  };

  const handleDragEndAttributes = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        if (!prev) return null;
        const oldIndex = prev.attributes.findIndex((item) => item.id === active.id);
        const newIndex = prev.attributes.findIndex((item) => item.id === over.id);
        return {
          ...prev,
          attributes: arrayMove(prev.attributes, oldIndex, newIndex),
        };
      });
    }
  };

  const handleDragEndInventory = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        if (!prev) return null;
        const oldIndex = prev.inventory.findIndex((item) => (item as InventoryItem).id === active.id);
        const newIndex = prev.inventory.findIndex((item) => (item as InventoryItem).id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return {
          ...prev,
          inventory: arrayMove(prev.inventory, oldIndex, newIndex),
        };
      });
    }
  };

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
    setNewItemIcon('');
    setNewItemIconColor('');
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
    setNewItemIcon('');
    setNewItemIconColor('');
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

  const handleUseItem = (charId: string, charName: string, item: InventoryItem | string) => {
    play('CLICK');
    // Always ask for confirmation first
    setItemToUse({ charId, charName, item });
  };

  const confirmUseItem = () => {
    if (!itemToUse) return;

    const { charId, charName, item } = itemToUse;
    const itemName = typeof item === 'string' ? item : item.name;
    const isPermanent = typeof item === 'string' ? false : item.isPermanent;
    const diceNotation = typeof item === 'string' ? undefined : item.dice;
    const itemId = typeof item === 'string' ? null : item.id;

    // Get current quantity from characters state (not stale itemToUse)
    const currentChar = characters.find((c: Character) => c.id === charId);
    const currentItem = currentChar?.inventory.find(
      (i: InventoryItem | string): i is InventoryItem => typeof i !== 'string' && i.id === itemId
    );
    const currentQty = currentItem?.quantity ?? (typeof item === 'string' ? 1 : item.quantity);

    // GUARD: Prevent using non-permanent items with 0 quantity
    if (!isPermanent && currentQty === 0) {
      return;
    }

    // AUTO-REDUCE: Decrement quantity if toggle is ON and item is consumable
    if (!isPermanent && autoReduceOnUse && currentQty > 0 && itemId) {
      updateInventoryItem(charId, itemId, { quantity: currentQty - 1 });
    }

    // Build details string with remaining quantity info
    const getLogDetails = (diceDetail?: string) => {
      if (isPermanent) return '(Item Permanente)';
      if (autoReduceOnUse && currentQty > 0) {
        return diceDetail
          ? `${diceDetail} (Restam: ${currentQty - 1})`
          : `(Consumível - Restam: ${currentQty - 1})`;
      }
      return diceDetail || '(Consumível)';
    };

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
          details: getLogDetails(`${diceNotation} -> ${diceResult.detail}`),
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
            title: `${charName} usou ${itemName}`,
            result: '', // Empty result since it's already in the title
            details: getLogDetails(),
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

  // Update inventory item in form data (for edit mode)
  const updateFormInventoryItem = (itemId: string, updates: Partial<InventoryItem>) => {
    setFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        inventory: prev.inventory.map(item => {
          if (typeof item === 'string') return item;
          if (item.id === itemId) return { ...item, ...updates };
          return item;
        })
      };
    });
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
          className="w-full max-w-sm bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <button 
            type="button"
            onClick={() => { play('CLICK'); setPendingRoll(null); }}
            className="absolute top-4 right-4 text-txt-muted hover:text-txt-main"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-card-hover rounded-xl border border-border">
               <Shield size={24} className="text-primary" />
            </div>
            <div>
               <h3 className="text-lg font-bold text-txt-main leading-none">{pendingRoll.charName}</h3>
               <p className="text-sm text-txt-muted mt-1 uppercase font-bold tracking-wider">
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
                   ? 'bg-error/20 border-error text-error' 
                   : 'bg-card border-border text-txt-muted hover:bg-card-hover'
                 }`}
               >
                 <TrendingDown size={20} className="mb-1" />
                 <span className="text-[10px] uppercase font-bold">Desvant.</span>
               </button>

               <button
                 onClick={() => { play('CLICK'); setRollConfig(prev => ({ ...prev, mode: 'NORMAL' })); }}
                 className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                   rollConfig.mode === 'NORMAL' 
                   ? 'bg-card-hover border-txt-muted text-txt-main' 
                   : 'bg-card border-border text-txt-muted hover:bg-card-hover'
                 }`}
               >
                 <Shield size={20} className="mb-1" />
                 <span className="text-[10px] uppercase font-bold">Normal</span>
               </button>

               <button
                 onClick={() => { play('CLICK'); setRollConfig(prev => ({ ...prev, mode: 'ADVANTAGE' })); }}
                 className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                   rollConfig.mode === 'ADVANTAGE' 
                   ? 'bg-success/20 border-success text-success' 
                   : 'bg-card border-border text-txt-muted hover:bg-card-hover'
                 }`}
               >
                 <TrendingUp size={20} className="mb-1" />
                 <span className="text-[10px] uppercase font-bold">Vantagem</span>
               </button>
            </div>

            {/* Target Modifier - Only show if not NONE */}
            {!isNone && (
                <div className="bg-card/50 rounded-xl p-4 border border-border">
                   <div className="flex justify-between items-center mb-3">
                     <span className="text-xs font-bold text-txt-muted uppercase flex items-center gap-2">
                       <Target size={14} /> Modificar Alvo
                     </span>
                     <span className="text-xs font-mono text-txt-dim">
                       Alvo Final: <span className="text-txt-main font-bold text-sm">{attr.value + rollConfig.modifier}</span>
                     </span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     <button 
                       onClick={() => { play('CLICK'); setRollConfig(prev => ({ ...prev, modifier: prev.modifier - 1 })); }}
                       className="w-12 h-12 flex items-center justify-center bg-card hover:bg-card-hover text-txt-muted rounded-lg border border-border active:scale-95 transition-all"
                     >
                       <Minus size={20} />
                     </button>
                     
                     <div className="flex-1 text-center font-mono text-2xl font-black text-txt-main bg-app rounded-lg py-2 border border-border">
                       {rollConfig.modifier > 0 ? '+' : ''}{rollConfig.modifier}
                     </div>

                     <button 
                       onClick={() => { play('CLICK'); setRollConfig(prev => ({ ...prev, modifier: prev.modifier + 1 })); }}
                       className="w-12 h-12 flex items-center justify-center bg-card hover:bg-card-hover text-txt-muted rounded-lg border border-border active:scale-95 transition-all"
                     >
                       <Plus size={20} />
                     </button>
                   </div>
                </div>
            )}

            <button
              onClick={executeRoll}
              className="w-full bg-primary hover:bg-primary-hover text-on-primary font-bold uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-primary/20 active:translate-y-1 transition-all"
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
        borderClass = "border-primary shadow-primary/20";
    } else {
        borderClass = rollResult.isSuccess ? 'border-success shadow-success/20' : 'border-error shadow-error/20';
    }

    const containerState = isRevealing 
      ? "bg-card border-2 border-border scale-100" 
      : `bg-app border-2 ${borderClass} scale-105`;

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
               className="absolute top-3 right-3 text-txt-muted hover:text-txt-main bg-card rounded-full p-1 animate-in fade-in"
             >
               <X size={16} />
             </button>
          )}

          <h3 className="text-txt-muted uppercase text-[10px] font-bold tracking-widest mb-4">
            {rollResult.charName} • {rollResult.attrName}
          </h3>
          
          <div className="flex items-center justify-center gap-3 mb-6">
             <div className="flex flex-col items-center relative">
                <span className="text-[10px] uppercase font-bold text-txt-dim mb-1">Resultado</span>
                
                {isRevealing ? (
                  <div className="h-16 flex items-center justify-center">
                    <Dices className="text-txt-dim animate-spin" size={40} />
                  </div>
                ) : (
                  <div className="animate-in zoom-in spin-in-180 duration-500">
                    <span className={`text-6xl font-black ${!isNone && rollResult.isSuccess ? 'text-txt-main' : (isNone ? 'text-primary' : 'text-txt-main')}`}>
                      {rollResult.roll}
                    </span>
                  </div>
                )}
                
                <span className="text-[10px] text-txt-dim font-mono mt-1 min-h-[15px]">
                   {!isRevealing && rollResult.diceNotation}
                </span>
             </div>
             
             {!isNone && (
                 <>
                     <div className="h-12 w-px bg-border mx-2"></div>

                     <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase font-bold text-txt-dim mb-1">Alvo</span>
                        <span className="text-3xl font-bold text-txt-muted font-mono">
                          {rollResult.target}
                        </span>
                     </div>
                 </>
             )}
          </div>

          <div className="h-8 flex items-center justify-center">
            {isRevealing ? (
               <span className="text-txt-dim font-bold uppercase tracking-widest text-sm animate-pulse">Rolando...</span>
            ) : (
               !isNone && (
                   <div className={`text-2xl font-black uppercase tracking-tight animate-in slide-in-from-bottom-2 duration-300 ${rollResult.isSuccess ? 'text-success' : 'text-error'}`}>
                     {rollResult.isSuccess ? 'SUCESSO!' : 'FALHA!'}
                   </div>
               )
            )}
          </div>
          
          {!isRevealing && !isNone && (
            <div className="mt-4 inline-block bg-card px-3 py-1 rounded-full border border-border animate-in fade-in delay-100">
               <span className="text-[10px] text-txt-muted uppercase font-bold">
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
    const borderClass = "border-primary shadow-primary/20"; 

    const containerState = isItemRevealing 
      ? "bg-card border-2 border-border scale-100" 
      : `bg-app border-2 ${borderClass} scale-105`;

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
              className="absolute top-3 right-3 text-txt-muted hover:text-txt-main bg-card rounded-full p-1 animate-in fade-in"
            >
              <X size={16} />
            </button>
          )}

          <h3 className="text-txt-muted uppercase text-[10px] font-bold tracking-widest mb-4 flex items-center justify-center gap-2">
            <Backpack size={12} /> {itemRollResult.itemName}
          </h3>
          
          <div className="flex flex-col items-center relative mb-4">
            <span className="text-[10px] uppercase font-bold text-txt-dim mb-2">Resultado</span>
            
            {isItemRevealing ? (
              <div className="h-16 flex items-center justify-center">
                <Dices className="text-txt-dim animate-spin" size={40} />
              </div>
            ) : (
              <div className="animate-in zoom-in spin-in-180 duration-500">
                <span className="text-6xl font-black text-primary drop-shadow-lg">
                  {itemRollResult.roll}
                </span>
              </div>
            )}
            
            <span className="text-xs text-txt-dim font-mono mt-2 bg-card px-2 py-1 rounded border border-border min-h-[24px] flex items-center">
               {!isItemRevealing && itemRollResult.diceNotation}
            </span>
          </div>

           <div className="mt-2 text-xs text-txt-muted font-mono min-h-[16px] flex items-center justify-center">
              {isItemRevealing ? (
                <span className="text-txt-dim font-bold uppercase tracking-widest text-sm animate-pulse">Rolando...</span>
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

    const { charId, item } = itemToUse;
    const itemName = typeof item === 'string' ? item : item.name;
    const isPermanent = typeof item === 'string' ? false : item.isPermanent;
    const itemId = typeof item === 'string' ? null : item.id;
    const diceNotation = typeof item === 'string' ? null : item.dice;

    // Get current quantity from characters state to ensure it's always up-to-date
    const currentChar = characters.find((c: Character) => c.id === charId);
    const currentItem = currentChar?.inventory.find(
      (i: InventoryItem | string): i is InventoryItem => typeof i !== 'string' && i.id === itemId
    );
    const quantity = currentItem?.quantity ?? (typeof item === 'string' ? 1 : item.quantity);

    const isButtonDisabled = !isPermanent && quantity === 0;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={() => { play('CLICK'); setItemToUse(null); }}
      >
        <div
          className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => { play('CLICK'); setItemToUse(null); }}
            className="absolute top-4 right-4 text-txt-muted hover:text-txt-main"
          >
            <X size={20} />
          </button>

          <h3 className="text-lg font-bold text-txt-main mb-3 flex items-center gap-2">
            <Backpack size={20} className="text-primary" />
            Usar Item
          </h3>

          <div className="text-txt-muted mb-4 text-sm leading-relaxed">
            <p>Deseja usar o item <span className="text-txt-main font-bold">"{itemName}"</span>?</p>
            {diceNotation && (
              <span className="inline-flex items-center gap-1.5 mt-2 mb-1 px-2 py-1 bg-app rounded font-mono text-xs text-primary border border-border">
                <Dices size={12} />
                {diceNotation}
              </span>
            )}
            <p className="text-xs text-txt-dim mt-1">Isso registrará a ação no log.</p>
          </div>

          {/* Quantity Editor or Permanent Badge */}
          {isPermanent ? (
            <div className="flex items-center justify-center gap-2 bg-app rounded-lg p-3 mb-4">
              <Shield size={16} className="text-primary" />
              <span className="text-txt-muted text-sm">Item Permanente</span>
            </div>
          ) : (
            <>
              {/* Auto-Reduce Toggle */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-txt-muted text-sm">Reduzir quantidade ao usar</span>
                <button
                  type="button"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleAutoReduce(); }}
                  className={`w-12 h-7 rounded-full relative transition-colors duration-300 ease-in-out border ${
                    autoReduceOnUse ? 'bg-primary border-primary' : 'bg-app border-border'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-all duration-300 ${
                    autoReduceOnUse ? 'translate-x-5 bg-on-primary' : 'translate-x-0 bg-txt-dim'
                  }`} />
                </button>
              </div>

              {/* Quantity Editor Section - matches inventory list styling */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-txt-muted text-sm">Quantidade:</span>
                <div className="flex items-center gap-1 bg-app rounded p-1">
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (itemId) updateInventoryItem(charId, itemId, { quantity: Math.max(0, quantity - 1) }); }}
                    disabled={quantity <= 0}
                    className="p-2 text-txt-muted hover:text-txt-main hover:bg-card-hover rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus size={14} />
                  </button>
                  <span className={`w-8 text-center font-black font-mono text-lg ${quantity === 0 ? 'text-error' : 'text-primary'}`}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (itemId) updateInventoryItem(charId, itemId, { quantity: quantity + 1 }); }}
                    className="p-2 text-txt-muted hover:text-txt-main hover:bg-card-hover rounded transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { play('CLICK'); setItemToUse(null); }}
              className="flex-1 px-4 py-3 bg-card-hover hover:bg-border text-txt-main rounded-lg font-bold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmUseItem}
              disabled={isButtonDisabled}
              className={`flex-1 px-4 py-3 rounded-lg font-bold text-sm transition-colors ${
                isButtonDisabled
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-hover text-on-primary shadow-lg shadow-primary/20'
              }`}
            >
              {isButtonDisabled ? 'Sem Estoque' : 'Sim, usar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div className="h-full overflow-y-auto bg-app">
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-24 max-w-7xl mx-auto">
        {characters.map(char => (
          <div 
            key={char.id}
            onClick={() => { play('CLICK'); setSelectedCharId(char.id); setMode('DETAIL'); }}
            className="aspect-[3/4] rounded-xl bg-card border border-border overflow-hidden relative shadow-lg hover:border-primary/50 transition-all active:scale-95 cursor-pointer flex flex-col"
          >
            <div className="flex-1 bg-app relative min-h-0">
               {char.imageUrl ? (
                 <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover object-top" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-txt-dim">
                   <User size={48} />
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-app/80 via-transparent to-transparent opacity-60" />
            </div>
            <div className="p-3 bg-card border-t border-border/50">
              <h3 className="font-bold text-txt-main leading-tight truncate">{char.name}</h3>
              <p className="text-xs text-primary truncate">{char.profession}</p>
            </div>
          </div>
        ))}

        <button 
          type="button"
          onClick={() => { play('CLICK'); handleCreateNew(); }}
          className="aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-primary bg-card/50 flex flex-col items-center justify-center gap-2 text-txt-dim hover:text-primary transition-all active:scale-95 group"
        >
          <div className="bg-card p-3 rounded-full group-hover:bg-primary/10 transition-colors">
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
      <div className="h-full flex flex-col relative bg-app">
        
        {/* Persistent Detail Header */}
        <div className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center pointer-events-none">
            {/* Left Section Container: Always contains X, contains Edit/Delete only in Landscape */}
            <div className="flex items-center justify-between w-full landscape:w-[45%] p-4 pointer-events-auto">
              <button 
                type="button"
                onClick={() => { play('CLICK'); setMode('LIST'); }}
                className="p-2 bg-black/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-black/60 shadow-lg transition-all active:scale-95"
              >
                <X size={24} />
              </button>
              
              {/* Edit/Delete grouped here ONLY on landscape, aligned to the right of the 45% column */}
              <div className="hidden landscape:flex gap-2">
                <button 
                  type="button"
                  onClick={() => { play('CLICK'); handleDelete(char.id); }}
                  className="p-2 bg-error/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-error/60 shadow-lg transition-all active:scale-95"
                >
                  <Trash2 size={24} />
                </button>
                <button 
                  type="button"
                  onClick={() => { play('CLICK'); handleEdit(char); }}
                  className="p-2 bg-primary/40 backdrop-blur-md rounded-full text-on-primary hover:bg-primary/60 shadow-lg transition-all active:scale-95"
                >
                  <Edit2 size={24} />
                </button>
              </div>
            </div>
            
            {/* Edit/Delete grouped here ONLY on portrait, aligned to the far right of the screen */}
            <div className="flex landscape:hidden gap-2 p-4 pointer-events-auto">
              <button 
                type="button"
                onClick={() => { play('CLICK'); handleDelete(char.id); }}
                className="p-2 bg-error/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-error/60 shadow-lg transition-all active:scale-95"
              >
                <Trash2 size={24} />
              </button>
              <button 
                type="button"
                onClick={() => { play('CLICK'); handleEdit(char); }}
                className="p-2 bg-primary/40 backdrop-blur-md rounded-full text-on-primary hover:bg-primary/60 shadow-lg transition-all active:scale-95"
              >
                <Edit2 size={24} />
              </button>
            </div>
        </div>

        <div className="flex-1 flex flex-col landscape:flex-row overflow-y-auto landscape:overflow-hidden">
        
        {/* LEFT COLUMN: Identity & Resources */}
        {/* Landscape: Fixed sidebar. Portrait: Part of the main scroll flow */}
        <div className="w-full landscape:w-[45%] landscape:h-full landscape:overflow-y-auto landscape:border-r border-border bg-app flex-none">
          
          {/* Header Image With Info */}
          <div className="relative w-full flex-none bg-black/20 h-64 landscape:h-40">
            {char.imageUrl ? (
              <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover object-top opacity-60" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-card bg-app">
                <User size={50} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-app via-app/60 to-transparent" />
            
            {/* Text Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-app to-transparent">
              <h2 className="text-3xl font-black text-txt-main drop-shadow-md leading-none mb-1 line-clamp-2">{char.name}</h2>
              <p className="text-primary font-bold uppercase tracking-wider text-xs shadow-black drop-shadow-sm">{char.profession}</p>
              {char.description && (
                 <p className="text-txt-muted text-sm italic mt-2 leading-snug drop-shadow-sm line-clamp-3">
                   "{char.description}"
                 </p>
              )}
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Resources Block */}
            <div>
              <h3 className="flex items-center gap-2 text-txt-muted uppercase font-bold text-xs tracking-wider mb-3">
                <Activity size={14} /> Recursos
              </h3>
              <div className={`grid gap-2 ${(char.resources?.length || 0) > 0 && (char.resources?.length || 0) % 4 === 0 ? "grid-cols-4" : "grid-cols-3"}`}>
                {(!char.resources || char.resources.length === 0) ? (
                  <div className="col-span-full">
                    <p className="text-txt-dim text-sm italic">Sem recursos.</p>
                  </div>
                ) : (
                  char.resources.map(res => {
                    const style = getCardStyle(res.color);
                    return (
                    <div key={res.id} className={`flex flex-col items-center justify-between p-2 rounded-lg border transition-colors ${style.className}`} style={style.style}>
                      <span className={`text-[10px] uppercase font-bold mb-2 w-full truncate text-center ${getTextStyle(res.color)}`} title={res.name}>
                        {res.name}
                      </span>
                      
                      <div className="flex items-center justify-between w-full bg-black/20 rounded p-1">
                        <button 
                          onClick={() => updateResourceValue(char.id, res.id, -1)}
                          className={`p-1 rounded transition-colors active:scale-90 ${res.color ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-txt-muted hover:text-txt-main hover:bg-card-hover'}`}
                        >
                          <Minus size={14} />
                        </button>
                        
                        <div className="flex flex-col items-center leading-none">
                           <span className={`text-lg font-black ${res.color ? 'text-white' : 'text-txt-main'}`}>{res.current}</span>
                           <div className={`w-full h-px my-0.5 ${res.color ? 'bg-white/30' : 'bg-border'}`}></div>
                           <span className={`text-[9px] font-mono ${res.color ? 'text-white/60' : 'text-txt-dim'}`}>{res.max}</span>
                        </div>

                        <button 
                          onClick={() => updateResourceValue(char.id, res.id, 1)}
                          className={`p-1 rounded transition-colors active:scale-90 ${res.color ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-txt-muted hover:text-txt-main hover:bg-card-hover'}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  )})
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Stats & Inventory */}
        {/* Landscape: Independent scroll. Portrait: Part of the main scroll flow */}
        <div className="w-full landscape:flex-1 landscape:h-full landscape:overflow-y-auto bg-app flex-none">
          <div className="p-4 space-y-6 pb-24">
             {/* Attributes Block */}
             <div>
                <h3 className="flex items-center gap-2 text-txt-muted uppercase font-bold text-xs tracking-wider mb-3">
                  <Shield size={14} /> Atributos
                </h3>
                <div className={`grid gap-2 ${char.attributes.length > 0 && char.attributes.length % 4 === 0 ? "grid-cols-4" : "grid-cols-3"}`}>
                  {char.attributes.length === 0 ? (
                    <div className="col-span-3">
                      <p className="text-txt-dim text-sm italic">Sem atributos definidos.</p>
                    </div>
                  ) : (
                    char.attributes.map(attr => {
                      const style = getCardStyle(attr.color);
                      return (
                      <button
                        type="button"
                        key={attr.id}
                        onClick={() => initiateAttributeRoll(char.name, attr)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all active:scale-[0.98] ${style.className} ${attr.color ? 'hover:brightness-110' : 'hover:border-primary hover:bg-card-hover'}`}
                        style={style.style}
                      >
                        <span className={`text-[10px] uppercase font-bold mb-1 w-full truncate text-center ${getTextStyle(attr.color)}`} title={attr.name}>{attr.name}</span>
                        
                        <div className={`flex items-center justify-center rounded px-2 w-full mb-1 ${attr.color ? 'bg-black/20' : 'bg-app/50'}`}>
                            <span className={`text-2xl font-black font-mono ${attr.color ? 'text-white' : 'text-primary'}`}>
                                {attr.value}
                            </span>
                        </div>

                        <div className="flex flex-col items-center">
                             <span className={`text-[9px] font-mono ${attr.color ? 'text-white/70' : 'text-txt-dim'}`}>{attr.dice || 'd20'}</span>
                             {attr.rollType !== 'NONE' && (
                                 <span className={`text-[8px] uppercase font-bold ${attr.color ? 'text-white/50' : 'text-txt-dim'}`}>
                                    {attr.rollType === 'UNDER' ? 'Menor' : 'Maior'}
                                 </span>
                             )}
                        </div>
                      </button>
                    )})
                  )}
                </div>
             </div>

             {/* Inventory Block */}
             <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-txt-muted uppercase font-bold text-xs tracking-wider">
                    <Backpack size={14} /> Inventário ({char.inventory.length})
                  </h3>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { play('CLICK'); setInventoryViewMode('LIST'); }}
                      className={`p-2.5 rounded-lg transition-colors ${
                        inventoryViewMode === 'LIST'
                          ? 'bg-primary text-on-primary'
                          : 'bg-card text-txt-muted hover:text-txt-main'
                      }`}
                      title="Visualização em Lista"
                    >
                      <List size={20} />
                    </button>
                    <button
                      onClick={() => { play('CLICK'); setInventoryViewMode('GRID'); }}
                      className={`p-2.5 rounded-lg transition-colors ${
                        inventoryViewMode === 'GRID'
                          ? 'bg-primary text-on-primary'
                          : 'bg-card text-txt-muted hover:text-txt-main'
                      }`}
                      title="Visualização em Grade"
                    >
                      <LayoutGrid size={20} />
                    </button>
                  </div>
                </div>

                {char.inventory.length === 0 ? (
                  <p className="text-txt-dim text-sm italic">Mochila vazia.</p>
                ) : inventoryViewMode === 'GRID' ? (
                  /* GRID VIEW */
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {char.inventory.map((item: InventoryItem | string, idx) => {
                      if (typeof item === 'string') {
                        // Legacy string items - show as simple grid item
                        return (
                          <button
                            key={`str-${idx}`}
                            onClick={() => handleUseItem(char.id, char.name, item)}
                            className="relative aspect-square rounded-lg bg-card border border-border
                                       flex flex-col items-center justify-center p-1
                                       active:bg-card-hover transition-colors hover:border-primary/50"
                            title={item}
                          >
                            <span className="text-xs text-txt-muted text-center truncate w-full px-1">{item}</span>
                          </button>
                        );
                      }
                      return (
                        <InventoryGridItem
                          key={item.id}
                          item={item}
                          onUse={() => handleUseItem(char.id, char.name, item)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  /* LIST VIEW */
                  <div className="space-y-2">
                    {char.inventory.map((item: InventoryItem | string, idx) => {
                      const isPerm = typeof item === 'string' ? false : item.isPermanent;
                      const diceNotation = typeof item === 'string' ? undefined : item.dice;

                      if (typeof item === 'string') {
                        return (
                          <div
                            key={idx}
                            onClick={() => handleUseItem(char.id, char.name, item)}
                            className="flex items-center gap-2 text-txt-muted text-sm p-3 bg-card/30 rounded border border-card cursor-pointer hover:bg-card hover:border-border transition-colors active:scale-[0.98]"
                          >
                            <span className="text-primary">•</span> {item} (Antigo)
                          </div>
                        );
                      }

                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-card rounded border border-border">
                          <div
                            onClick={() => handleUseItem(char.id, char.name, item)}
                            className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer group active:opacity-80 transition-opacity"
                          >
                            {isPerm ? (
                              <Shield size={16} className="text-primary flex-none group-hover:opacity-80 transition-opacity" />
                            ) : (
                              <div className="w-4 flex-none" />
                            )}
                            <span className="text-sm font-bold truncate transition-colors text-txt-main group-hover:text-primary">
                              {item.name}
                            </span>
                            {diceNotation && (
                               <span className="text-[10px] bg-app border border-border text-txt-muted px-1.5 py-0.5 rounded font-mono group-hover:border-primary/50 group-hover:text-primary max-w-[48px] truncate inline-block align-middle">
                                 {diceNotation}
                               </span>
                            )}
                          </div>

                          {item.isPermanent ? (
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteInventoryItem(char.id, item.id); }}
                              className="p-2 text-txt-muted hover:text-error bg-app rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-app rounded p-1">
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateInventoryItem(char.id, item.id, { quantity: Math.max(0, item.quantity - 1) }); }}
                                className="p-2 text-txt-muted hover:text-txt-main hover:bg-card-hover rounded transition-colors"
                              >
                                <Minus size={14} />
                              </button>

                              {editingQtyId === item.id ? (
                                <input
                                  autoFocus
                                  type="number"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  className="w-12 bg-card-hover text-txt-main text-center font-bold text-sm rounded py-1 outline-none border border-primary"
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
                                  className="w-8 text-center text-primary font-black font-mono text-lg cursor-text"
                                >
                                  {item.quantity}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateInventoryItem(char.id, item.id, { quantity: item.quantity + 1 }); }}
                                className="p-2 text-txt-muted hover:text-txt-main hover:bg-card-hover rounded transition-colors"
                              >
                                <Plus size={14} />
                              </button>

                              <div className="w-px h-6 bg-border mx-1"></div>

                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteInventoryItem(char.id, item.id); }}
                                className="p-2 text-txt-muted hover:text-error hover:bg-card rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                dice: newItemDice,
                icon: newItemIcon || undefined,
                iconColor: newItemIconColor || undefined
            };
            return {
                ...prev,
                inventory: [...prev.inventory, newItem]
            };
        });

        setNewItemName('');
        setNewItemDice('');
        setNewItemIsPermanent(false);
        setNewItemIcon('');
        setNewItemIconColor('');
    };

    const updateInventoryItemForm = (id: string, updates: Partial<InventoryItem>) => {
        setFormData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                inventory: prev.inventory.map(item => {
                    if (typeof item === 'string') return item;
                    if (item.id === id) return { ...item, ...updates };
                    return item;
                })
            };
        });
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
      <div className="flex flex-col h-full bg-app relative">
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
              className="px-4 py-2 bg-success hover:bg-green-500 text-on-primary font-bold rounded-full shadow-lg pointer-events-auto flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckSquare size={18} /> Salvar
            </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-24 w-full">
          <div className="max-w-3xl mx-auto w-full min-h-full">
            {/* Header / Image Upload */}
            <div className="relative h-48 w-full flex-none bg-black/20 group cursor-pointer" onClick={() => { play('CLICK'); triggerFileUpload(); }}>
              {formData.imageUrl ? (
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-40 transition-opacity" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-txt-dim bg-app group-hover:bg-card transition-colors">
                  <ImageIcon size={64} />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-app/90 border border-border text-txt-main px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-xl">
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
               <h3 className="flex items-center gap-2 text-txt-muted uppercase font-bold text-xs tracking-wider mb-3">
                  <FileText size={14} /> Dados Básicos
               </h3>
               <div className="bg-card/50 p-4 rounded-xl border border-border/50 space-y-4">
                 <div>
                   <label className="text-xs uppercase font-bold text-txt-muted mb-1 block">Nome do Personagem</label>
                   <input 
                     type="text" 
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="w-full bg-card border border-border rounded-lg p-3 text-txt-main font-bold text-lg focus:border-primary outline-none"
                     placeholder="Ex: Gandalf, o Cinzento"
                   />
                 </div>
                 
                 <div>
                   <label className="text-xs uppercase font-bold text-txt-muted mb-1 block">Arquétipo / Profissão</label>
                   <input 
                     type="text" 
                     value={formData.profession}
                     onChange={e => setFormData({...formData, profession: e.target.value})}
                     className="w-full bg-card border border-border rounded-lg p-3 text-txt-main focus:border-primary outline-none"
                     placeholder="Ex: Mago, Guerreiro, Detetive..."
                   />
                 </div>

                 <div>
                   <label className="text-xs uppercase font-bold text-txt-muted mb-1 block">Descrição / Notas</label>
                   <textarea 
                     value={formData.description}
                     onChange={e => setFormData({...formData, description: e.target.value})}
                     className="w-full bg-card border border-border rounded-lg p-3 text-txt-main text-sm focus:border-primary outline-none min-h-[80px]"
                     placeholder="Detalhes sobre o personagem..."
                   />
                 </div>
               </div>
            </div>

            {/* Resources Management */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-txt-muted uppercase flex items-center gap-2">
                  <Activity size={16} /> Recursos
                </h3>
                <button 
                  type="button" 
                  onClick={() => { play('CLICK'); addResource(); }}
                  className="text-xs font-bold text-primary hover:text-primary-active flex items-center gap-1 bg-card px-2 py-1 rounded"
                >
                  <Plus size={12} /> Adicionar
                </button>
              </div>

              <div className="space-y-3">
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter} 
                  onDragEnd={handleDragEndResources}
                >
                  <SortableContext 
                    items={formData.resources.map(r => r.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    {formData.resources.map((res, idx) => {
                      const style = getCardStyle(res.color);
                      return (
                      <SortableItem key={res.id} id={res.id}>
                        <div className={`p-3 rounded-lg border transition-colors flex flex-col gap-2 ${style.className}`} style={style.style}>
                            <div className="flex justify-between gap-2 items-center">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setColorPickerTargetId(`resource:${res.id}`); }}
                                className={`p-2 rounded-lg transition-all flex items-center justify-center border active:scale-95 shadow-sm ${res.color ? 'text-white border-white/30 bg-white/10 hover:bg-white/20' : 'text-txt-muted border-border bg-card/50 hover:text-txt-main hover:border-card-hover'}`}
                                title="Alterar Cor"
                              >
                                <PaintBucket size={16} />
                              </button>
                              <input 
                                type="text" 
                                value={res.name}
                                onChange={(e) => updateResource(res.id, 'name', e.target.value)}
                                className={`flex-1 bg-transparent border-b ${getInputStyle(res.color)} font-bold outline-none pb-1 transition-colors`}
                                placeholder="Nome do Recurso"
                              />
                              <button onClick={() => { play('CLICK'); removeResource(res.id); }} className={`${getButtonStyle(res.color)}`}><Trash2 size={16} /></button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={`text-[9px] uppercase font-bold block mb-1 ${getLabelStyle(res.color)}`}>Atual</label>
                                  <input 
                                    type="number" 
                                    value={res.current}
                                    onChange={(e) => updateResource(res.id, 'current', parseInt(e.target.value) || 0)}
                                    className={`w-full rounded p-2 font-mono text-center outline-none border ${getInputStyle(res.color).replace('bg-transparent', 'bg-black/10')}`}
                                  />
                                </div>
                                <div>
                                  <label className={`text-[9px] uppercase font-bold block mb-1 ${getLabelStyle(res.color)}`}>Máximo</label>
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
                                    className={`w-full rounded p-2 font-mono text-center outline-none border ${getInputStyle(res.color).replace('bg-transparent', 'bg-black/10')}`}
                                  />
                                </div>
                            </div>
                        </div>
                      </SortableItem>
                    )})}
                  </SortableContext>
                </DndContext>
                {formData.resources.length === 0 && <p className="text-xs text-txt-dim italic text-center">Nenhum recurso adicionado.</p>}
              </div>
            </div>

            {/* Attributes Management */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-txt-muted uppercase flex items-center gap-2">
                  <Shield size={16} /> Atributos
                </h3>
                <button 
                  type="button" 
                  onClick={() => { play('CLICK'); addAttribute(); }}
                  className="text-xs font-bold text-primary hover:text-primary-active flex items-center gap-1 bg-card px-2 py-1 rounded"
                >
                  <Plus size={12} /> Adicionar
                </button>
              </div>

              <div className="space-y-3">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndAttributes}
                >
                  <SortableContext
                    items={formData.attributes.map(a => a.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {formData.attributes.map((attr) => {
                      const isDiceEmpty = !attr.dice || attr.dice.trim() === '';
                      const style = getCardStyle(attr.color);
                      return (
                        <SortableItem key={attr.id} id={attr.id}>
                          <div className={`p-3 rounded-lg border transition-colors flex flex-col gap-2 ${style.className}`} style={style.style}>
                              <div className="flex justify-between gap-2 items-center">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setColorPickerTargetId(`attribute:${attr.id}`); }}
                                  className={`p-2 rounded-lg transition-all flex items-center justify-center border active:scale-95 shadow-sm ${attr.color ? 'text-white border-white/30 bg-white/10 hover:bg-white/20' : 'text-txt-muted border-border bg-card/50 hover:text-txt-main hover:border-card-hover'}`}
                                  title="Alterar Cor"
                                >
                                  <PaintBucket size={16} />
                                </button>
                                <input 
                                  type="text" 
                                  value={attr.name}
                                  onChange={(e) => updateAttribute(attr.id, 'name', e.target.value)}
                                  className={`flex-1 bg-transparent border-b ${getInputStyle(attr.color)} font-bold outline-none pb-1 transition-colors`}
                                  placeholder="Nome do Atributo"
                                />
                                <button onClick={() => { play('CLICK'); removeAttribute(attr.id); }} className={`${getButtonStyle(attr.color)}`}><Trash2 size={16} /></button>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className={`text-[9px] uppercase font-bold block mb-1 ${getLabelStyle(attr.color)}`}>Valor</label>
                                  <input 
                                    type="number" 
                                    value={attr.value}
                                    onChange={(e) => updateAttribute(attr.id, 'value', parseInt(e.target.value) || 0)}
                                    className={`w-full rounded p-2 font-mono text-center outline-none border h-10 ${getInputStyle(attr.color).replace('bg-transparent', 'bg-black/10')}`}
                                  />
                                </div>
                                <div>
                                  <label className={`text-[9px] uppercase font-bold block mb-1 ${getLabelStyle(attr.color)}`}>Tipo</label>
                                  <select 
                                    value={attr.rollType}
                                    onChange={(e) => updateAttribute(attr.id, 'rollType', e.target.value)}
                                    className={`w-full rounded px-2 text-xs outline-none border appearance-none h-10 ${getInputStyle(attr.color).replace('bg-transparent', 'bg-black/10')}`}
                                  >
                                      <option value="UNDER" className="text-black">≤ (Menor)</option>
                                      <option value="OVER" className="text-black">≥ (Maior)</option>
                                      <option value="NONE" className="text-black">Rolar</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={`text-[9px] uppercase font-bold block mb-1 ${isDiceEmpty ? 'text-red-400' : getLabelStyle(attr.color)} ${validationErrors.has(attr.id) ? 'animate-pulse' : ''}`}>
                                      Dado {isDiceEmpty && '*'}
                                  </label>
                                  <input 
                                    type="text" 
                                    value={attr.dice || ''}
                                    onChange={(e) => updateAttribute(attr.id, 'dice', e.target.value)}
                                    className={`w-full rounded p-2 font-mono text-center text-xs outline-none border h-10 ${isDiceEmpty ? 'border-red-500/60 focus:border-red-500' : getInputStyle(attr.color).replace('bg-transparent', 'bg-black/10')}`}
                                    placeholder="Ex: 1d20"
                                  />
                                </div>
                              </div>
                          </div>
                        </SortableItem>
                      );
                    })}
                  </SortableContext>
                </DndContext>
                {formData.attributes.length === 0 && <p className="text-xs text-txt-dim italic text-center">Nenhum atributo adicionado.</p>}
              </div>
            </div>

            {/* Inventory Management */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-txt-muted uppercase flex items-center gap-2">
                  <Backpack size={16} /> Inventário
                </h3>
              </div>

              {/* Add New Item Form */}
              <div className="bg-card/50 p-3 rounded-lg border border-border mb-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {/* Icon Picker Button */}
                      <button
                        type="button"
                        onClick={() => { play('CLICK'); setShowNewItemIconPicker(true); }}
                        className={`p-3 rounded-xl border transition-colors flex-none ${
                          newItemIcon
                            ? 'bg-card-hover border-primary/50'
                            : 'bg-card border-border hover:bg-card-hover text-txt-muted hover:text-txt-main'
                        }`}
                        title="Selecionar Ícone"
                      >
                        {newItemIcon ? (
                          <div
                            className="w-6 h-6"
                            style={{
                              backgroundColor: newItemIconColor || 'rgb(var(--text-main))',
                              maskImage: `url("/icons/${newItemIcon}.svg")`,
                              WebkitMaskImage: `url("/icons/${newItemIcon}.svg")`,
                              maskRepeat: 'no-repeat',
                              maskPosition: 'center',
                              maskSize: 'contain',
                              WebkitMaskRepeat: 'no-repeat',
                              WebkitMaskPosition: 'center',
                              WebkitMaskSize: 'contain',
                            }}
                          />
                        ) : (
                          <Sticker size={24} />
                        )}
                      </button>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="flex-1 bg-app border border-border rounded p-2 text-sm text-txt-main outline-none focus:border-primary placeholder-txt-dim"
                        placeholder="Nome do Item (Ex: Corda, Espada...)"
                      />
                    </div>
                    <div className="flex gap-2">
                        <input
                          type="text"
                          value={newItemDice}
                          onChange={(e) => setNewItemDice(e.target.value)}
                          className="flex-1 bg-app border border-border rounded p-2 text-sm text-txt-main outline-none focus:border-primary placeholder-txt-dim font-mono"
                          placeholder="Dano/Efeito (Ex: 1d8)"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewItemIsPermanent(!newItemIsPermanent);
                            play('CLICK');
                          }}
                          className={`px-3 rounded border transition-colors flex items-center justify-center ${newItemIsPermanent ? 'bg-primary/20 border-primary text-primary' : 'bg-app border-border text-txt-dim'}`}
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
                          className="px-4 bg-primary hover:bg-primary-hover text-on-primary rounded font-bold uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                        </button>
                    </div>
                  </div>
              </div>

              <div className="space-y-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndInventory}
                >
                  <SortableContext
                    items={formData.inventory.map((item) => (typeof item === 'string' ? `str-${item}` : item.id))}
                    strategy={verticalListSortingStrategy}
                  >
                    {formData.inventory.map((item, idx) => {
                      // Safe rendering for migrated items or new structure
                      const isString = typeof item === 'string';
                      const id = isString ? `str-${idx}` : item.id;
                      const name = isString ? item : item.name;
                      const quantity = isString ? 1 : item.quantity;
                      const isPerm = isString ? false : item.isPermanent;
                      const dice = isString ? undefined : item.dice;
                      const icon = isString ? undefined : item.icon;
                      const iconColor = isString ? undefined : item.iconColor;

                      return (
                        <SortableItem key={id} id={id}>
                          <div className="flex items-center justify-between p-2 bg-card rounded border border-border group">
                              <div className="flex items-center gap-2 overflow-hidden">
                                {/* Icon Preview Button */}
                                {!isString && (
                                  <button
                                    type="button"
                                    onClick={() => { play('CLICK'); setEditingIconForItem(item.id); }}
                                    className={`p-2 rounded-lg border transition-colors flex-none ${
                                      icon
                                        ? 'bg-card-hover border-primary/50'
                                        : 'bg-card border-border hover:bg-card-hover text-txt-muted hover:text-txt-main'
                                    }`}
                                    title="Alterar Ícone"
                                  >
                                    {icon ? (
                                      <div
                                        className="w-5 h-5"
                                        style={{
                                          backgroundColor: iconColor || 'rgb(var(--text-main))',
                                          maskImage: `url("/icons/${icon}.svg")`,
                                          WebkitMaskImage: `url("/icons/${icon}.svg")`,
                                          maskRepeat: 'no-repeat',
                                          maskPosition: 'center',
                                          maskSize: 'contain',
                                          WebkitMaskRepeat: 'no-repeat',
                                          WebkitMaskPosition: 'center',
                                          WebkitMaskSize: 'contain',
                                        }}
                                      />
                                    ) : (
                                      <Sticker size={20} />
                                    )}
                                  </button>
                                )}
                                {isPerm ? <Shield size={14} className="text-primary flex-none" /> : !isString && <div className="w-0" />}
                                <span className="text-sm font-bold text-txt-main truncate">{name}</span>
                                {quantity > 1 && <span className="text-xs text-primary font-mono">x{quantity}</span>}
                                {dice && <span className="text-[10px] text-txt-dim font-mono bg-app px-1 rounded">{dice}</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => { play('CLICK'); removeItem(isString ? name : item.id); }}
                                className="text-txt-dim hover:text-error p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                          </div>
                        </SortableItem>
                      );
                    })}
                  </SortableContext>
                </DndContext>
                {formData.inventory.length === 0 && <p className="text-xs text-txt-dim italic text-center">Inventário vazio.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="h-full bg-app relative">
      {mode === 'LIST' && renderList()}
      {mode === 'DETAIL' && renderDetail()}
      {mode === 'FORM' && renderForm()}
      {renderRollResultModal()}
      {renderItemRollResultModal()}
      {renderPreRollModal()}
      {renderUseItemModal()}
      
      <ConfirmDeleteModal
        isOpen={!!charToDelete}
        title="Excluir Personagem"
        description={
          <>
            Tem certeza que deseja excluir permanentemente <strong>{charToDelete?.name}</strong>?
            <br/>
            <span className="text-xs text-txt-dim mt-1 block">Esta ação não pode ser desfeita.</span>
          </>
        }
        onConfirm={confirmDelete}
        onCancel={() => setCharToDelete(null)}
      />

      <ColorPicker
        isOpen={!!colorPickerTargetId}
        onClose={() => setColorPickerTargetId(null)}
        selectedColor={
          colorPickerTargetId?.startsWith('resource:')
            ? formData?.resources.find(r => r.id === colorPickerTargetId.split(':')[1])?.color
            : formData?.attributes.find(a => a.id === colorPickerTargetId?.split(':')[1])?.color
        }
        onSelect={(color) => {
          if (!colorPickerTargetId || !formData) return;
          const [type, id] = colorPickerTargetId.split(':');

          setFormData(prev => {
            if (!prev) return null;
            if (type === 'resource') {
              return { ...prev, resources: prev.resources.map(r => r.id === id ? { ...r, color } : r) };
            } else {
              return { ...prev, attributes: prev.attributes.map(a => a.id === id ? { ...a, color } : a) };
            }
          });
        }}
      />

      {/* Icon Picker Modal for New Item */}
      {showNewItemIconPicker && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => { play('CLICK'); setShowNewItemIconPicker(false); }}
        >
          <div
            className="w-full max-w-2xl bg-app border border-border rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col h-[70vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-1 min-h-0 overflow-hidden">
              <IconPicker
                selectedIcon={newItemIcon}
                selectedColor={newItemIconColor || '#ffffff'}
                onSelect={(icon, color) => {
                  setNewItemIcon(icon || '');
                  setNewItemIconColor(color || '');
                }}
                onClose={() => setShowNewItemIconPicker(false)}
              />
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => { play('CLICK'); setShowNewItemIconPicker(false); }}
                className="px-6 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-lg font-bold"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Icon Picker Modal for Editing Existing Items */}
      {editingIconForItem && formData && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => { play('CLICK'); setEditingIconForItem(null); }}
        >
          <div
            className="w-full max-w-2xl bg-app border border-border rounded-2xl shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col h-[70vh]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-1 min-h-0 overflow-hidden">
              <IconPicker
                selectedIcon={
                  formData.inventory.find(
                    (item): item is InventoryItem => typeof item !== 'string' && item.id === editingIconForItem
                  )?.icon
                }
                selectedColor={
                  formData.inventory.find(
                    (item): item is InventoryItem => typeof item !== 'string' && item.id === editingIconForItem
                  )?.iconColor || '#ffffff'
                }
                onSelect={(icon, color) => {
                  updateFormInventoryItem(editingIconForItem, {
                    icon: icon || undefined,
                    iconColor: color || undefined
                  });
                }}
                onClose={() => setEditingIconForItem(null)}
              />
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => { play('CLICK'); setEditingIconForItem(null); }}
                className="px-6 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-lg font-bold"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaView;
