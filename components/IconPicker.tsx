import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';

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
  const [color, setColor] = useState(selectedColor);
  const [icons, setIcons] = useState<IconData[]>([]);
  const [loading, setLoading] = useState(true);

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
  
  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (loading) return [];
    if (!search.trim()) return icons.slice(0, 100); // Show first 100 if no search
    const lowerSearch = search.toLowerCase();
    return icons.filter(icon => 
      icon.name.toLowerCase().includes(lowerSearch) || 
      icon.filename.toLowerCase().includes(lowerSearch)
    );
  }, [search, icons, loading]);

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
    <div className="flex flex-col h-full max-h-[600px]">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar ícones..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-txt-main placeholder-txt-dim focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-card-hover rounded-full text-txt-muted hover:text-txt-main"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 border-b border-border bg-app/50">
        <label className="text-xs text-txt-muted uppercase font-bold tracking-wider mb-2 block">Cor do Ícone</label>
        <div className="flex flex-wrap gap-2 items-center">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-txt-main scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
          <div className="w-px h-8 bg-border mx-2"></div>
          <input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            title="Custom Color"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-app">
        {loading ? (
            <div className="text-center py-8 text-txt-dim">Carregando ícones...</div>
        ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                <button
                    onClick={() => onSelect(undefined, undefined)} 
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border border-border hover:bg-card-hover transition-colors ${!selectedIcon ? 'bg-card border-primary ring-1 ring-primary' : 'bg-app'}`}
                >
                    <span className="text-xs text-txt-muted">Nenhum</span>
                </button>
            
            {filteredIcons.map((icon) => {
                const isSelected = selectedIcon === icon.filename;
                return (
                <button
                    key={icon.filename}
                    onClick={() => handleIconSelect(icon.filename)}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center p-2 border transition-all ${isSelected ? 'bg-card border-primary ring-1 ring-primary' : 'bg-app border-border hover:border-txt-muted hover:bg-card-hover'}`}
                    title={icon.name}
                >
                    {/* We use mask to color the icon */}
                    <div 
                        className="w-full h-full"
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
                    {isSelected && (
                        <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                            <Check size={10} className="text-on-primary" />
                        </div>
                    )}
                </button>
                );
            })}
            </div>
        )}
        
        {!loading && filteredIcons.length === 0 && (
            <div className="text-center py-8 text-txt-dim">
                Nenhum ícone encontrado para "{search}"
            </div>
        )}
      </div>
    </div>
  );
};

export default IconPicker;