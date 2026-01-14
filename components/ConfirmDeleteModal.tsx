import React from 'react';
import { Trash2, X } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ 
  isOpen, 
  title, 
  description, 
  confirmLabel = "Sim, excluir", 
  cancelLabel = "Cancelar",
  onConfirm, 
  onCancel 
}) => {
  const { play } = useGameSound();

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => { play('CLICK'); onCancel(); }}
    >
      <div 
        className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button 
          type="button"
          onClick={() => { play('CLICK'); onCancel(); }}
          className="absolute top-4 right-4 text-txt-muted hover:text-txt-main"
        >
          <X size={20} />
        </button>
        
        <h3 className="text-lg font-bold text-txt-main mb-3 flex items-center gap-2">
          <Trash2 size={20} className="text-error" />
          {title}
        </h3>
        
        {description && (
          <div className="text-txt-muted mb-6 text-sm leading-relaxed">
            {description}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={() => { play('CLICK'); onCancel(); }}
            className="flex-1 px-4 py-3 bg-card-hover hover:bg-border text-txt-main rounded-lg font-bold text-sm transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { play('CLICK'); onConfirm(); }}
            className="flex-1 px-4 py-3 bg-error hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-error/20"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
