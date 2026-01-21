import React from 'react';
import { WikiEntry, CustomCategory } from '../types';
import { getCategoryColor, getCategoryIcon } from '../utils';
import DynamicIcon from './DynamicIcon';
import { useGameSound } from '../hooks/useGameSound';

interface WikiEntryCardProps {
  entry: WikiEntry;
  customCategories: CustomCategory[];
  onClick: () => void;
}

const WikiEntryCard: React.FC<WikiEntryCardProps> = ({ entry, customCategories, onClick }) => {
  const { play } = useGameSound();
  const categoryColor = getCategoryColor(entry.category, customCategories);
  const categoryIcon = getCategoryIcon(entry.category, customCategories);

  return (
    <button
      onClick={() => { play('CLICK'); onClick(); }}
      className="w-full text-left p-4 bg-card border border-border rounded-xl
                 hover:bg-card-hover active:bg-card-hover transition-colors flex items-start gap-3"
    >
      {/* Category Icon */}
      <div className={`p-2 rounded-lg bg-${categoryColor}/20 text-${categoryColor} shrink-0`}>
        <DynamicIcon name={categoryIcon} size={20} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-txt-main truncate">{entry.title}</h3>
          {/* Badge for unsorted entries */}
          {entry.category === 'NOVO' && (
            <span className="text-xs px-1.5 py-0.5 bg-accent/20 text-txt-accent rounded whitespace-nowrap">
              Novo
            </span>
          )}
        </div>
        <p className="text-sm text-txt-muted line-clamp-2 mt-1 break-words">
          {entry.content ? entry.content.substring(0, 100) : "Sem conteúdo..."}
        </p>

        {/* Tags Preview */}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-primary/20 text-txt-accent rounded truncate max-w-[100px]">
                #{tag}
              </span>
            ))}
            {entry.tags.length > 3 && (
              <span className="text-xs text-txt-dim">+{entry.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail */}
      {entry.imageUrl && (
        <img
          src={entry.imageUrl}
          alt=""
          className="w-20 h-20 rounded-lg object-cover bg-app shrink-0"
        />
      )}
    </button>
  );
};

export default WikiEntryCard;
