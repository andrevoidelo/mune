import React, { useMemo } from 'react';
import { WikiEntry } from '../types';
import { parseLinkedContent, generateSlug } from '../utils';
import { Plus, Dices, Library } from 'lucide-react';

interface LinkedTextProps {
  content: string;
  entries: WikiEntry[];
  onMentionClick: (slug: string, existingEntryId?: string) => void;
  onTagClick: (tag: string, existingEntryId?: string) => void;
  onDiceClick?: (notation: string) => void;
  onCollectionClick?: (collectionName: string) => void;
  className?: string;
}

const LinkedText: React.FC<LinkedTextProps> = ({ 
  content, 
  entries, 
  onMentionClick, 
  onTagClick,
  onDiceClick,
  onCollectionClick,
  className = ""
}) => {
  // Parse @mentions and #tags
  const { parts } = useMemo(() => parseLinkedContent(content, entries), [content, entries]);

  return (
    <p className={`text-txt-main leading-relaxed whitespace-pre-wrap ${className}`}>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.value}</span>;
        }

        if (part.type === 'mention') {
          const exists = part.entryId != null;
          // Normalize the raw value to a slug for the click handler
          const slug = generateSlug(part.value);
          
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onMentionClick(slug, part.entryId);
              }}
              className={`inline-flex items-center px-1.5 py-0.5 rounded mx-0.5
                         transition-colors align-baseline ${
                exists
                  ? 'bg-primary/20 text-txt-accent hover:bg-primary/30'
                  : 'bg-error/10 text-error border border-dashed border-error/50 hover:bg-error/20'
              }`}
            >
              @{part.value.replace(/_/g, ' ')}
              {!exists && <Plus size="1em" className="ml-1" />}
            </button>
          );
        }

        if (part.type === 'tag') {
          // Normalize tag to slug for click handler
          const tagSlug = generateSlug(part.value);
          const exists = part.entryId != null;
          
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tagSlug, part.entryId);
              }}
              className={`inline-flex items-center px-1.5 py-0.5 rounded mx-0.5
                         transition-colors align-baseline ${
                exists
                  ? 'bg-primary/10 text-txt-accent hover:bg-primary/20'
                  : 'bg-error/10 text-error border border-dashed border-error/50 hover:bg-error/20'
              }`}
            >
              #{part.value.replace(/_/g, ' ')}
            </button>
          );
        }

        if (part.type === 'bold') {
            return <strong key={i} className="font-bold text-txt-main bg-primary/20 px-1 rounded">{part.value}</strong>;
        }

        if (part.type === 'dice') {
            return (
              <button 
                key={i}
                onClick={(e) => {
                   e.stopPropagation();
                   onDiceClick?.(part.value);
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded mx-0.5 transition-colors bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 cursor-pointer align-baseline"
                title={`Rolar ${part.value}`}
              >
                 <Dices size="1em" /> {part.value}
              </button>
            );
        }
        
        if (part.type === 'collection') {
            return (
              <button 
                key={i}
                onClick={(e) => {
                   e.stopPropagation();
                   onCollectionClick?.(part.value);
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded mx-0.5 transition-colors bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 cursor-pointer align-baseline"
                title={`Rolar Tabela: ${part.value}`}
              >
                 <Library size="1em" /> {part.value}
              </button>
            );
        }

        return null;
      })}
    </p>
  );
};

export default LinkedText;
