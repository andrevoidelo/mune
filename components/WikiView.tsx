import React, { useState, useMemo } from 'react';
import { WikiEntry, WikiCategoryId, CustomCategory, LogEntry } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';
import { 
    generateUUID, 
    generateSlug, 
    generateUniqueSlug,
    getCategoryColor, 
    createCustomCategory,
    deleteCustomCategory,
} from '../utils';
import WikiEntryCard from './WikiEntryCard';
import WikiEntryDetail from './WikiEntryDetail';
import WikiEntryForm from './WikiEntryForm';
import CreateCategoryModal from './CreateCategoryModal';
import EditCategoryModal from './EditCategoryModal';
import DynamicIcon from './DynamicIcon';
import { Search, Plus, Sparkles, X, BookOpen, Edit2 } from 'lucide-react';
import { useBackButton } from '../hooks/useBackButton';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { useGameSound } from '../hooks/useGameSound';

interface WikiViewProps {
  entries: WikiEntry[];
  setEntries: (entries: WikiEntry[]) => void;
  customCategories: CustomCategory[];
  setCustomCategories: (categories: CustomCategory[]) => void;
  addLog: (entry: LogEntry) => void;
  targetEntryId?: string | null;
  onClearTarget?: () => void;
  onUpdateReferences?: (oldSlug: string, newSlug: string) => void;
  logs?: LogEntry[]; // Add logs prop
}

type WikiViewMode = 'LIBRARY' | 'DETAIL' | 'FORM';

