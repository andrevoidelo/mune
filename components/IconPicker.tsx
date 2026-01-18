import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Check, PaintBucket } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

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
  '#f8fafc', // Slate 50
  '#94a3b8', // Slate 400
  '#475569', // Slate 600
  '#ef4444', // Red 500
  '#f97316', // Orange 500
  '#f59e0b', // Amber 500
  '#84cc16', // Lime 500
  '#22c55e', // Green 500
  '#10b981', // Emerald 500
  '#06b6d4', // Cyan 500
  '#3b82f6', // Blue 500
  '#6366f1', // Indigo 500
  '#8b5cf6', // Violet 500
  '#d946ef', // Fuchsia 500
  '#f43f5e', // Rose 500
];

const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, selectedColor = '#ffffff', onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [color, setColor] = useState(selectedColor);
  const [icons, setIcons] = useState<IconData[]>([]);
  const [loading, setLoading] = useState(true);

  // Debounce Search: Wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

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
    // Lazy load the icon manifest with cache busting
    fetch(`/icons.json?t=${new Date().getTime()}`)
      .then(res => {
        if (!res.ok) {
            throw new Error(`Failed to load icons: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((filenames: string[]) => {
        if (!Array.isArray(filenames)) {
            throw new Error('Invalid icon data: expected an array');
        }
        const loadedIcons = filenames.map(filename => {
          // Convert "air-balloon" -> "Air Balloon"
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
  
  // Filter icons based on debouncedSearch
  const filteredIcons = useMemo(() => {
    if (loading) return [];
    
    // If empty, show simplified list
    if (!debouncedSearch.trim()) return icons.slice(0, 99); 
    
    const lowerSearch = debouncedSearch.toLowerCase();
    const results = icons.filter(icon => 
      icon.name.toLowerCase().includes(lowerSearch) || 
      icon.filename.toLowerCase().includes(lowerSearch)
    );

    // PERFORMANCE LIMIT: Only render top 200 matches. 
    // Rendering 2000+ icons for a query like "a" freezes the UI even with debouncing.
    return results.slice(0, 200);
  }, [debouncedSearch, icons, loading]);

  const handleIconSelect = (iconFilename: string) => {
    // If clicking the already selected icon, deselect it
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
    <div className="flex flex-col landscape:flex-row h-full max-h-[600px] overflow-hidden">
      
      {/* Sidebar (Search + Color) */}
      <div className="flex-none w-full landscape:w-72 flex flex-col border-b landscape:border-b-0 landscape:border-r border-border landscape:bg-app/50 landscape:backdrop-blur-sm z-10">
        
        {/* Search Header */}
        <div className="flex items-center gap-2 p-4 border-b border-border landscape:border-b-0">
            <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" size={18} />
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Procurar ícones..."
                className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-txt-main placeholder-txt-dim focus:outline-none focus:border-primary"
            />
            </div>
            {/* Close button visible only on portrait, typically modal handles close on landscape or via outside click, but let's keep it consistent or hide if modal header exists */}
            <button 
                onClick={onClose}
                className="p-2 hover:bg-card-hover rounded-full text-txt-muted hover:text-txt-main landscape:hidden"
            >
            <X size={20} />
            </button>
        </div>

        {/* Color Picker Section */}
        <div className="p-4 border-b landscape:border-b-0 border-border landscape:overflow-y-auto landscape:flex-1">
            <label className="text-xs text-txt-muted uppercase font-bold tracking-wider mb-3 block">Cor do Ícone</label>
            <div className="flex flex-wrap gap-2 landscape:gap-1.5 items-center landscape:content-start">
            {PRESET_COLORS.map((c) => (
                <button
                key={c}
                onClick={() => handleColorChange(c)}
                className={`w-8 h-8 landscape:w-7 landscape:h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-txt-main scale-110' : 'border-transparent shadow-sm'}`}
                style={{ backgroundColor: c }}
                title={c}
                />
            ))}
            
            {/* Custom Color Button - Inline */}
            <div className="flex items-center gap-2">
                <div 
                    className="relative w-8 h-8 landscape:w-7 landscape:h-7 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center transition-all hover:scale-105 active:scale-95 group shadow-lg"
                    style={{ backgroundColor: color }}
                >
                    <PaintBucket 
                        size={16} 
                        className="pointer-events-none mix-blend-difference text-white opacity-90" 
                    />
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0"
                        title="Cor Personalizada"
                    />
                </div>
                {/* Hex code visible only in landscape to keep portrait compact */}
                <span className="hidden landscape:block text-[10px] text-txt-dim font-mono uppercase tracking-tighter">{color}</span>
            </div>
            </div>
        </div>
      </div>

      {/* Main Content (Icon Grid) */}
      <div className="flex-1 overflow-y-auto p-4 bg-app landscape:bg-app/30">
        {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-txt-dim gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>Carregando biblioteca...</p>
            </div>
        ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 landscape:grid-cols-6 lg:landscape:grid-cols-8 gap-2">
                <button
                    onClick={() => onSelect(undefined, undefined)} 
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border border-border hover:bg-card-hover transition-colors ${!selectedIcon ? 'bg-card border-primary ring-1 ring-primary' : 'bg-card/50'}`}
                    title="Remover ícone"
                >
                    <X size={24} className="text-txt-muted" />
                    <span className="text-[10px] text-txt-muted uppercase font-bold">Nenhum</span>
                </button>
            
            {filteredIcons.map((icon) => {
                const isSelected = selectedIcon === icon.filename;
                return (
                <button
                    key={icon.filename}
                    onClick={() => handleIconSelect(icon.filename)}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center p-2 border transition-all group ${isSelected ? 'bg-card border-primary ring-1 ring-primary shadow-md' : 'bg-card/50 border-border hover:border-txt-muted hover:bg-card hover:shadow-sm'}`}
                    title={icon.name}
                >
                    {/* We use mask to color the icon */}
                    <div 
                        className="w-full h-full transition-transform group-hover:scale-110 duration-200"
                        style={{
                            backgroundColor: isSelected ? color : 'rgb(var(--text-dim))',
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
            <div className="h-full flex flex-col items-center justify-center text-txt-dim opacity-60">
                <Search size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-bold">Nenhum ícone encontrado</p>
                <p className="text-sm">Tente buscar por outro termo</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default IconPicker;