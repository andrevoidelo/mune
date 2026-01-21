import React, { useState, useRef, useMemo } from 'react';
import { WikiEntry, CustomCategory, DefaultCategory, WikiCategoryId } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { parseLinkedContent, getCategoryColor, createAutoEntry, generateSlug } from '../utils';
import TextareaWithAutocomplete from './TextareaWithAutocomplete';
import WikiLinkPreview from './WikiLinkPreview';
import DynamicIcon from './DynamicIcon';
import ImageEditorModal from './ImageEditorModal';
import { ImageIcon, Trash2, X, Upload, CheckSquare } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';

interface WikiEntryFormProps {
  initialData?: Partial<WikiEntry>;
  entries: WikiEntry[];
  customCategories: CustomCategory[];
  onSave: (data: Partial<WikiEntry>, newEntries?: WikiEntry[]) => void;
  onCancel: () => void;
}

const WikiEntryForm: React.FC<WikiEntryFormProps> = ({ 
  initialData, 
  entries, 
  customCategories, 
  onSave, 
  onCancel 
}) => {
  const { play } = useGameSound();
  const [formData, setFormData] = useState<Partial<WikiEntry>>({
    title: '',
    content: '',
    category: 'PERSONAGENS',
    tags: [],
    imageUrl: undefined,
    ...initialData
  });
  
  const [tagInput, setTagInput] = useState('');
  const [tempImage, setTempImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Check for duplicates
  const duplicateEntry = useMemo(() => {
    if (!formData.title?.trim()) return null;
    const currentSlug = generateSlug(formData.title);
    
    // Find existing entry with same slug
    const match = entries.find(e => e.slug === currentSlug);
    
    // If match found, and it's NOT the entry we are currently editing (by ID), it's a duplicate
    if (match && match.id !== formData.id) {
        return match;
    }
    return null;
  }, [formData.title, formData.id, entries]);

  const detectedLinks = useMemo(() => {
    if (!formData.content) return [];
    return parseLinkedContent(formData.content, entries).links.map(link => ({
      ...link,
      exists: !!link.entryId
    }));
  }, [formData.content, entries]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (newTag && !formData.tags?.includes(newTag)) {
        play('CLICK');
        setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    play('CLICK');
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  const allCategories: (DefaultCategory | CustomCategory)[] = [
    ...DEFAULT_CATEGORIES,
    ...customCategories
  ];

  const handleSave = () => {
    if (!formData.title?.trim() || duplicateEntry) return;
    play('CLICK');

    // Identify new entries to be created from content
    const newLinks = detectedLinks.filter(link => !link.exists);
    // Deduplicate titles
    const uniqueNewTitles = Array.from(new Set(newLinks.map(l => l.value.replace(/_/g, ' '))));
    
    let currentEntries = [...entries];
    const newWikiEntries: WikiEntry[] = [];
    
    uniqueNewTitles.forEach(title => {
        // Prevent creating an entry for itself if user self-referenced (though unlikely to be undefined if saving new)
        // But if editing, we might reference self? No, detectedLinks checks against 'entries' prop.
        // If we are creating a NEW entry, 'entries' doesn't contain it yet.
        // But the link existence check is against 'entries'.
        
        // Check if title matches current form title (self-reference)
        if (title.toLowerCase() === formData.title?.toLowerCase()) return;

        const newEntry = createAutoEntry(title, currentEntries);
        newWikiEntries.push(newEntry);
        currentEntries.push(newEntry);
    });

    onSave(formData, newWikiEntries);
  };

  return (
    <div className="h-full flex flex-col relative bg-app">
      {/* Persistent Form Header */}
      <div className="absolute top-0 left-0 right-0 z-30 p-4 flex justify-between items-center pointer-events-none">
          <button 
            type="button"
            onClick={() => { play('CLICK'); onCancel(); }}
            className="p-2 bg-black/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-black/60 shadow-lg pointer-events-auto transition-all active:scale-95"
          >
            <X size={24} />
          </button>
          
          <button 
            type="button"
            onClick={handleSave}
            disabled={!formData.title?.trim() || !!duplicateEntry}
            className="px-4 py-2 bg-success hover:bg-green-500 text-on-primary font-bold rounded-full shadow-lg pointer-events-auto flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckSquare size={18} /> Salvar
          </button>
      </div>

      <div className="flex-1 overflow-y-auto w-full pt-16">
        <div className="space-y-4 max-w-2xl mx-auto pb-24 p-4">
          
          {/* 1. Category Selector */}
          <div>
            <label className="text-sm text-txt-muted mb-2 block font-bold uppercase tracking-wider text-xs">Categoria</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {allCategories.map(cat => {
                const isSelected = formData.category === cat.id;
                const color = getCategoryColor(cat.id, customCategories);
                
                let selectedClass = '';
                if (isSelected) {
                    if (color === 'accent') selectedClass = 'bg-primary/20 text-txt-accent border-primary ring-1 ring-primary';
                    else if (color === 'primary') selectedClass = 'bg-primary/20 text-txt-accent border-primary ring-1 ring-primary';
                    else if (color === 'success') selectedClass = 'bg-success/20 text-success border-success ring-1 ring-success';
                    else if (color === 'warning') selectedClass = 'bg-yellow-500/20 text-yellow-500 border-yellow-500 ring-1 ring-yellow-500';
                    else if (color === 'error') selectedClass = 'bg-error/20 text-error border-error ring-1 ring-error';
                    else if (color === 'muted') selectedClass = 'bg-gray-500/20 text-gray-500 border-gray-500 ring-1 ring-gray-500';
                    else selectedClass = 'bg-primary/20 text-txt-accent border-primary ring-1 ring-primary';
                } else {
                    selectedClass = 'bg-card text-txt-muted border-border hover:bg-card-hover';
                }

                return (
                  <button
                    key={cat.id}
                    onClick={() => { play('CLICK'); setFormData(prev => ({ ...prev, category: cat.id as WikiCategoryId })); }}
                    className={`flex items-center justify-start gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors w-full ${selectedClass}`}
                  >
                    <DynamicIcon name={cat.icon} size={14} className="flex-none" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Title */}
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className={`text-sm block font-bold uppercase tracking-wider text-xs ${duplicateEntry ? 'text-error' : 'text-txt-muted'}`}>
                    Título
                </label>
                {duplicateEntry && (
                    <span className="text-[10px] font-bold text-error uppercase tracking-wider animate-pulse">
                        (ENTRADA JÁ EXISTE)
                    </span>
                )}
            </div>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título da entrada..."
              className={`w-full bg-app border rounded-xl px-4 py-3
                        text-txt-main placeholder-txt-dim outline-none focus:border-primary
                        text-lg font-bold ${duplicateEntry ? 'border-error focus:border-error' : 'border-border'}`}
            />
          </div>

          {/* 3. Image Upload Area */}
          <div 
            onClick={() => { play('CLICK'); imageInputRef.current?.click(); }}
            className="relative h-40 bg-app border border-dashed border-border rounded-lg overflow-hidden group cursor-pointer flex flex-col items-center justify-center gap-2"
          >
            {formData.imageUrl ? (
              <>
                <img src={formData.imageUrl} alt="Entry Image" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                <div className="relative z-10 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg border border-white/10">
                  <Upload size={16} /> Alterar Imagem
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); play('CLICK'); setFormData(prev => ({ ...prev, imageUrl: undefined })); }}
                  className="absolute top-2 right-2 p-2 bg-error/80 text-white rounded-full z-20 hover:bg-error transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <>
                <ImageIcon className="text-txt-dim group-hover:text-primary transition-colors" size={40} />
                <span className="text-sm font-bold text-txt-dim uppercase tracking-wider group-hover:text-primary transition-colors">Adicionar Imagem</span>
              </>
            )}
            <input 
              type="file" 
              ref={imageInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          {/* 4. Content with Link Preview */}
          <div className="relative">
            <TextareaWithAutocomplete
              value={formData.content || ''}
              onChange={val => setFormData(prev => ({ ...prev, content: val }))}
              entries={entries}
              customCategories={customCategories}
              placeholder="Escreva o conteúdo... Use @Nome para mencionar e #tag para categorizar."
              className="w-full bg-app border border-border rounded-xl p-4
                        text-txt-main placeholder-txt-dim outline-none focus:border-primary
                        min-h-[200px] font-serif leading-relaxed overflow-hidden"
            />

            {/* Detected Links Preview */}
            <WikiLinkPreview links={detectedLinks} />
          </div>

          {/* 5. Tags Input */}
          <div>
            <label className="text-sm text-txt-muted mb-2 block">Tags Ocultas</label>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Digite e pressione Espaço para inserir..."
              className="w-full bg-app border border-border rounded-lg px-3 py-2
                        text-txt-main placeholder-txt-dim outline-none focus:border-primary"
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.tags?.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-txt-accent rounded text-sm"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-error">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {tempImage && (
        <ImageEditorModal 
          imageSrc={tempImage}
          onCancel={() => { play('CLICK'); setTempImage(null); }}
          onSave={(cropped) => {
            play('CLICK');
            setFormData(prev => ({ ...prev, imageUrl: cropped }));
            setTempImage(null);
          }}
        />
      )}
    </div>
  );
};

export default WikiEntryForm;