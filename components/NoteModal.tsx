
import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Save, Trash2, PenTool } from 'lucide-react';

interface NoteModalProps {
  onClose: () => void;
  onSave: (text: string, image: string | undefined) => void;
}

const NoteModal: React.FC<NoteModalProps> = ({ onClose, onSave }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!text.trim() && !image) return;
    onSave(text, image);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] sm:max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800 flex-none">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <PenTool className="text-amber-500" size={20} />
             Adicionar Nota
           </h3>
           <button 
             onClick={onClose}
             className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800"
           >
             <X size={24} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Descreva a cena, diálogos ou pensamentos..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-100 placeholder-slate-500 outline-none focus:border-amber-500 h-40 sm:min-h-[150px] resize-none font-serif leading-relaxed text-lg"
          />

          {image && (
            <div className="mt-4 relative group rounded-xl overflow-hidden border border-slate-700">
              <img src={image} alt="Preview" className="w-full h-auto object-cover max-h-60" />
              <button 
                onClick={() => setImage(undefined)}
                className="absolute top-2 right-2 bg-red-900/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4 pt-2 border-t border-slate-800 flex-none">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
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
            onClick={handleSave}
            disabled={!text.trim() && !image}
            className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:bg-slate-800 text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:translate-y-1 transition-all"
          >
            <Save size={20} /> Salvar no Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;
