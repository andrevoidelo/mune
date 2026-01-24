import React from 'react';
import { Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';

interface ImageUploadAreaProps {
  imageUrl?: string;
  onUpload: () => void;
  onClear: () => void;
  heightClass?: string; // e.g. "h-40"
  placeholderText?: string;
}

const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({ 
  imageUrl, 
  onUpload, 
  onClear, 
  heightClass = "h-40",
  placeholderText = "Adicionar Imagem"
}) => {
  const { play } = useGameSound();

  return (
    <div 
      onClick={() => { play('CLICK'); onUpload(); }}
      className={`relative ${heightClass} w-full bg-app border border-dashed border-border rounded-lg overflow-hidden group cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors hover:border-primary/50`}
    >
      {imageUrl ? (
        <>
          <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
          <div className="relative z-10 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg border border-white/10 backdrop-blur-sm">
            <Upload size={16} /> Alterar Imagem
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); play('CLICK'); onClear(); }}
            className="absolute bottom-2 right-2 p-2 bg-error/80 text-white rounded-full z-20 hover:bg-error transition-colors shadow-lg"
            title="Remover Imagem"
          >
            <Trash2 size={16} />
          </button>
        </>
      ) : (
        <>
          <ImageIcon className="text-txt-dim group-hover:text-primary transition-colors" size={40} />
          <span className="text-sm font-bold text-txt-dim uppercase tracking-wider group-hover:text-primary transition-colors">{placeholderText}</span>
        </>
      )}
    </div>
  );
};

export default ImageUploadArea;