
import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import { Trash2, Clock, X, StickyNote, Printer, Calendar, FileDown } from 'lucide-react';
import { exportLogsToMarkdown } from '../utils';
import { useGameSound } from '../hooks/useGameSound';

interface LogViewProps {
  logs: LogEntry[];
  adventureName?: string;
  clearLogs: () => void;
  removeLog: (id: string) => void;
  isActive: boolean;
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

const LogView: React.FC<LogViewProps> = ({ logs, adventureName, clearLogs, removeLog, isActive }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { play } = useGameSound();

  useEffect(() => {
    // Only scroll if the tab is active
    if (isActive) {
      // Use a small timeout to ensure DOM is rendered after visibility change
      const timeoutId = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [logs, isActive]);

  const confirmClearLogs = () => {
    clearLogs();
    setShowDeleteModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkdownExport = () => {
    const md = exportLogsToMarkdown(logs, adventureName || 'Aventura');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${adventureName || 'aventura'}_log.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDateTime = (ts: number) => {
    const date = new Date(ts);
    return {
      dateStr: date.toLocaleDateString('pt-BR'),
      timeStr: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getEntryStyle = (entry: LogEntry) => {
    // Base styles (Screen)
    // Print styles overwrite these using 'print:' prefix
    
    // 0. Notas de Diário (Estilo Distinto)
    if (entry.type === 'NOTE') return 'border-amber-200/50 bg-slate-800/80 print:bg-transparent print:border-gray-300';

    // 1. Intervenções (Crítico/Urgente)
    if (entry.type === 'INTERVENTION') return 'border-red-500 bg-red-900/20 print:bg-red-50 print:border-red-600 print:text-red-900';
    
    // 2. Ferramentas Geradoras (Cores específicas para cada ferramenta)
    if (entry.type === 'GENERATOR') {
      if (entry.title.includes('Presságio')) return 'border-purple-500 bg-purple-900/20 print:bg-transparent print:border-purple-400';
      if (entry.title.includes('NPC')) return 'border-yellow-500 bg-yellow-900/20 print:bg-transparent print:border-yellow-600';
      if (entry.title.includes('TWENE') || entry.title.includes('Inesperado')) return 'border-orange-500 bg-orange-900/20 print:bg-transparent print:border-orange-400';
    }

    // 3. Testes de Atributo (Sucesso vs Falha)
    if (entry.type === 'ATTRIBUTE') {
       const res = entry.result.toLowerCase();
       if (res.includes('sucesso')) return 'border-green-500 bg-green-900/20 print:bg-transparent print:border-green-600';
       if (res.includes('falha')) return 'border-red-500 bg-red-900/20 print:bg-transparent print:border-red-400';
    }

    // 4. Itens (Inventário)
    if (entry.type === 'ITEM') return 'border-indigo-500 bg-indigo-900/20 print:bg-transparent print:border-indigo-400';

    // 5. Oráculo (Padrão Azul)
    if (entry.type === 'ORACLE') return 'border-blue-500 bg-slate-800 print:bg-transparent print:border-blue-400';

    // 6. Baralho
    if (entry.type === 'DRAW') return 'border-purple-500 bg-slate-800 print:bg-transparent print:border-purple-400';
    
    // 7. Highlight genérico ou fallback
    if (entry.highlight) return 'border-amber-500 bg-amber-900/10 print:bg-transparent print:border-amber-400';
    
    // Padrão (Dados genéricos, etc)
    return 'border-slate-600 bg-slate-800 print:bg-transparent print:border-gray-300';
  };

  // Helper to render bold text marked with **text**
  const renderFormattedText = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-slate-100 print:text-black font-bold">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderDeleteConfirmModal = () => {
    if (!showDeleteModal) return null;
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={() => { play('CLICK'); setShowDeleteModal(false); }}
      >
        <div 
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          <button 
            type="button"
            onClick={() => { play('CLICK'); setShowDeleteModal(false); }}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
          >
            <X size={20} />
          </button>
          
          <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
            <Trash2 size={20} className="text-red-500" />
            Limpar Histórico
          </h3>
          
          <p className="text-slate-300 mb-6 text-sm leading-relaxed">
            Tem certeza que deseja apagar <strong>todos os registros</strong> desta sessão?
            <br/>
            <span className="text-xs text-slate-500 mt-1 block">Esta ação não pode ser desfeita.</span>
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={() => { play('CLICK'); setShowDeleteModal(false); }}
              className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { play('CLICK'); confirmClearLogs(); }}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-red-900/20"
            >
              Sim, limpar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 backdrop-blur-sm h-16 no-print">
        <h2 className="text-lg font-bold text-slate-200">Registro da Sessão</h2>
        {logs.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
                onClick={() => { play('CLICK'); handleMarkdownExport(); }}
                className="text-slate-400 hover:text-slate-100 p-2 rounded-full hover:bg-slate-800 transition-colors active:scale-95 flex items-center justify-center font-mono text-[10px] border border-slate-700 w-8 h-8"
                title="Exportar Markdown (.md)"
              >
                .md
            </button>
            <button 
                onClick={() => { play('CLICK'); handlePrint(); }}
                className="text-slate-400 hover:text-amber-400 p-2 rounded-full hover:bg-slate-800 transition-colors active:scale-95"
                title="Exportar PDF (Imprimir)"
              >
                <Printer size={20} />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-1"></div>
            
            <button 
              onClick={() => { play('CLICK'); setShowDeleteModal(true); }}
              className="text-slate-400 hover:text-red-400 p-2 rounded-full hover:bg-slate-800 transition-colors active:scale-95"
              title="Limpar histórico"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </div>

      {/* Main Container - The class 'print-container' makes this visible in PDF */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 print-container print:space-y-4">
        
        {/* Header visible ONLY when printing */}
        <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
           <h1 className="text-3xl font-bold text-black font-serif mb-1">{adventureName || "Relatório de Aventura MUNE"}</h1>
           <p className="text-sm text-gray-600">Exportado em {new Date().toLocaleString()}</p>
        </div>

        {logs.length === 0 ? (
          <div className="text-center text-slate-600 mt-20 flex flex-col items-center no-print">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Clock size={32} className="opacity-50" />
            </div>
            <p className="font-medium text-slate-400">Nenhum registro ainda.</p>
            <p className="text-sm mt-2 text-slate-500 max-w-[200px]">As rolagens do oráculo, ferramentas e suas anotações aparecerão aqui.</p>
          </div>
        ) : (
          logs.map((entry) => {
            const { dateStr, timeStr } = formatDateTime(entry.timestamp);
            const iconUrl = entry.icon ? `/icons/${entry.icon}.svg` : undefined;
            return (
              <div 
                key={entry.id} 
                className={`relative pl-4 pr-3 py-3 rounded-r-lg border-l-4 shadow-sm group break-inside-avoid print:shadow-none print:border-l-[3px] print:border-y-0 print:border-r-0 print:rounded-none print:pl-3 print:py-2 ${getEntryStyle(entry)}`}
              >
                <div className="flex justify-between items-start mb-1 print:flex-col print:gap-1">
                  <span className="text-[10px] sm:text-xs font-mono text-slate-500 print:text-gray-500 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} className="print:hidden" /> {dateStr}
                    </span>
                    <span className="print:hidden text-slate-600">-</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} className="print:hidden" /> {timeStr}
                    </span>
                  </span>
                  
                  <div className="flex items-center gap-2 print:self-start">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wider print:border print:border-gray-400 print:text-black print:bg-transparent print:px-2 ${entry.type === 'NOTE' ? 'text-amber-200 bg-amber-900/40' : 'text-slate-500 bg-slate-950/30'}`}>
                      {TYPE_LABELS[entry.type] || entry.type}
                    </span>
                    <button 
                      onClick={() => { play('CLICK'); removeLog(entry.id); }}
                      className="text-slate-600 hover:text-red-500 p-1 -mr-1 transition-colors no-print"
                      title="Excluir entrada"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                    {/* ICON RENDERING */}
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
                        {/* Título e Texto principal */}
                        {entry.type === 'NOTE' ? (
                          // Layout específico para as Notas (Diário)
                          <div className="mt-1">
                            {entry.title && entry.title !== 'Nota' && (
                              <h3 className="font-bold text-amber-500/80 print:text-black text-sm mb-1">{entry.title}</h3>
                            )}
                            <p className="text-base text-slate-100 print:text-black font-serif print-serif leading-relaxed whitespace-pre-wrap">
                              {entry.result}
                            </p>
                          </div>
                        ) : (
                          // Layout Padrão para Mecânicas
                          <div className="mt-1">
                            <h3 className="font-bold text-slate-100 print:text-black text-sm">{entry.title}</h3>
                            <p className="text-lg text-slate-100 print:text-black font-medium mt-0.5 leading-snug">{entry.result}</p>
                          </div>
                        )}

                        {/* Detalhes Técnicos */}
                        {entry.details && (
                          <p className="text-xs text-slate-400 print:text-gray-600 mt-2 border-t border-slate-700/50 print:border-gray-300 pt-2 font-mono break-words">
                            {renderFormattedText(entry.details)}
                          </p>
                        )}

                        {/* Imagem Anexada */}
                        {entry.imageUrl && (
                          <div className="mt-3 rounded-lg overflow-hidden border border-slate-700/50 print:border-none">
                            <img src={entry.imageUrl} alt="Anexo do Log" className="w-full h-auto object-cover max-h-80 print:max-h-[8cm]" />
                          </div>
                        )}

                        {/* Presságio Visual Icons */}
                        {entry.visualIcons && (
                          <div className="mt-3 flex gap-2 flex-wrap">
                            {entry.visualIcons.map((v, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div 
                                  className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center border border-slate-600 print:border-gray-300"
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
        <div ref={bottomRef} className="no-print" />
      </div>

      {renderDeleteConfirmModal()}
    </div>
  );
};

export default LogView;
