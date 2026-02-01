import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, WikiEntry } from '../types';
import { Trash2, Clock, X, StickyNote, Printer, Calendar, FileDown, ArrowDown, Download, Search } from 'lucide-react';
import { exportLogsToMarkdown } from '../utils';
import { useGameSound } from '../hooks/useGameSound';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { exportTextFile, isNativePlatform, exportPdfFile } from '../utils/exportUtils';
import { downloadLogPdf, generateLogPdfBase64 } from '../utils/pdfGenerator';
import LinkedText from './LinkedText';

interface LogViewProps {
  logs: LogEntry[];
  adventureName?: string;
  clearLogs: () => void;
  removeLog: (id: string) => void;
  isActive: boolean;
  wikiEntries?: WikiEntry[];
  onNavigateToWiki?: (entryId: string | null, createSlug?: string) => void;
  targetLogId?: string | null;
  onClearTargetLog?: () => void;
  onLogRead?: (timestamp: number) => void;
  lastLogViewedAt?: number;
}

const TYPE_LABELS: Record<string, string> = {
  ORACLE: 'ORÁCULO',
  INTERVENTION: 'INTERVENÇÃO',
  DICE: 'DADOS',
  GENERATOR: 'GERADOR',
  ATTRIBUTE: 'ATRIBUTO',
  ITEM: 'ITEM',
  NOTE: 'DIÁRIO',
  DRAW: 'BARALHO'
};

