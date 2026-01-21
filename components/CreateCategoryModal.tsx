import React, { useState } from 'react';
import { CustomCategory } from '../types';
import { X } from 'lucide-react';
import DynamicIcon from './DynamicIcon';
import { useGameSound } from '../hooks/useGameSound';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (category: Omit<CustomCategory, 'id' | 'createdAt'>) => void;
  existingLabels: string[];
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  existingLabels
}) => {
  const { play } = useGameSound();
  const [label, setLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shield');
  
  const AVAILABLE_ICONS = [
    'shield', 'sword', 'scroll', 'castle', 'crown', 'wand', 'skull', 'star',
    'map', 'gem', 'drama', 'bug', 'zap', 'moon', 'sun', 'flame',
    'heart', 'eye', 'key', 'compass', 'anchor', 'feather', 'leaf', 'mountain'
  ];
  
  const isValid = label.trim() && !existingLabels.includes(label.trim().toLowerCase());
  
  const handleCreate = () => {
    if (!isValid) return;
    play('CLICK');
    onCreate({
      label: label.trim(),
      icon: selectedIcon,
      color: 'primary',
      isDefault: false,
    });
    setLabel('');
    setSelectedIcon('shield');
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-app border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <h3 className="font-bold text-lg text-txt-main">Nova Categoria</h3>
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
                    placeholder="Ex: Facções, Magias..."
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-txt-main focus:border-primary outline-none"
                />
                {existingLabels.includes(label.trim().toLowerCase()) && (
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
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex justify-end gap-3">
            <button onClick={() => { play('CLICK'); onClose(); }} className="px-4 py-2 text-txt-muted hover:bg-card-hover rounded-lg">
                Cancelar
            </button>
            <button 
                onClick={handleCreate}
                disabled={!isValid}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Criar Categoria
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryModal;
