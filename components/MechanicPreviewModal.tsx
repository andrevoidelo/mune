import React from 'react';
import { X } from 'lucide-react';

interface MechanicPreviewModalProps {
  newLine: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const MechanicPreviewModal: React.FC<MechanicPreviewModalProps> = ({
  newLine,
  onConfirm,
  onCancel
}) => {
  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-card">
           <h3 className="text-sm font-bold uppercase tracking-wider text-txt-muted">Atualizar Entrada?</h3>
           <button 
             onClick={onCancel}
             className="text-txt-muted hover:text-txt-main bg-card-hover rounded-full p-1 transition-colors"
           >
             <X size={18} />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
           <div className="space-y-6">
              <div>
                 <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 text-base text-txt-main font-serif leading-relaxed shadow-sm">
                    {renderPreviewText(newLine)}
                 </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex gap-3">
           <button
             onClick={onCancel}
             className="flex-1 py-3 px-4 rounded-lg bg-card-hover hover:bg-border text-txt-muted font-bold text-sm transition-colors"
           >
             Cancelar
           </button>
           <button
             onClick={onConfirm}
             className="flex-1 py-3 px-4 rounded-lg bg-primary hover:bg-primary-hover text-on-primary font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
           >
             Atualizar
           </button>
        </div>
      </div>
    </div>
  );
};

// Helper to highlight changes (simple bolding for **text**)
const renderPreviewText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-primary font-bold bg-primary/10 px-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return <span key={index}>{part}</span>;
    });
};

export default MechanicPreviewModal;
