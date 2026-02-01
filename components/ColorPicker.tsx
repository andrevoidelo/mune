import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { CARD_THEMES } from '../constants';

interface ColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColor?: string;
  onSelect: (color: string) => void;
  forceCustom?: boolean;
}

const GRID_COLORS = [
  '#f8fafc', '#ef4444', '#84cc16', '#3b82f6',
  '#94a3b8', '#f97316', '#22c55e', '#8b5cf6',
  '#475569', '#f59e0b', '#06b6d4', '#d946ef'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ isOpen, onClose, selectedColor, onSelect, forceCustom }) => {
  const [color, setColor] = useState<string>('#ffffff');

  useEffect(() => {
    if (isOpen) {
      if (!selectedColor || selectedColor === 'slate') {
          setColor('#64748b'); // Default Slate Hex
      } else if (selectedColor && CARD_THEMES[selectedColor]) {
          setColor('#ffffff'); 
      } else {
          setColor(selectedColor);
      }
    }
  }, [isOpen, selectedColor]);

  if (!isOpen) return null;

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };

  const handleClose = () => {
     onSelect(color);
     onClose();
  };

  const handleRestore = () => {
      onSelect('slate'); // Pass 'slate' to indicate restoration to theme default
      onClose();
  };

  const handlePresetClick = (c: string) => {
      setColor(c);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-sm bg-app border border-border rounded-2xl p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-end items-center mb-4 gap-2">
            <button 
                onClick={handleRestore}
                className="px-3 py-1.5 text-xs font-bold text-txt-muted hover:text-txt-main bg-card hover:bg-card-hover border border-border rounded-lg transition-colors"
            >
                Restaurar
            </button>
            <button 
                onClick={handleClose}
                className="px-3 py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-on-primary rounded-lg transition-colors shadow-sm"
            >
                Fechar
            </button>
        </div>

        {/* Content: Unified Layout */}
        <div className="flex flex-row gap-4 mb-2">
            {/* Left: React Colorful */}
            <div className="flex-none">
                <HexColorPicker color={color} onChange={handleColorChange} style={{ width: '160px', height: '160px' }} />
            </div>

            {/* Right: Preset Grid */}
            <div className="flex-1 min-w-0">
                <div className="grid grid-cols-4 gap-2">
                    {GRID_COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => handlePresetClick(c)}
                            className={`aspect-square rounded-lg border transition-all active:scale-95 ${color.toLowerCase() === c.toLowerCase() ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent hover:scale-105 shadow-sm'}`}
                            style={{ backgroundColor: c }}
                            title={c}
                        />
                    ))}
                </div>
                
                {/* Hex Input Display */}
                <div className="mt-2 flex items-center gap-2 bg-card border border-border rounded-lg p-1.5 w-full">
                    <div className="w-5 h-5 rounded border border-border/50 flex-none" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-txt-muted font-bold select-none">#</span>
                    <input 
                        type="text" 
                        value={color.replace('#', '')}
                        onChange={(e) => {
                            const val = '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                            handleColorChange(val);
                        }}
                        onFocus={(e) => e.target.select()}
                        className="flex-1 bg-transparent border-none outline-none text-[10px] font-mono font-bold text-txt-main uppercase"
                        maxLength={6}
                    />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};