const LogView: React.FC<LogViewProps> = ({ 
  logs, 
  adventureName, 
  clearLogs, 
  removeLog, 
  isActive, 
  wikiEntries, 
  onNavigateToWiki,
  targetLogId,
  onClearTargetLog,
  onLogRead,
  lastLogViewedAt
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const logRefs = useRef<Map<string, HTMLDivElement>>(new Map()); // Ref map for logs
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);

  const prevLogsLength = useRef(logs.length);
  const { play } = useGameSound();

  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    const matchesTitle = log.title?.toLowerCase().includes(query);
    const matchesResult = log.result?.toLowerCase().includes(query);
    const matchesDetails = log.details?.toLowerCase().includes(query);
    const matchesType = TYPE_LABELS[log.type]?.toLowerCase().includes(query);
    
    return matchesTitle || matchesResult || matchesDetails || matchesType;
  });
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Scroll to target log
  useEffect(() => {
    if (isActive && targetLogId) {
        // Wait a tick for rendering
        setTimeout(() => {
            const element = logRefs.current.get(targetLogId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHighlightedLogId(targetLogId);
                
                // Remove highlight after animation
                setTimeout(() => {
                    setHighlightedLogId(null);
                    onClearTargetLog?.();
                }, 1500);
            }
        }, 100);
    }
  }, [isActive, targetLogId, onClearTargetLog]);

  useEffect(() => {
    // Only auto-scroll to bottom if we are NOT targeting a specific log
    const shouldScroll = isActive && !targetLogId && (logs.length > prevLogsLength.current || prevLogsLength.current === 0);

    if (shouldScroll) {
      // If there are unread logs, scroll to the first unread one instead of the bottom
      const firstUnread = logs.find(l => l.timestamp > (lastLogViewedAt || 0));
      
      if (firstUnread) {
        setTimeout(() => {
          const element = logRefs.current.get(firstUnread.id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        const timeoutId = setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
        return () => clearTimeout(timeoutId);
      }
    }
    
    prevLogsLength.current = logs.length;
  }, [logs.length, isActive, targetLogId]); // Added targetLogId to dependencies

  // Intersection Observer to mark logs as read
  useEffect(() => {
    if (!isActive || !onLogRead) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const timestamp = parseInt(entry.target.getAttribute('data-timestamp') || '0');
            if (timestamp > (lastLogViewedAt || 0)) {
              onLogRead(timestamp);
            }
          }
        });
      },
      { 
        root: null, // Viewport
        threshold: 0.5 // Mark as read when 50% visible
      }
    );

    // Watch all currently rendered log elements
    logRefs.current.forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isActive, logs.length, lastLogViewedAt, onLogRead]);

  const scrollToBottom = () => {
    play('CLICK');
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const confirmClearLogs = () => {
    clearLogs();
    setShowDeleteModal(false);
  };

  // Exportação Markdown (Cross-Platform)
  const handleMarkdownExport = async () => {
    const md = exportLogsToMarkdown(logs, adventureName || 'Aventura');
    const fileName = `${(adventureName || 'aventura').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_log.md`;
    await exportTextFile(md, fileName, 'text/markdown');
  };

  // Exportação PDF (Cross-Platform)
  const handlePdfExport = async () => {
    const safeName = (adventureName || 'Aventura').replace(/[^a-z0-9]/gi, '_');
    const fileName = `${safeName.toLowerCase()}_log.pdf`;

    if (isNativePlatform()) {
      // Android: gera base64 e compartilha
      try {
        const pdfBase64 = await generateLogPdfBase64(logs, adventureName || 'Aventura');
        await exportPdfFile(pdfBase64, fileName);
      } catch (e) {
        console.error("PDF Export failed", e);
        alert("Falha ao gerar PDF.");
      }
    } else {
      // Browser: download direto
      try {
        await downloadLogPdf(logs, adventureName || 'Aventura');
      } catch (e) {
        console.error("PDF Export failed", e);
        alert("Falha ao gerar PDF.");
      }
    }
  };

  const formatDateTime = (ts: number) => {
    const date = new Date(ts);
    return {
      dateStr: date.toLocaleDateString('pt-BR'),
      timeStr: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getEntryStyle = (entry: LogEntry) => {
    // Priority 1: Explicit color property
    if (entry.color) {
      const c = entry.color.toLowerCase();
      if (c === 'fuchsia') return 'border-fuchsia-500 bg-fuchsia-900/20 print:bg-transparent print:border-fuchsia-600';
      if (c === 'emerald') return 'border-emerald-500 bg-emerald-900/20 print:bg-transparent print:border-emerald-600';
      if (c === 'pink') return 'border-pink-500 bg-pink-900/20 print:bg-transparent print:border-pink-600';
      if (c === 'purple') return 'border-purple-500 bg-purple-900/20 print:bg-transparent print:border-purple-600';
      if (c === 'lime') return 'border-lime-500 bg-lime-900/20 print:bg-transparent print:border-lime-600';
      if (c === 'slate') return 'border-slate-500 bg-slate-900/20 print:bg-transparent print:border-slate-600';
      if (c === 'sky') return 'border-sky-500 bg-sky-900/20 print:bg-transparent print:border-sky-600';
      if (c === 'orange') return 'border-orange-500 bg-orange-900/20 print:bg-transparent print:border-orange-600';
      if (c === 'cyan') return 'border-cyan-500 bg-cyan-900/20 print:bg-transparent print:border-cyan-600';
      if (c === 'red') return 'border-red-500 bg-red-900/20 print:bg-transparent print:border-red-600';
      if (c === 'violet') return 'border-violet-500 bg-violet-900/20 print:bg-transparent print:border-violet-600';
      if (c === 'indigo') return 'border-indigo-500 bg-indigo-900/20 print:bg-transparent print:border-indigo-600';
      if (c === 'primary') return 'border-primary bg-primary/10 print:bg-transparent print:border-amber-400';
      if (c === 'success') return 'border-success bg-success/20 print:bg-transparent print:border-green-600';
      if (c === 'error' || c === 'fail') return 'border-error bg-error/20 print:bg-transparent print:border-red-600';
    }

    if (entry.type === 'NOTE') return 'border-primary/50 bg-card/80 print:bg-transparent print:border-gray-300';
    if (entry.type === 'INTERVENTION') return 'border-error bg-error/20 print:bg-red-50 print:border-red-600 print:text-red-900';
    
    if (entry.type === 'GENERATOR') {
      if (entry.title.includes('Presságio')) return 'border-purple-500 bg-purple-900/20 print:bg-transparent print:border-purple-400';
      if (entry.title.includes('NPC')) return 'border-yellow-500 bg-yellow-900/20 print:bg-transparent print:border-yellow-600';
      if (entry.title.includes('TWENE') || entry.title.includes('Inesperado')) return 'border-orange-500 bg-orange-900/20 print:bg-transparent print:border-orange-400';
    }

    if (entry.type === 'ATTRIBUTE') {
       const res = entry.result.toLowerCase();
       if (res.includes('sucesso')) return 'border-success bg-success/20 print:bg-transparent print:border-green-600';
       if (res.includes('falha')) return 'border-error bg-error/20 print:bg-transparent print:border-red-400';
    }

    if (entry.type === 'ITEM') return 'border-indigo-500 bg-indigo-900/20 print:bg-transparent print:border-indigo-400';
    
    if (entry.type === 'ORACLE') {
        // Special case for M.U.N.E. Interventions which are now type ORACLE
        if (entry.title === 'M.U.N.E.' && entry.result.includes('Intervenção')) {
            return 'border-error bg-error/20 print:bg-red-50 print:border-red-600 print:text-red-900';
        }
        // Special case for NPC Attitude (Yellow)
        if (entry.title.includes('Atitude de NPC')) {
            return 'border-yellow-500 bg-yellow-900/20 print:bg-transparent print:border-yellow-600';
        }
        // Special case for TWENE (Orange)
        if (entry.title.includes('TWENE')) {
            return 'border-orange-500 bg-orange-900/20 print:bg-transparent print:border-orange-400';
        }
        return 'border-blue-500 bg-card print:bg-transparent print:border-blue-400';
    }

    if (entry.type === 'DRAW') return 'border-purple-500 bg-card print:bg-transparent print:border-purple-400';
    if (entry.highlight) return 'border-primary bg-primary/10 print:bg-transparent print:border-amber-400';
    
    return 'border-border bg-card print:bg-transparent print:border-gray-300';
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    // Split by **bold** OR ~~strikethrough~~
    const parts = text.split(/(\*\*.*?\*\*|~~.*?~~)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-txt-main print:text-black font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('~~') && part.endsWith('~~')) {
        return <span key={index} className="line-through opacity-50">{part.slice(2, -2)}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-app relative">
      <div className="flex justify-between items-center p-4 border-b border-border bg-app/95 sticky top-0 z-10 backdrop-blur-sm h-16 no-print">
        {/* Search Bar */}
        <div className="flex items-center gap-2 flex-1 bg-card/50 border border-border rounded-lg px-3 py-2 mr-2 focus-within:border-primary transition-colors">
           <Search size={16} className="text-txt-dim" />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Buscar..." 
             className="bg-transparent border-none outline-none text-sm text-txt-main placeholder-txt-dim w-full"
           />
           {searchQuery && (
             <button onClick={() => setSearchQuery('')} className="text-txt-dim hover:text-txt-main">
               <X size={14} />
             </button>
           )}
        </div>

        {logs.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
                onClick={() => { play('CLICK'); handleMarkdownExport(); }}
                className="text-txt-muted hover:text-txt-main p-2 rounded-full hover:bg-card-hover transition-colors active:scale-95 flex items-center justify-center font-mono text-[10px] border border-border w-8 h-8"
                title="Exportar Markdown (.md)"
              >
                .md
            </button>
            <button 
                onClick={() => { play('CLICK'); handlePdfExport(); }}
                className="text-txt-muted hover:text-primary p-2 rounded-full hover:bg-card-hover transition-colors active:scale-95"
                title="Exportar PDF"
              >
                <Printer size={20} />
            </button>
            <div className="w-px h-6 bg-border mx-1"></div>
            
            <button 
              onClick={() => { play('CLICK'); setShowDeleteModal(true); }}
              className="text-txt-muted hover:text-error p-2 rounded-full hover:bg-card-hover transition-colors active:scale-95"
              title="Limpar histórico"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 print-container print:space-y-4">
        <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
           <h1 className="text-3xl font-bold text-black font-serif mb-1">{adventureName || "Relatório de Aventura MUNE"}</h1>
           <p className="text-sm text-gray-600">Exportado em {new Date().toLocaleString()}</p>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center text-txt-dim mt-20 flex flex-col items-center no-print">
            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mb-4">
              {searchQuery ? <Search size={32} className="opacity-50" /> : <Clock size={32} className="opacity-50" />}
            </div>
            <p className="font-medium text-txt-muted">{searchQuery ? 'Nenhum resultado encontrado.' : 'Nenhum registro ainda.'}</p>
            {!searchQuery && <p className="text-sm mt-2 text-txt-dim max-w-[200px]">As rolagens do oráculo, ferramentas e suas anotações aparecerão aqui.</p>}
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const { dateStr, timeStr } = formatDateTime(entry.timestamp);
            const iconUrl = entry.icon ? `/icons/${entry.icon}.svg` : undefined;
            const isHighlighted = highlightedLogId === entry.id;
            
            return (
              <div 
                key={entry.id}
                ref={el => { 
                  if (el) logRefs.current.set(entry.id, el); 
                  else logRefs.current.delete(entry.id);
                }}
                data-timestamp={entry.timestamp}
                className={`relative pl-4 pr-3 py-3 rounded-r-lg border-l-4 shadow-sm group break-inside-avoid print:shadow-none print:border-l-[3px] print:border-y-0 print:border-r-0 print:rounded-none print:pl-3 print:py-2 ${getEntryStyle(entry)} ${isHighlighted ? 'ring-2 ring-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] scale-[1.02] z-10 transition-all duration-500' : 'transition-all duration-300'}`}
              >
                <div className="flex justify-between items-start mb-1 print:flex-col print:gap-1">
                  <span className="text-[10px] sm:text-xs font-mono text-txt-muted print:text-gray-500 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} className="print:hidden" /> {dateStr}
                    </span>
                    <span className="print:hidden text-txt-dim">-</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="print:hidden" /> {timeStr}
                    </span>
                  </span>
                  
                  <div className="flex items-center gap-2 print:self-start">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wider print:border print:border-gray-400 print:text-black print:bg-transparent print:px-2 ${entry.type === 'NOTE' ? 'text-primary bg-primary/20' : 'text-txt-muted bg-app/30'}`}>
                      {TYPE_LABELS[entry.type] || entry.type}
                    </span>
                    <button 
                      onClick={() => { play('CLICK'); removeLog(entry.id); }}
                      className="text-txt-muted hover:text-error p-1 -mr-1 transition-colors no-print"
                      title="Excluir entrada"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                    {iconUrl && (
                       <div className="flex-none pt-1 print:hidden">
                          <div 
                             className="w-8 h-8 sm:w-10 sm:h-10"
                             style={{
                                 backgroundColor: entry.iconColor || '#cbd5e1',
                                 maskImage: `url("${iconUrl}")`,
                                 maskRepeat: 'no-repeat',
                                 maskPosition: 'center',
                                 maskSize: 'contain',
                                 WebkitMaskImage: `url("${iconUrl}")`,
                                 WebkitMaskRepeat: 'no-repeat',
                                 WebkitMaskPosition: 'center',
                                 WebkitMaskSize: 'contain'
                             }}
                          />
                       </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="mt-1">
                            {entry.title && entry.title !== 'Nota' && (
                              <h3 className={`font-bold text-sm mb-1 print:text-black ${entry.type === 'NOTE' ? 'text-primary/80' : 'text-txt-main'}`}>
                                {entry.title}
                              </h3>
                            )}
                            <LinkedText 
                                content={entry.result}
                                entries={wikiEntries || []}
                                onMentionClick={(slug, id) => onNavigateToWiki?.(id || null, !id ? slug : undefined)}
                                onTagClick={(slug, id) => onNavigateToWiki?.(id || null, !id ? slug : undefined)}
                                className="text-base text-txt-main print:text-black font-serif print-serif leading-relaxed whitespace-pre-wrap"
                            />
                        </div>

                        {entry.details && (
                          <p className="text-xs text-txt-muted print:text-gray-600 mt-2 border-t border-border/50 print:border-gray-300 pt-2 font-mono break-words">
                            {renderFormattedText(entry.details)}
                          </p>
                        )}

                        {entry.imageUrl && (
                          <div className="mt-3 rounded-lg overflow-hidden border border-border/50 print:border-none">
                            <img src={entry.imageUrl} alt="Anexo do Log" className="w-full h-auto object-cover max-h-80 print:max-h-[8cm]" />
                          </div>
                        )}

                        {entry.visualIcons && (
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {entry.visualIcons.map((v, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div 
                                  className="w-10 h-10 bg-card-hover rounded-lg flex items-center justify-center border border-border print:border-gray-300"
                                  title={v.name}
                                >
                                  <div 
                                    className="w-6 h-6"
                                    style={{
                                      backgroundColor: v.color,
                                      maskImage: `url("${v.url}")`,
                                      maskRepeat: 'no-repeat',
                                      maskPosition: 'center',
                                      maskSize: 'contain',
                                      WebkitMaskImage: `url("${v.url}")`,
                                      WebkitMaskRepeat: 'no-repeat',
                                      WebkitMaskPosition: 'center',
                                      WebkitMaskSize: 'contain'
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} className="h-px w-full no-print" />
      </div>

      {logs.length > 3 && !isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 p-3 bg-card/50 hover:bg-card/80 text-txt-main rounded-full shadow-lg transition-all active:scale-95 no-print z-20 backdrop-blur-sm"
          title="Ir para o final"
        >
          <ArrowDown size={24} />
        </button>
      )}

      <ConfirmDeleteModal 
        isOpen={showDeleteModal}
        title="Limpar Histórico"
        description={
          <>
            Tem certeza que deseja apagar <strong>todos os registros</strong> desta sessão?
            <br/>
            <span className="text-xs text-txt-dim mt-1 block">Esta ação não pode ser desfeita.</span>
          </>
        }
        confirmLabel="Sim, limpar"
        onConfirm={confirmClearLogs}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default LogView;