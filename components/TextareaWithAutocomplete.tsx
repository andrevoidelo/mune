import React, { useRef, useState, useMemo } from 'react';
import { WikiEntry, CustomCategory, Collection } from '../types';
import AutocompletePopup from './AutocompletePopup';
import { parseLinkedContent } from '../utils';
import { AtSign, Hash, Dices, Layers, Library } from 'lucide-react';

interface TextareaWithAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  entries: WikiEntry[];
  customCategories: CustomCategory[];
  collections?: Collection[];
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  autoResize?: boolean;
}

const TextareaWithAutocomplete: React.FC<TextareaWithAutocompleteProps> = ({ value, onChange, entries, customCategories, collections, placeholder, className, containerClassName, autoResize = true }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [autocomplete, setAutocomplete] = useState<{ 
    isOpen: boolean;
    type: 'mention' | 'tag' | 'collection';
    query: string;
    position: { top: number; left: number };
    startIndex: number;
  } | null>(null);
  
  // Highlight Generation
  const highlights = useMemo(() => {
    // We append a space if the value ends with a newline to ensure the line renders in the backdrop
    const textToParse = value.endsWith('\n') ? value + ' ' : value;
    
    return parseLinkedContent(textToParse, entries).parts.map((part, i) => {
        if (part.type === 'dice') return <span key={i} className="text-purple-400">[{part.value}]</span>;
        if (part.type === 'collection') return <span key={i} className="text-green-500">{"{" + part.value + "}"}</span>;
        if (part.type === 'mention') return <span key={i} className="text-primary">@{part.value}</span>;
        if (part.type === 'tag') return <span key={i} className="text-blue-400">#{part.value}</span>;
        if (part.type === 'bold') return <span key={i} className="text-primary">**{part.value}**</span>;
        return <span key={i}>{part.value}</span>;
    });
  }, [value, entries]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
        backdropRef.current.scrollTop = e.currentTarget.scrollTop;
        backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Helper: Get pixel position of caret in textarea
  const getCaretPosition = (textarea: HTMLTextAreaElement, charIndex: number): { top: number; left: number } => {
    // Create a mirror div to measure text
    const mirror = document.createElement('div');
    const style = getComputedStyle(textarea);
    
    // Copy relevant styles
    ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'padding', 'border', 'width', 'boxSizing'].forEach(prop => {
      mirror.style[prop as any] = style[prop as any];
    });
    
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.top = '0px';
    mirror.style.left = '0px';
    
    // Insert text up to caret with a span marker
    const textBeforeCaret = textarea.value.substring(0, charIndex);
    mirror.innerHTML = textBeforeCaret.replace(/\n/g, '<br>') + '<span id="caret">|</span>';
    
    document.body.appendChild(mirror);
    const caret = mirror.querySelector('#caret')!;
    
    const mirrorRect = mirror.getBoundingClientRect();
    const caretRect = caret.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    
    document.body.removeChild(mirror);
    
    // Calculate relative offset of caret within the text content
    const offsetTop = caretRect.top - mirrorRect.top;
    const offsetLeft = caretRect.left - mirrorRect.left;
    
    return {
      top: textareaRect.top + offsetTop - textarea.scrollTop + 24, // +24 approx line height/padding
      left: textareaRect.left + offsetLeft
    };
  };

  // Auto-resize textarea
  React.useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  // Detect @ or # or { triggers
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    
    // Look backwards from cursor to find @ or # or {
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([\p{L}0-9_]*)$/u);
    const tagMatch = textBeforeCursor.match(/#([\p{L}0-9_]*)$/u);
    const collectionMatch = textBeforeCursor.match(/\{([^}]*)$/); // Match open brace without close
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setAutocomplete({
        isOpen: true,
        type: 'mention',
        query,
        position: getCaretPosition(textareaRef.current!, cursorPos),
        startIndex: cursorPos - query.length - 1,  // -1 for @
      });
    } else if (tagMatch) {
      const query = tagMatch[1];
      setAutocomplete({
        isOpen: true,
        type: 'tag',
        query,
        position: getCaretPosition(textareaRef.current!, cursorPos),
        startIndex: cursorPos - query.length - 1,  // -1 for #
      });
    } else if (collectionMatch && collections) {
      const query = collectionMatch[1];
      setAutocomplete({
        isOpen: true,
        type: 'collection',
        query,
        position: getCaretPosition(textareaRef.current!, cursorPos),
        startIndex: cursorPos - query.length - 1, // -1 for {
      });
    } else {
      setAutocomplete(null);
    }
  };
  
  // Handle autocomplete selection
  const handleSelect = (suggestion: any) => {
    if (!autocomplete || !textareaRef.current) return;
    
    let prefix = '';
    let suffix = ' ';
    let insertText = '';

    if (autocomplete.type === 'mention') {
        prefix = '@';
        insertText = `${prefix}${suggestion.slug.replace(/\s/g, '_')}${suffix}`;
    } else if (autocomplete.type === 'tag') {
        prefix = '#';
        insertText = `${prefix}${suggestion.slug.replace(/\s/g, '_')}${suffix}`;
    } else if (autocomplete.type === 'collection') {
        // Check if the next character is a closing brace
        const nextChar = textareaRef.current.value.charAt(textareaRef.current.selectionEnd);
        const suffix = nextChar === '}' ? '' : '}';
        insertText = `{${suggestion.title}${suffix}`;
    }
    
    const before = value.slice(0, autocomplete.startIndex);
    const after = value.slice(textareaRef.current.selectionStart);
    
    const newValue = before + insertText + after;
    onChange(newValue);
    
    // Move cursor after inserted text
    const newCursorPos = autocomplete.startIndex + insertText.length;
    setTimeout(() => {
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      textareaRef.current?.focus();
    }, 0);
    
    setAutocomplete(null);
  };

  const insertAtCursor = (textToInsert: string, cursorOffset: number = 0) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const before = value.slice(0, start);
    const after = value.slice(end);
    
    const newValue = before + textToInsert + after;
    onChange(newValue);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + textToInsert.length + cursorOffset;
        textareaRef.current.setSelectionRange(newPos, newPos);
        
        // Manually trigger handleInput logic to check for autocomplete
        if (textToInsert.includes('{')) {
             // Force check
             const position = getCaretPosition(textareaRef.current, newPos);
             if (collections) {
                 setAutocomplete({
                    isOpen: true,
                    type: 'collection',
                    query: '',
                    position,
                    startIndex: start 
                 });
             }
        }
      }
    }, 0);
  };
  
  return (
    <div className={`relative w-full group flex flex-col gap-1 ${containerClassName || ''}`}>
      <div className="relative w-full flex-1">
        {/* Backdrop for Syntax Highlighting */}
        <div 
            ref={backdropRef}
            className={`absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-hidden rounded-b-lg pb-10 ${className}`}
            style={{ 
                color: 'rgb(var(--text-main))', 
                // Background and Border handled by className (visible on backdrop)
            }}
            aria-hidden="true"
        >
            {highlights}
            {value.endsWith('\n') && <br />} 
        </div>

        <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onScroll={handleScroll}
            placeholder={placeholder}
            className={`relative z-10 bg-transparent text-transparent caret-txt-main rounded-b-lg rounded-t-none pb-10 ${className}`}
            style={{ 
                color: 'transparent', 
                caretColor: 'rgb(var(--text-main))',
                backgroundColor: 'transparent',
                borderColor: 'transparent'
            }}
        />

        {/* Floating Toolbar */}
        <div className="absolute bottom-2 right-2 z-20 flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity bg-app/80 backdrop-blur-sm border border-border rounded-lg p-1 shadow-sm">
            <button 
            onClick={() => insertAtCursor('@')}
            className="p-1.5 hover:bg-card-hover rounded text-primary font-bold"
            title="Mencionar (@)"
            >
            <AtSign size={14} />
            </button>
            <button 
            onClick={() => insertAtCursor('#')}
            className="p-1.5 hover:bg-card-hover rounded text-blue-400 font-bold"
            title="Tag (#)"
            >
            <Hash size={14} />
            </button>
            <button 
            onClick={() => insertAtCursor('[]', -1)} 
            className="p-1.5 hover:bg-card-hover rounded text-purple-400"
            title="Dado ([])"
            >
            <Dices size={14} />
            </button>
            {collections && (
                <button 
                onClick={() => insertAtCursor('{}', -1)} 
                className="p-1.5 hover:bg-card-hover rounded text-green-500"
                title="Coleção ({})"
                >
                <Library size={14} />
                </button>
            )}
        </div>
      </div>
      
      {autocomplete?.isOpen && (
        <AutocompletePopup
          query={autocomplete.query}
          type={autocomplete.type}
          entries={entries}
          customCategories={customCategories}
          collections={collections}
          position={autocomplete.position}
          onSelect={handleSelect}
          onClose={() => setAutocomplete(null)}
        />
      )}
    </div>
  );
};

export default TextareaWithAutocomplete;
