import React, { useState, useEffect } from 'react';
import { X, Check, Palette, Hash, CheckCircle2 } from 'lucide-react';
import { CARD_THEMES } from '../constants';

interface ColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColor?: string;
  onSelect: (color: string) => void;
}

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

export const ColorPicker: React.FC<ColorPickerProps> = ({ isOpen, onClose, selectedColor, onSelect }) => {
  // We use a temporary state to track selection before applying
  const [tempSelection, setTempSelection] = useState<string>('');
  const [customHex, setCustomHex] = useState('');
  const [mode, setMode] = useState<'PRESET' | 'CUSTOM'>('PRESET');

  useEffect(() => {
    if (isOpen) {
      const initial = selectedColor || 'slate';
      setTempSelection(initial);
      
      // If the incoming color is a custom hex (and not a preset name), switch to custom mode
      if (initial.startsWith('#') && !CARD_THEMES[initial]) {
        setCustomHex(initial);
        setMode('CUSTOM');
      } else {
        setCustomHex('#ffffff');
        setMode('PRESET');
      }
    }
  }, [isOpen, selectedColor]);

  if (!isOpen) return null;

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    setTempSelection(val); // Live preview logic could use this
  };

  const handleApply = () => {
    if (mode === 'CUSTOM') {
       if (/^#[0-9A-F]{6}$/i.test(customHex)) {
         onSelect(customHex);
         onClose();
       }
    } else {
       onSelect(tempSelection === 'slate' ? '' : tempSelection);
       onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Palette className="text-amber-500" size={20} />
                Escolher Cor
            </h3>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-100 p-2 bg-slate-800 rounded-full">
                <X size={20} />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800 p-1 rounded-lg mb-6">
            <button 
                onClick={() => setMode('PRESET')}
                className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'PRESET' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Padrão
            </button>
            <button 
                onClick={() => setMode('CUSTOM')}
                className={`flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${mode === 'CUSTOM' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Personalizado
            </button>
        </div>

        {/* Content */}
        <div className="min-h-[180px]">
            {mode === 'PRESET' ? (
                <div className="grid grid-cols-5 gap-4">
                    {Object.keys(CARD_THEMES).map(themeKey => {
                        const isActive = tempSelection === themeKey || (themeKey === 'slate' && !tempSelection);
                        return (
                            <button
                                key={themeKey}
                                onClick={() => setTempSelection(themeKey)}
                                className={`aspect-square rounded-full shadow-lg transition-all active:scale-95 flex items-center justify-center relative ${isActive ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                style={{ backgroundColor: PREVIEW_COLORS[themeKey] }}
                                title={themeKey}
                            >
                                {isActive && <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />}
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="relative h-24 rounded-xl border border-slate-600 overflow-hidden flex items-center justify-center shadow-inner" style={{ backgroundColor: customHex }}>
                        <span className="font-mono text-lg font-black text-white drop-shadow-md bg-black/30 px-3 py-1 rounded backdrop-blur-sm tracking-widest">
                            {customHex}
                        </span>
                        <input 
                            type="color" 
                            value={customHex}
                            onChange={handleCustomChange}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                    </div>
                    <p className="text-xs text-slate-500 text-center">Toque na barra acima para abrir o seletor nativo.</p>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
             <button 
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
             >
                Cancelar
             </button>
             <button 
                onClick={handleApply}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
             >
                <CheckCircle2 size={18} />
                Aplicar
             </button>
        </div>

      </div>
    </div>
  );
};