const WikiView: React.FC<WikiViewProps> = ({ 
    entries, 
    setEntries, 
    customCategories, 
    setCustomCategories, 
    addLog,
    targetEntryId,
    onClearTarget,
    onUpdateReferences,
    logs
}) => {
  const { play } = useGameSound();
  const [mode, setMode] = useState<WikiViewMode>('LIBRARY');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [creatingFromSlug, setCreatingFromSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<WikiCategoryId | 'ALL'>('ALL');
  
  // Handle external navigation target
  React.useEffect(() => {
    if (targetEntryId) {
        if (targetEntryId.startsWith('CREATE:')) {
            const slug = targetEntryId.replace('CREATE:', '');
            // Format slug to title (e.g. "passagem_secreta" -> "Passagem Secreta")
            const title = slug.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
            
            setSelectedEntryId(null);
            setCreatingFromSlug(slug);
            setFormData({
                title: title,
                content: '',
                category: filterCategory !== 'ALL' ? filterCategory : 'NOVO',
                tags: []
            });
            setMode('FORM');
            onClearTarget?.();
            return;
        }

        // Verify if entry exists
        const entry = entries.find(e => e.id === targetEntryId);
        if (entry) {
            setSelectedEntryId(targetEntryId);
            setCreatingFromSlug(null);
            setMode('DETAIL');
        }
        // Clear target to avoid stuck navigation if user navigates back manually
        onClearTarget?.();
    }
  }, [targetEntryId, entries, onClearTarget, filterCategory]);
  
  // Handle Back Button
  useBackButton(() => {
    if (mode === 'FORM') {
      if (selectedEntryId) {
          setMode('DETAIL');
      } else {
          setMode('LIBRARY');
      }
      setCreatingFromSlug(null);
      return true;
    }
    if (mode === 'DETAIL') {
      setMode('LIBRARY');
      setSelectedEntryId(null);
      return true;
    }
    return false;
  });
  
  // Form state
  const [formData, setFormData] = useState<Partial<WikiEntry>>({});
  
  // Modals
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);

  // Computed: all categories
  const allCategories = useMemo(() => [
    ...DEFAULT_CATEGORIES,
    ...customCategories,
  ], [customCategories]);

  // Computed: filtered entries
  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => filterCategory === 'ALL' || e.category === filterCategory)
      .filter(e =>
        searchQuery === '' ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [entries, filterCategory, searchQuery]);

  // Computed: count of unsorted entries
  const unsortedCount = useMemo(() => 
    entries.filter(e => e.category === 'NOVO').length,
  [entries]);
  
  const existingLabels = useMemo(() => 
    allCategories.map(c => c.label.toLowerCase()),
  [allCategories]);

  // Actions
  const handleCreateEntry = (title?: string) => {
      play('CLICK');
      setSelectedEntryId(null); // Ensure we are not editing an existing entry
      setCreatingFromSlug(null);
      
      // Determine default category based on current filter
      let defaultCategory: WikiCategoryId = 'NOVO';
      if (filterCategory !== 'ALL') {
          defaultCategory = filterCategory;
      }

      setFormData({
          title: title || '',
          content: '',
          category: defaultCategory,
          tags: []
      });
      setMode('FORM');
  };

  const handleEditEntry = (entry: WikiEntry) => {
      play('CLICK');
      setFormData(entry);
      setSelectedEntryId(entry.id);
      setCreatingFromSlug(null);
      setMode('FORM');
  };

  const handleSaveEntry = (data: Partial<WikiEntry>, newEntries: WikiEntry[] = []) => {
      play('CLICK');
      
      let updatedEntries = [...entries];
      
      // If there are auto-created entries, add them first
      if (newEntries.length > 0) {
          updatedEntries = [...newEntries, ...updatedEntries];
      }

      if (selectedEntryId) {
          // Update existing
          const originalEntry = entries.find(e => e.id === selectedEntryId);
          let newSlug = originalEntry?.slug || '';
          
          // Check for rename and update references
          if (originalEntry && data.title && data.title !== originalEntry.title) {
              const oldSlug = originalEntry.slug;
              // Generate new slug using the utility from utils (imported above)
              const otherSlugs = entries.filter(e => e.id !== selectedEntryId).map(e => e.slug);
              newSlug = generateUniqueSlug(data.title, otherSlugs);
              
              if (newSlug !== oldSlug && onUpdateReferences) {
                  onUpdateReferences(oldSlug, newSlug);
              }
          }

          setEntries(updatedEntries.map(e => 
              e.id === selectedEntryId 
              ? { ...e, ...data, slug: newSlug || e.slug, updatedAt: Date.now() } as WikiEntry
              : e
          ));
          setMode('DETAIL');
      } else {
          // Create new
          const existingSlugs = updatedEntries.map(e => e.slug); // Use updatedEntries to check collisions including new auto-entries
          const title = data.title || 'Sem Título';
          const newSlug = generateUniqueSlug(title, existingSlugs);
          
          // If we are creating from a broken link (creatingFromSlug) and the name changed, update references
          if (creatingFromSlug && creatingFromSlug !== newSlug && onUpdateReferences) {
              onUpdateReferences(creatingFromSlug, newSlug);
          }
          setCreatingFromSlug(null);

          const newEntry: WikiEntry = {
              id: generateUUID(),
              title,
              slug: newSlug,
              content: data.content || '',
              category: data.category || 'NOVO',
              tags: data.tags || [],
              imageUrl: data.imageUrl,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              isAutoCreated: false
          };
          setEntries([newEntry, ...updatedEntries]);
          setSelectedEntryId(newEntry.id);
          setMode('DETAIL');
      }
  };

  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const handleDeleteEntry = (entryId?: string) => {
      play('CLICK');
      // Use passed ID or selectedEntryId
      // If no ID is passed and no entry is selected, do nothing
      const id = entryId || selectedEntryId;
      if (id) {
          setEntryToDelete(id);
      }
  };

  const confirmDeleteEntry = () => {
      play('CLICK');
      if (entryToDelete) {
          setEntries(entries.filter(e => e.id !== entryToDelete));
          if (selectedEntryId === entryToDelete) {
              setMode('LIBRARY');
              setSelectedEntryId(null);
          }
          setEntryToDelete(null);
      }
  };

  const handleCreateCategory = (categoryData: Omit<CustomCategory, 'id' | 'createdAt'>) => {
      play('CLICK');
      const newCategory = createCustomCategory(categoryData.label, categoryData.icon, categoryData.color);
      setCustomCategories([...customCategories, newCategory]);
  };

  const handleUpdateCategory = (category: CustomCategory) => {
      play('CLICK');
      setCustomCategories(customCategories.map(c => c.id === category.id ? category : c));
  };

  const handleDeleteCategory = (categoryId: string) => {
      play('CLICK');
      const result = deleteCustomCategory(categoryId, entries, customCategories);
      setEntries(result.entries);
      setCustomCategories(result.customCategories);
      if (filterCategory === categoryId) {
          setFilterCategory('ALL');
      }
      setEditingCategory(null);
  };
  
  // Render logic to support persistent modals
  let content = null;

  if (mode === 'DETAIL' && selectedEntryId) {
      const entry = entries.find(e => e.id === selectedEntryId);
      if (!entry) {
          // If entry not found, fallback to library
          // Ideally use useEffect to switch mode but immediate return is safer for rendering
          content = null; 
      } else {
          content = (
            <WikiEntryDetail 
                entry={entry}
                entries={entries}
                customCategories={customCategories}
                logs={logs}
                onBack={() => { play('CLICK'); setMode('LIBRARY'); setSelectedEntryId(null); }}
                onEdit={() => handleEditEntry(entry)}
                onDelete={() => handleDeleteEntry(entry.id)}
                onNavigate={(id) => { play('CLICK'); setSelectedEntryId(id); }}
                onCreate={(title) => handleCreateEntry(title)}
            />
          );
      }
  } else if (mode === 'FORM') {
      content = (
          <WikiEntryForm 
              initialData={formData}
              entries={entries}
              customCategories={customCategories}
              onSave={handleSaveEntry}
              onCancel={() => {
                  play('CLICK');
                  if (selectedEntryId) setMode('DETAIL');
                  else setMode('LIBRARY');
                  setCreatingFromSlug(null);
              }}
          />
      );
  }

  // If no specific content mode, show LIBRARY
  if (!content && mode === 'LIBRARY') {
      content = (
        <div className="bg-app h-full flex flex-col landscape:flex-row overflow-hidden">
        {/* Fixed Header / Sidebar in Landscape */}
        <div className="p-4 pb-3 space-y-4 shrink-0 z-10 bg-app landscape:w-[280px] landscape:h-full landscape:overflow-y-auto landscape:border-r landscape:border-border landscape:pb-4">
            {/* Search & Actions */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-dim" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3
                                text-txt-main placeholder-txt-dim outline-none focus:border-primary"
                    />
                    {searchQuery && (
                        <button
                        onClick={() => { play('CLICK'); setSearchQuery(''); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-dim hover:text-txt-main"
                        >
                        <X size={18} />
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => handleCreateEntry()}
                    className="px-4 py-2 bg-card/50 border-2 border-dashed border-border hover:border-primary hover:text-primary text-txt-dim transition-all rounded-xl flex items-center justify-center font-bold whitespace-nowrap uppercase tracking-wider text-[10px]"
                >
                    <Plus size={16} className="mr-1" />
                    Nova
                </button>
            </div>
            
            {/* Unsorted Prompt */}
            {unsortedCount > 0 && filterCategory !== 'NOVO' && (
                <button
                    onClick={() => { play('CLICK'); setFilterCategory('NOVO'); }}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/30 text-txt-accent hover:bg-accent/20 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} />
                        <span className="text-sm font-medium">{unsortedCount} entradas novas não classificadas.</span>
                    </div>
                    <span className="text-sm underline">Organizar</span>
                </button>
            )}

            {/* Categories */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 landscape:grid-cols-1 gap-2">
                <button
                    onClick={() => { play('CLICK'); setFilterCategory('ALL'); }}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors w-full flex items-center justify-center ${
                        filterCategory === 'ALL'
                        ? 'bg-txt-main text-app border-txt-main font-bold' // High contrast for "All"
                        : 'bg-card text-txt-muted border-border hover:bg-card-hover'
                    }`}
                >
                    Todos
                </button>
                
                {allCategories.map(cat => {
                    const isActive = filterCategory === cat.id;
                    const color = getCategoryColor(cat.id, customCategories);
                    const count = entries.filter(e => e.category === cat.id).length;
                    
                    const handleContextMenu = (e: React.MouseEvent) => {
                        if (!cat.isDefault) {
                            e.preventDefault();
                            play('CLICK');
                            setEditingCategory(cat as CustomCategory);
                        }
                    };

                    // Map colors to tailwind classes carefully
                    let activeClass = '';
                    
                    if (isActive) {
                        if (color === 'accent') activeClass = 'bg-primary/20 text-txt-accent border-primary ring-1 ring-primary';
                        else if (color === 'primary') activeClass = 'bg-primary/20 text-txt-accent border-primary ring-1 ring-primary';
                        else if (color === 'success') activeClass = 'bg-success/20 text-success border-success ring-1 ring-success';
                        else if (color === 'warning') activeClass = 'bg-yellow-500/20 text-yellow-500 border-yellow-500 ring-1 ring-yellow-500';
                        else if (color === 'error') activeClass = 'bg-error/20 text-error border-error ring-1 ring-error';
                        else if (color === 'muted') activeClass = 'bg-gray-500/20 text-gray-500 border-gray-500 ring-1 ring-gray-500';
                        else activeClass = 'bg-primary/20 text-txt-accent border-primary ring-1 ring-primary';
                    } else {
                        activeClass = 'bg-card text-txt-muted border-border hover:bg-card-hover';
                    }

                    return (
                        <button
                        key={cat.id}
                        onClick={() => { play('CLICK'); setFilterCategory(cat.id as WikiCategoryId); }}
                        onContextMenu={handleContextMenu}
                        className={`flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors w-full ${activeClass}`}
                        >
                            <div className="flex items-center gap-1.5 min-w-0">
                                <DynamicIcon name={cat.icon} size={14} className="flex-none" />
                                <span className="truncate">{cat.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-none">
                                {isActive && !cat.isDefault && (
                                    <div 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            play('CLICK');
                                            setEditingCategory(cat as CustomCategory);
                                        }}
                                        className="p-1 -m-1 hover:bg-white/20 rounded transition-colors animate-in fade-in zoom-in duration-300"
                                        title="Editar Categoria"
                                    >
                                        <Edit2 size={12} className="text-current" />
                                    </div>
                                )}
                                <span className="opacity-60 text-xs">({count})</span>
                            </div>
                        </button>
                    );
                })}            
                <button
                    onClick={() => { play('CLICK'); setShowCreateCategoryModal(true); }}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 bg-card/50 border-2 border-dashed border-border text-txt-dim hover:border-primary hover:text-primary transition-all rounded-lg text-sm w-full"
                >
                    <Plus size={14} className="flex-none" />
                    <span className="truncate">Categoria</span>
                </button>
            </div>
        </div>
        
        {/* Scrollable Entries Grid */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 pb-20 pt-4">
            {filteredEntries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredEntries.map(entry => (
                        <WikiEntryCard
                            key={entry.id}
                            entry={entry}
                            customCategories={customCategories}
                            onClick={() => {
                                play('CLICK');
                                setSelectedEntryId(entry.id);
                                setMode('DETAIL');
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                    <BookOpen size={48} className="text-txt-dim mb-4" />
                    {searchQuery && (
                        <h3 className="text-lg font-bold text-txt-main mb-2">Nenhum resultado</h3>
                    )}
                    <p className="text-txt-muted max-w-xs">
                        {searchQuery 
                        ? `Não encontramos nada para "${searchQuery}"`
                        : 'Crie uma nova entrada para popular esta categoria'}
                    </p>
                </div>
            )}
        </div>
      </div>
      );
  }

  return (
    <>
      {content}

      {/* Modals are now rendered globally regardless of mode */}
      <CreateCategoryModal 
        isOpen={showCreateCategoryModal}
        onClose={() => { play('CLICK'); setShowCreateCategoryModal(false); }}
        onCreate={handleCreateCategory}
        existingLabels={existingLabels}
      />
      
      {editingCategory && (
          <EditCategoryModal 
            isOpen={true}
            category={editingCategory}
            onClose={() => { play('CLICK'); setEditingCategory(null); }}
            onSave={handleUpdateCategory}
            onDelete={handleDeleteCategory}
            existingLabels={existingLabels.filter(l => l !== editingCategory.label.toLowerCase())}
            entryCount={entries.filter(e => e.category === editingCategory.id).length}
          />
      )}

      {/* Delete Entry Modal */}
      <ConfirmDeleteModal 
        isOpen={!!entryToDelete}
        title="Excluir Entrada"
        description={
          <>
            Tem certeza que deseja excluir <strong>{entries.find(e => e.id === entryToDelete)?.title}</strong>?
            <br/>
            <span className="text-xs text-txt-dim mt-1 block">Links para esta entrada em logs e outras páginas continuarão existindo, mas apontarão para uma entrada inexistente.</span>
          </>
        }
        onConfirm={confirmDeleteEntry}
        onCancel={() => { play('CLICK'); setEntryToDelete(null); }}
      />
    </>
  );
};

export default WikiView;
