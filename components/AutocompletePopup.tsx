import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WikiEntry, WikiCategoryId, CustomCategory, Collection } from '../types';
import { generateSlug, getCategoryColor, getCategoryIcon } from '../utils';
import { Plus, Layers } from 'lucide-react';
import DynamicIcon from './DynamicIcon';

interface AutocompleteSuggestion {
  id: string;
  title: string;
  slug: string;
  category: WikiCategoryId | 'COLLECTION';
  type: 'entry' | 'tag' | 'create' | 'collection';
}

interface AutocompletePopupProps {
  query: string;                    // Current search text (without @ or #)
  type: 'mention' | 'tag' | 'collection';
  entries: WikiEntry[];
  customCategories: CustomCategory[];
  collections?: Collection[];
  position: { top: number; left: number };  // Position relative to textarea
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  onClose: () => void;
}

const AutocompletePopup: React.FC<AutocompletePopupProps> = ({
  query,
  type,
  entries,
  customCategories,
  collections,
  position,
  onSelect,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Filter suggestions based on query
  const suggestions = useMemo(() => {
    const normalizedQuery = query.toLowerCase().replace(/_/g, ' ');
    
    let matches: AutocompleteSuggestion[] = [];
    
    if (type === 'collection' && collections) {
        matches = collections
        .filter(c => c.id !== 'built-in-visual-portent' && c.id !== 'built-in-deck' && c.id !== 'built-in-portent')
        .filter(c => c.title.toLowerCase().includes(normalizedQuery))
        .slice(0, 5)
        .map(c => ({
            id: c.id,
            title: c.title,
            slug: c.title,
            category: 'COLLECTION',
            type: 'collection'
        }));
    } else if (type === 'mention') {
      // Search all entries by title/slug
      matches = entries
        .filter(e => 
          e.title.toLowerCase().includes(normalizedQuery) ||
          e.slug.includes(normalizedQuery.replace(/\s/g, '_'))
        )
        .slice(0, 5)
        .map(e => ({
          id: e.id,
          title: e.title,
          slug: e.slug,
          category: e.category,
          type: 'entry' as const,
        }));
    } else if (type === 'tag') {
      // Search tags across all entries AND entry titles (since #EntrySlug is valid)
      const allTags = new Set<string>();
      entries.forEach(e => {
          e.tags.forEach(t => allTags.add(t));
          // Also add entry title as a potential tag source? 
          // If we want #Name to auto-complete "Name", we should add it.
          // But titles can be long. Maybe just search entries directly below.
      });
      
      // Matches from Tags
      matches = Array.from(allTags)
        .filter(t => t.toLowerCase().includes(normalizedQuery))
        .map(t => ({
          id: `tag-${t}`,
          title: t,
          slug: generateSlug(t),
          category: 'NOTAS' as WikiCategoryId,
          type: 'tag' as const,
        }));

      // Matches from Entries (treated as tags)
      const entryMatches = entries
        .filter(e => 
            e.title.toLowerCase().includes(normalizedQuery) ||
            e.slug.includes(normalizedQuery.replace(/\s/g, '_'))
        )
        .map(e => ({
            id: `entry-tag-${e.id}`,
            title: e.title, // Use title, will be slugified on select
            slug: e.slug,
            category: e.category,
            type: 'tag' as const
        }));
      
      // Merge and Deduplicate by slug
      const combined = [...matches, ...entryMatches];
      const unique = new Map();
      combined.forEach(item => {
          if (!unique.has(item.slug)) unique.set(item.slug, item);
      });
      
      matches = Array.from(unique.values()).slice(0, 5);
    }
    
    // Add "Create new" option if query doesn't exactly match (ONLY for mentions/tags)
    const exactMatch = matches.some(m => 
      m.title.toLowerCase() === normalizedQuery ||
      m.slug === normalizedQuery.replace(/\s/g, '_')
    );
    
    if (!exactMatch && query.length > 0 && type !== 'collection') {
      matches.push({
        id: 'create-new',
        title: query.replace(/_/g, ' '),
        slug: generateSlug(query),
        category: 'NOVO',
        type: 'create',
      });
    }
    
    return matches;
  }, [query, type, entries, collections]);
  
  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only capture if we have suggestions
      if (suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          e.stopPropagation();
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
      }
    };
    
    // Use capture to intervene before textarea handles it
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [suggestions, selectedIndex, onSelect, onClose]);
  
  if (suggestions.length === 0) return null;
  
  return createPortal(
    <div
      className="fixed z-[9999] bg-card border border-border rounded-lg shadow-2xl
                 max-h-64 overflow-y-auto min-w-[200px] max-w-[300px]"
      style={{ top: position.top, left: position.left }}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion.id}
          onClick={() => onSelect(suggestion)}
          className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
            index === selectedIndex
              ? 'bg-primary/20 text-txt-main'
              : 'text-txt-muted hover:bg-card-hover'
          }`}
        >
          {suggestion.type === 'create' ? (
            <>
              <Plus size={16} className="text-txt-dim" />
              <span className="truncate">Criar "{suggestion.title}"</span>
            </>
          ) : suggestion.type === 'collection' ? (
            <>
              <Layers size={16} className="text-primary" />
              <span className="truncate">{suggestion.title}</span>
            </>
          ) : (
            <>
              <DynamicIcon 
                name={getCategoryIcon(suggestion.category as WikiCategoryId, customCategories)} 
                size={16} 
                className={`text-${getCategoryColor(suggestion.category as WikiCategoryId, customCategories)}`}
              />
              <span className="truncate">{suggestion.title}</span>
            </>
          )}
        </button>
      ))}
    </div>,
    document.body
  );
};

export default AutocompletePopup;
