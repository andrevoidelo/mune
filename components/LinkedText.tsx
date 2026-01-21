import React, { useMemo } from 'react';
import { WikiEntry } from '../types';
import { parseLinkedContent, generateSlug } from '../utils';
import { Plus } from 'lucide-react';

interface LinkedTextProps {
  content: string;
  entries: WikiEntry[];
  onMentionClick: (slug: string, existingEntryId?: string) => void;
  onTagClick: (tag: string, existingEntryId?: string) => void;
  className?: string;
}

const LinkedText: React.FC<LinkedTextProps> = ({ 
  content, 
  entries, 
  onMentionClick, 
  onTagClick,
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
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-sm font-medium mx-0.5
                         transition-colors align-baseline ${
                exists
                  ? 'bg-primary/20 text-txt-accent hover:bg-primary/30'
                  : 'bg-error/10 text-error border border-dashed border-error/50 hover:bg-error/20'
              }`}
            >
              @{part.value.replace(/_/g, ' ')}
              {!exists && <Plus size={12} className="ml-1" />}
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
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-sm mx-0.5
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

        return null;
      })}
    </p>
  );
};

export default LinkedText;
