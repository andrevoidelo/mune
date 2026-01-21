import React, { useMemo } from 'react';
import { WikiEntry, CustomCategory, LogEntry } from '../types';
import { getCategoryColor, getCategoryIcon, parseLinkedContent, generateSlug } from '../utils';
import LinkedText from './LinkedText';
import DynamicIcon from './DynamicIcon';
import { Trash2, Edit2, X, ScrollText, BookOpen } from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';

interface WikiEntryDetailProps {
  entry: WikiEntry;
  entries: WikiEntry[];
  customCategories: CustomCategory[];
  logs?: LogEntry[]; // Optional logs prop
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNavigate: (entryId: string) => void;
  onCreate: (title: string) => void;
}

const WikiEntryDetail: React.FC<WikiEntryDetailProps> = ({
  entry,
  entries,
  customCategories,
  logs,
  onBack,
  onEdit,
  onDelete,
  onNavigate,
  onCreate
}) => {
  const { play } = useGameSound();
  const categoryColor = getCategoryColor(entry.category, customCategories);
  const categoryIcon = getCategoryIcon(entry.category, customCategories);

  const backlinks = useMemo(() => {
    return entries.filter(e => {
      if (e.id === entry.id) return false;
      const { links } = parseLinkedContent(e.content, entries);
      return links.some(link =>
        link.entryId === entry.id ||
        link.value.toLowerCase() === entry.slug
      );
    });
  }, [entries, entry]);

  const relatedLogs = useMemo(() => {
    if (!logs) return [];
    
    // Sort logs by timestamp (newest first)
    const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);

    return sortedLogs.filter(log => {
       // Check result text
       const resultLinks = parseLinkedContent(log.result, entries).links;
       const matchResult = resultLinks.some(link => 
           link.entryId === entry.id || generateSlug(link.value) === entry.slug
       );
       if (matchResult) return true;

       // Check details text
       if (log.details) {
           const detailsLinks = parseLinkedContent(log.details, entries).links;
           if (detailsLinks.some(link => 
               link.entryId === entry.id || generateSlug(link.value) === entry.slug
           )) return true;
       }
       
       return false;
    });
  }, [logs, entry.id, entry.slug, entries]);

  const headerContent = (
    <>
        <button 
        onClick={() => { play('CLICK'); onBack(); }} 
        className="p-2 bg-black/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-black/60 shadow-lg transition-all active:scale-95"
        >
        <X size={24} />
        </button>
        <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-txt-muted">
                <DynamicIcon name={categoryIcon} size={14} className={`text-${categoryColor}`} />
                <span className="uppercase tracking-wider font-bold text-xs">
                    {customCategories.find(c => c.id === entry.category)?.label || 
                    (entry.category === 'NOVO' ? 'Novo' : entry.category)}
                </span>
            </div>
        </div>
        <div className="flex gap-2">
        <button 
            onClick={() => { play('CLICK'); onEdit(); }} 
            className="p-2 bg-primary/40 backdrop-blur-md rounded-full text-on-primary hover:bg-primary/60 shadow-lg transition-all active:scale-95"
        >
            <Edit2 size={24} />
        </button>
        <button 
            onClick={() => { play('CLICK'); onDelete(); }} 
            className="p-2 bg-error/40 backdrop-blur-md rounded-full text-slate-100 hover:bg-error/60 shadow-lg transition-all active:scale-95"
        >
            <Trash2 size={24} />
        </button>
        </div>
    </>
  );

  return (
    <div className="bg-app h-full flex flex-col overflow-hidden">
      {/* Portrait Header (Fixed at top of screen) */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-app/95 backdrop-blur z-20 shrink-0 landscape:hidden">
        {headerContent}
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 flex flex-col landscape:flex-row overflow-y-auto landscape:overflow-hidden">
        {/* Left Panel (Info) */}
        <div className="w-full landscape:w-[400px] shrink-0 landscape:h-full landscape:overflow-y-auto landscape:border-r landscape:border-border bg-app">
            {/* Landscape Header (Sticky inside sidebar) */}
            <div className="hidden landscape:flex items-center gap-4 p-4 border-b border-border bg-app/95 backdrop-blur sticky top-0 z-10">
                {headerContent}
            </div>

            {/* Title & Image */}
            <div className="p-4 space-y-6">
                <h1 className="text-3xl font-bold text-txt-main">{entry.title}</h1>
                
                {entry.imageUrl && (
                    <img 
                        src={entry.imageUrl} 
                        alt={entry.title} 
                        className="w-full h-auto object-cover rounded-xl border border-border shadow-sm max-h-[400px]"
                    />
                )}
            </div>
        </div>

        {/* Right Panel (Content & Details) */}
        <div className="w-full landscape:flex-1 landscape:h-full landscape:overflow-y-auto bg-app">
            <div className="max-w-3xl mx-auto p-4 landscape:p-8 space-y-6">
                {/* Content */}
                <div className="prose prose-invert max-w-none">
                    <LinkedText 
                        content={entry.content} 
                        entries={entries} 
                        onMentionClick={(slug, id) => {
                            play('CLICK');
                            if (id) onNavigate(id);
                            else {
                                const title = slug.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                                onCreate(title);
                            }
                        }}
                        onTagClick={(slug, id) => {
                            play('CLICK');
                            if (id) onNavigate(id);
                            else {
                                const title = slug.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                                onCreate(title);
                            }
                        }}
                        className="text-lg leading-relaxed text-txt-main"
                    />
                </div>
                
                {/* Tags */}
                {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                        {entry.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-card border border-border rounded-full text-sm text-txt-muted">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
                
                {/* Backlinks */}
                {backlinks.length > 0 && (
                    <div className="pt-6 border-t border-border">
                        <h3 className="text-sm font-bold text-txt-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                            <BookOpen size={16} /> REFERÊNCIAS ({backlinks.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {backlinks.map(backlink => (
                                <button 
                                    key={backlink.id}
                                    onClick={() => { play('CLICK'); onNavigate(backlink.id); }}
                                    className="text-left p-3 rounded-lg bg-card border border-border hover:bg-card-hover transition-colors"
                                >
                                    <div className="font-medium text-txt-main">{backlink.title}</div>
                                    <div className="text-xs text-txt-muted mt-1 truncate">{backlink.content}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Log References */}
                {relatedLogs.length > 0 && (
                    <div className="pt-6 border-t border-border">
                        <h3 className="text-sm font-bold text-txt-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ScrollText size={16} /> Logs ({relatedLogs.length})
                        </h3>
                        <div className="space-y-2">
                            {relatedLogs.map(log => (
                                <div 
                                    key={log.id}
                                    className="p-3 rounded-lg bg-card border border-border"
                                >
                                    <div className="flex justify-between text-[10px] text-txt-muted mb-1 uppercase font-bold tracking-wider">
                                        <span className="flex items-center gap-2">
                                            <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                                            <span className="opacity-50">•</span>
                                            <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </span>
                                        <span>{log.type}</span>
                                    </div>
                                    <div className="text-sm text-txt-main">
                                        <LinkedText 
                                            content={log.result}
                                            entries={entries}
                                            onMentionClick={(slug, id) => {
                                                play('CLICK');
                                                if (id) {
                                                    if (id !== entry.id) onNavigate(id);
                                                } else {
                                                    // Format slug to title (e.g. "passagem_secreta" -> "Passagem Secreta")
                                                    const title = slug.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                                                    onCreate(title);
                                                }
                                            }}
                                            onTagClick={(slug, id) => {
                                                play('CLICK');
                                                if (id) {
                                                    if (id !== entry.id) onNavigate(id);
                                                } else {
                                                    const title = slug.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                                                    onCreate(title);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WikiEntryDetail;
