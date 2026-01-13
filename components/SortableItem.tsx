import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' as const : 'static' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-start gap-2 group ${isDragging ? 'opacity-50' : ''}`}>
      <button 
        type="button"
        className="mt-3 touch-none cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-1 rounded hover:bg-slate-800 transition-colors"
        {...attributes} 
        {...listeners}
      >
        <GripVertical size={20} />
      </button>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
