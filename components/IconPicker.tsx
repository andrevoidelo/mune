import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { useBackButton } from '../hooks/useBackButton';

interface IconData {
  name: string;
  filename: string;
  url: string;
}

interface IconPickerProps {
  selectedIcon?: string; // Filename
  selectedColor?: string;
  onSelect: (icon: string | undefined, color: string | undefined) => void;
  onClose: () => void;
}

export const PRESET_COLORS = [
  '#f8fafc', '#ef4444', '#84cc16', '#3b82f6',
  '#94a3b8', '#f97316', '#22c55e', '#8b5cf6',
  '#475569', '#f59e0b', '#06b6d4', '#d946ef'
];

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, selectedColor, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Fix 2: Default to #ffffff if selectedColor is undefined/null/empty
  const [color, setColor] = useState(selectedColor || '#ffffff');
  const [icons, setIcons] = useState<IconData[]>([]);
  const [loading, setLoading] = useState(true);

  // Close color picker on click outside logic removed as we use inline layout now

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Back Button
  useBackButton(() => {
    onClose();
    return true;
  });

  // EXCLUSIVE: Disable keyboard resizing for this modal
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(console.error);
    }
    return () => {
      if (Capacitor.isNativePlatform()) {
        Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(console.error);
      }
    };
  }, []);

  useEffect(() => {
    fetch(`/icons.json?t=${new Date().getTime()}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load icons: ${res.status}`);
        return res.json();
      })
      .then((filenames: string[]) => {
        const loadedIcons = filenames.map(filename => {
          const name = filename
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          return {
            name,
            filename,
            url: `/icons/${filename}.svg`
          };
        });
        setIcons(loadedIcons);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load icons:', err);
        setLoading(false);
      });
  }, []);
  
  // Filter icons
  const filteredIcons = useMemo(() => {
    if (loading) return [];
    if (!debouncedSearch.trim()) return icons.slice(0, 99); 
    
    const lowerSearch = debouncedSearch.toLowerCase();
    const results = icons.filter(icon => 
      icon.name.toLowerCase().includes(lowerSearch) || 
      icon.filename.toLowerCase().includes(lowerSearch)
    );
    return results.slice(0, 200);
  }, [debouncedSearch, icons, loading]);

  const handleIconSelect = (iconFilename: string) => {
    if (selectedIcon === iconFilename) {
        onSelect(undefined, undefined);
    } else {
        onSelect(iconFilename, color);
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (selectedIcon) {
        onSelect(selectedIcon, newColor);
    }
  };

  return (
    // Fix 1: Add rounded-2xl to prevent corner bleeding
    <div className="flex flex-col h-full overflow-hidden bg-app rounded-2xl">
      
      {/* Header: Search + Close */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-card/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" size={16} />
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ícone..."
                className="w-full bg-card border border-border rounded-full pl-9 pr-4 py-2 text-sm text-txt-main placeholder-txt-dim focus:outline-none focus:border-primary transition-colors"
                autoFocus
            />
          </div>
          <button 
              onClick={onClose}
              className="p-2 text-txt-muted hover:text-txt-main bg-card hover:bg-card-hover rounded-full transition-colors active:scale-95"
          >
            <X size={20} />
          </button>
      </div>

      {/* Color Palette - Side-by-Side Layout */}
      <div className="flex flex-row gap-4 mb-2 p-3 border-b border-border bg-app/50 flex-none">
          {/* Left: React Colorful */}
          <div className="flex-none">
             <HexColorPicker color={color} onChange={handleColorChange} style={{ width: '160px', height: '160px' }} />
          </div>

          {/* Right: Preset Grid */}
          <div className="flex-1 min-w-0">
             <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((c) => (
                    <button
                        key={c}
                        onClick={() => handleColorChange(c)}
                        className={`aspect-square rounded-lg border transition-all active:scale-95 ${color.toLowerCase() === c.toLowerCase() ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent hover:scale-105 shadow-sm'}`}
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
             </div>
             
             {/* Current Color Hex Display */}
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
                    // Fix 3: Select all text on focus
                    onFocus={(e) => e.target.select()}
                    className="flex-1 bg-transparent border-none outline-none text-[10px] font-mono font-bold text-txt-main uppercase"
                    maxLength={6}
                 />
             </div>
          </div>
      </div>

      {/* Main Content (Icon Grid) */}
      <div className="flex-1 overflow-y-auto p-3 bg-app scroll-smooth">
        {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-txt-dim gap-3 opacity-60">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-wider">Carregando...</p>
            </div>
        ) : (
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
                <button
                    onClick={() => onSelect(undefined, undefined)} 
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border border-dashed border-border hover:border-error/50 hover:bg-error/5 transition-colors group ${!selectedIcon ? 'bg-card border-primary border-solid ring-1 ring-primary/50' : 'bg-transparent'}`}
                    title="Remover ícone"
                >
                    <X size={20} className="text-txt-muted group-hover:text-error transition-colors" />
                </button>
            
            {filteredIcons.map((icon) => {
                const isSelected = selectedIcon === icon.filename;
                return (
                <button
                    key={icon.filename}
                    onClick={() => handleIconSelect(icon.filename)}
                    className={`relative aspect-square rounded-xl p-2 border transition-all active:scale-95 group ${isSelected ? 'bg-card border-primary ring-2 ring-primary/20 shadow-lg' : 'bg-card border-border hover:border-primary/50 hover:shadow-md'}`}
                    title={icon.name}
                >
                    <div 
                        className="w-full h-full transition-transform group-hover:scale-110 duration-200"
                        style={{
                            backgroundColor: isSelected ? color : 'rgb(var(--text-muted))',
                            maskImage: `url("${icon.url}")`,
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            maskSize: 'contain',
                            WebkitMaskImage: `url("${icon.url}")`,
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            WebkitMaskSize: 'contain'
                        }}
                    />
                </button>
                );
            })}
            </div>
        )}
        
        {!loading && filteredIcons.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-txt-dim opacity-50">
                <Search size={32} className="mb-2" />
                <p className="text-sm font-bold">Nenhum ícone</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default IconPicker;