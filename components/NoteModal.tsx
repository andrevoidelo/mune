
import React, { useState, useRef, useMemo } from 'react';
import { X, Image as ImageIcon, Save, Trash2, PenTool, Sticker } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';
import IconPicker from './IconPicker';
import ImageEditorModal from './ImageEditorModal';

interface NoteModalProps {
  onClose: () => void;
  onSave: (text: string, image: string | undefined, icon: string | undefined, iconColor: string | undefined) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ onClose, onSave }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [icon, setIcon] = useState<string | undefined>(undefined);
  const [iconColor, setIconColor] = useState<string>('#ffffff');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { play } = useGameSound();

  const iconUrl = icon ? `/icons/${icon}.svg` : undefined;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSave = () => {
    if (!text.trim() && !image && !icon) return;
    onSave(text, image, icon, iconColor);
    onClose();
  };

  if (showIconPicker) {
    return (
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
                    selectedIcon={icon}
                    selectedColor={iconColor}
                    onSelect={(newIcon, newColor) => {
                        // Allow clearing icon (undefined or empty string)
                        setIcon(newIcon || undefined);
                        if (newColor) setIconColor(newColor);
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
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => { 
        // Prevent closing if image editor is open (though it should be on top)
        if (!tempImage) {
           play('CLICK'); 
           onClose(); 
        }
      }}
    >
      <div 
        className="w-full max-w-lg bg-card border border-border rounded-2xl p-4 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] sm:max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border flex-none">
           <h3 className="text-lg font-bold text-txt-main flex items-center gap-2">
             <PenTool className="text-primary" size={20} />
             Adicionar Nota
           </h3>
           <button 
             onClick={() => { play('CLICK'); onClose(); }}
             className="text-txt-muted hover:text-txt-main p-1 rounded-full hover:bg-card-hover"
           >
             <X size={24} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Descreva a cena, diálogos ou pensamentos..."
            className="w-full bg-app border border-border rounded-xl p-4 text-txt-main placeholder-txt-dim outline-none focus:border-primary h-40 sm:min-h-[150px] resize-none font-serif leading-relaxed text-lg"
          />

          {image && (
            <div className="mt-4 relative group rounded-xl overflow-hidden border border-border">
              <img src={image} alt="Preview" className="w-full h-auto object-cover max-h-60" />
              <button 
                onClick={() => { play('CLICK'); setImage(undefined); }}
                className="absolute top-2 right-2 bg-error/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4 pt-2 border-t border-border flex-none">
          <button
            onClick={() => { play('CLICK'); setShowIconPicker(true); }}
            className={`p-3 hover:bg-card-hover text-txt-muted hover:text-txt-main rounded-xl border border-border transition-colors ${icon ? 'bg-card-hover border-primary/50' : 'bg-card'}`}
            title="Selecionar Ícone"
          >
            {iconUrl ? (
                <div 
                    className="w-6 h-6"
                    style={{
                        backgroundColor: iconColor,
                        maskImage: `url("${iconUrl}")`,
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        maskSize: 'contain',
                        WebkitMaskImage: `url("${iconUrl}")`,
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        WebkitMaskSize: 'contain'
                    }}
                />
            ) : (
                <Sticker size={24} />
            )}
          </button>

          <button
            onClick={() => { play('CLICK'); fileInputRef.current?.click(); }}
            className="p-3 bg-card hover:bg-card-hover text-txt-muted hover:text-txt-main rounded-xl border border-border transition-colors"
            title="Adicionar Imagem"
          >
            <ImageIcon size={24} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleImageUpload} 
          />

          <button
            onClick={() => { play('CLICK'); handleSave(); }}
            disabled={!text.trim() && !image && !icon}
            className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:bg-card text-on-primary font-bold rounded-xl py-3 flex items-center justify-center gap-2 enabled:shadow-lg enabled:shadow-primary/20 active:translate-y-1 transition-all"
          >
            <Save size={20} /> Salvar no Log
          </button>
        </div>
      </div>

      {tempImage && (
        <ImageEditorModal 
          imageSrc={tempImage}
          onCancel={() => setTempImage(null)}
          onSave={(cropped) => {
            setImage(cropped);
            setTempImage(null);
          }}
        />
      )}
    </div>
  );
};

export default NoteModal;
