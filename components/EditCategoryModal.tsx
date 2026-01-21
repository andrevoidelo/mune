import React, { useState } from 'react';
import { CustomCategory } from '../types';
import { X, Trash2 } from 'lucide-react';
import DynamicIcon from './DynamicIcon';
import { useGameSound } from '../hooks/useGameSound';

interface EditCategoryModalProps {
  category: CustomCategory;
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: CustomCategory) => void;
  onDelete: (categoryId: string) => void;
  existingLabels: string[];
  entryCount: number;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  category,
  isOpen,
  onClose,
  onSave,
  onDelete,
  existingLabels,
  entryCount
}) => {
  const { play } = useGameSound();
  const [label, setLabel] = useState(category.label);
  const [selectedIcon, setSelectedIcon] = useState(category.icon);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const AVAILABLE_ICONS = [
    'shield', 'sword', 'scroll', 'castle', 'crown', 'wand', 'skull', 'star',
    'map', 'gem', 'drama', 'bug', 'zap', 'moon', 'sun', 'flame',
    'heart', 'eye', 'key', 'compass', 'anchor', 'feather', 'leaf', 'mountain'
  ];
  
  const isValid = label.trim() && (label.trim().toLowerCase() === category.label.toLowerCase() || !existingLabels.includes(label.trim().toLowerCase()));
  
  const handleSave = () => {
    if (!isValid) return;
    play('CLICK');
    onSave({
      ...category,
      label: label.trim(),
      icon: selectedIcon,
      color: 'primary',
    });
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-app border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <h3 className="font-bold text-lg text-txt-main">Editar Categoria</h3>
            <button onClick={() => { play('CLICK'); onClose(); }} className="p-1 hover:bg-card-hover rounded-full text-txt-muted">
                <X size={20} />
            </button>
        </div>
        
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Name */}
            <div>
                <label className="text-sm font-bold text-txt-muted mb-1 block">Nome</label>
                <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-txt-main focus:border-primary outline-none"
                />
                {!isValid && (
                    <p className="text-xs text-error mt-1">Essa categoria já existe.</p>
                )}
            </div>
            
            {/* Icons */}
            <div>
                <label className="text-sm font-bold text-txt-muted mb-2 block">Ícone</label>
                <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_ICONS.map(icon => (
                        <button
                            key={icon}
                            onClick={() => { play('CLICK'); setSelectedIcon(icon); }}
                            className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                                selectedIcon === icon 
                                    ? 'bg-primary text-on-primary' 
                                    : 'bg-card text-txt-muted hover:bg-card-hover'
                            }`}
                        >
                            <DynamicIcon name={icon} size={20} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Delete Zone */}
            <div className="pt-4 border-t border-border">
                {showDeleteConfirm ? (
                    <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                         <p className="text-sm text-error font-medium mb-2">
                            Tem certeza? {entryCount} entradas serão movidas para "Novo".
                         </p>
                         <div className="flex gap-2">
                             <button 
                                onClick={() => { play('CLICK'); onDelete(category.id); }}
                                className="px-3 py-1.5 bg-error text-white rounded text-sm font-bold"
                             >
                                 Sim, Excluir
                             </button>
                             <button 
                                onClick={() => { play('CLICK'); setShowDeleteConfirm(false); }}
                                className="px-3 py-1.5 bg-card border border-border text-txt-muted rounded text-sm"
                             >
                                 Cancelar
                             </button>
                         </div>
                    </div>
                ) : (
                    <button 
                        onClick={() => { play('CLICK'); setShowDeleteConfirm(true); }}
                        className="flex items-center gap-2 text-error hover:text-red-400 text-sm font-medium"
                    >
                        <Trash2 size={16} />
                        Excluir Categoria
                    </button>
                )}
            </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex justify-end gap-3">
            <button onClick={() => { play('CLICK'); onClose(); }} className="px-4 py-2 text-txt-muted hover:bg-card-hover rounded-lg">
                Cancelar
            </button>
            <button 
                onClick={handleSave}
                disabled={!isValid}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Salvar Alterações
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditCategoryModal;
