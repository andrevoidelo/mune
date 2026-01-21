import React, { useRef, useState } from 'react';
import { WikiEntry, CustomCategory } from '../types';
import AutocompletePopup from './AutocompletePopup';

interface TextareaWithAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  entries: WikiEntry[];
  customCategories: CustomCategory[];
  placeholder?: string;
  className?: string;
}

const TextareaWithAutocomplete: React.FC<TextareaWithAutocompleteProps> = ({ value, onChange, entries, customCategories, placeholder, className }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [autocomplete, setAutocomplete] = useState<{ 
    isOpen: boolean;
    type: 'mention' | 'tag';
    query: string;
    position: { top: number; left: number };
    startIndex: number;  // Where the @ or # started
  } | null>(null);
  
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  // Detect @ or # triggers
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    
    // Look backwards from cursor to find @ or #
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@([\p{L}0-9_]*)$/u);
    const tagMatch = textBeforeCursor.match(/#([\p{L}0-9_]*)$/u);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      if (query.length >= 0) {
        setAutocomplete({
          isOpen: true,
          type: 'mention',
          query,
          position: getCaretPosition(textareaRef.current!, cursorPos),
          startIndex: cursorPos - query.length - 1,  // -1 for @
        });
      } else {
        setAutocomplete(null);
      }
    } else if (tagMatch) {
      const query = tagMatch[1];
      if (query.length >= 0) {
        setAutocomplete({
          isOpen: true,
          type: 'tag',
          query,
          position: getCaretPosition(textareaRef.current!, cursorPos),
          startIndex: cursorPos - query.length - 1,  // -1 for #
        });
      } else {
        setAutocomplete(null);
      }
    } else {
      setAutocomplete(null);
    }
  };
  
  // Handle autocomplete selection
  const handleSelect = (suggestion: any) => {
    if (!autocomplete || !textareaRef.current) return;
    
    const prefix = autocomplete.type === 'mention' ? '@' : '#';
    const insertText = `${prefix}${suggestion.slug.replace(/\s/g, '_')} `;
    
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
  
  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        placeholder={placeholder}
        className={className}
      />
      
      {autocomplete?.isOpen && (
        <AutocompletePopup
          query={autocomplete.query}
          type={autocomplete.type}
          entries={entries}
          customCategories={customCategories}
          position={autocomplete.position}
          onSelect={handleSelect}
          onClose={() => setAutocomplete(null)}
        />
      )}
    </div>
  );
};

export default TextareaWithAutocomplete;
