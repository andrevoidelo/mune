
import React, { useState, useRef, useEffect } from 'react';
import { Tab, LogEntry, Character, Adventure, Collection, Thread, NpcEntry } from './types';
import OracleView from './components/OracleView';
import ToolsView from './components/ToolsView';
import DiceView from './components/DiceView';
import LogView from './components/LogView';
import PersonaView from './components/PersonaView';
import SettingsView from './components/SettingsView';
import NoteModal from './components/NoteModal';
import DraggableFab from './components/DraggableFab';
import { MessageSquare, Wrench, Dices, ScrollText, HelpCircle, X, User, ChevronLeft, Plus, Calendar, Trash2, Edit2, Play, Save, Settings, BookOpen, UploadCloud } from 'lucide-react';
import { generateUUID } from './utils';
import { DEFAULT_COLLECTIONS } from './constants';
import { SoundProvider } from './contexts/SoundContext';
import { useGameSound } from './hooks/useGameSound';

const AppContent: React.FC = () => {
  const { play } = useGameSound();
  // Global State
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [currentAdventureId, setCurrentAdventureId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);
  const [theme, setTheme] = useState<string>('default');
  
  // App View State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ORACLE);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Adventure Management State
  const [isEditingAdv, setIsEditingAdv] = useState(false);
  const [advFormData, setAdvFormData] = useState<{id?: string, name: string, description: string}>({ name: '', description: '' });
  const [advToDelete, setAdvToDelete] = useState<string | null>(null);

  // Backup State
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [pendingImportData, setPendingImportData] = useState<{adventures: Adventure[], collections: Collection[]} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MANUAL_URL = "https://drive.google.com/file/d/1mJbHcCNscMfs_NPnqMMz2Y8KiD8gWrkZ/view";

  // --- Theme Effect ---
  useEffect(() => {
    console.log('Changing theme to:', theme);
    document.documentElement.setAttribute('data-theme', theme);
    // Meta theme color update based on theme
    const themeColors: Record<string, string> = {
      'light': '#fcfbf7',
      'fantasy': '#292524',
      'scifi': '#0f172a',
      'cyberpunk': '#0f0518',
      'terminal': '#000000',
      'default': '#0f172a'
    };
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme] || '#0f172a');
  }, [theme]);

  // --- Persistence & Migration Logic ---

  useEffect(() => {
    // Load Global Settings
    const savedCollections = localStorage.getItem('mune_collections');
    if (savedCollections) setCollections(JSON.parse(savedCollections));

    const savedTheme = localStorage.getItem('mune_theme_mode');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
       // Legacy migration
       const legacyPaper = localStorage.getItem('mune_theme');
       if (legacyPaper === 'paper') setTheme('light');
    }

    // Load Adventures
    const savedAdventures = localStorage.getItem('mune_adventures');
    
    if (savedAdventures) {
      try {
        const parsed = JSON.parse(savedAdventures);
        // Ensure new fields exist on old records
        const migrated = parsed.map((adv: any) => ({
          ...adv,
          threads: adv.threads || [],
          npcs: adv.npcs || []
        }));
        setAdventures(migrated.sort((a: Adventure, b: Adventure) => b.lastPlayedAt - a.lastPlayedAt));
      } catch (e) {
        console.error("Failed to parse adventures", e);
      }
    } else {
      // Legacy Migration
      const legacyLogs = localStorage.getItem('mune_logs');
      const legacyChars = localStorage.getItem('mune_personas');

      if (legacyLogs || legacyChars) {
        const newAdv: Adventure = {
          id: generateUUID(),
          name: 'Aventura Recuperada',
          description: 'Dados migrados da versão anterior do app.',
          createdAt: Date.now(),
          lastPlayedAt: Date.now(),
          logs: legacyLogs ? JSON.parse(legacyLogs) : [],
          characters: legacyChars ? JSON.parse(legacyChars) : [],
          threads: [],
          npcs: []
        };
        setAdventures([newAdv]);
        
        localStorage.removeItem('mune_logs');
        localStorage.removeItem('mune_personas');
      }
    }
  }, []);

  // Persist State
  useEffect(() => {
    if (adventures.length > 0) {
      localStorage.setItem('mune_adventures', JSON.stringify(adventures));
    }
  }, [adventures]);

  useEffect(() => {
    localStorage.setItem('mune_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('mune_theme_mode', theme);
  }, [theme]);


  // --- Global Data Management (Backup/Restore) ---

  const handleGlobalBackup = () => {
    // Fix: Filter out built-in collections to avoid redundancy and version conflicts
    const customCollections = collections.filter(c => !c.isBuiltIn);

    const data = {
      version: 3,
      exportedAt: new Date().toISOString(),
      adventures: adventures,
      collections: customCollections
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MUNE_FullBackup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportTrigger = () => {
    // Safety check for ref
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGlobalRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = (e.target?.result as string) || "";
        
        if (!content.trim()) {
           alert("O arquivo selecionado parece estar vazio.");
           return;
        }

        const data = JSON.parse(content);
        let validAdventures: Adventure[] = [];
        let validCollections: Collection[] = [];

        // CASE 1: Backup Padrão Moderno (v3)
        if (data && typeof data === 'object' && Array.isArray(data.adventures)) {
           validAdventures = data.adventures;
           validCollections = data.collections || [];
        } 
        // CASE 2: Backup Legado (Formato de Objeto Único com logs/characters na raiz)
        // Correção específica para o erro da screenshot: "Chaves encontradas: version, date, characters, logs"
        else if (data && typeof data === 'object' && (data.logs || data.characters)) {
           const legacyAdv: Adventure = {
              id: generateUUID(),
              name: 'Aventura Importada (Legado)',
              description: `Restaurada em ${new Date().toLocaleDateString()}.`,
              createdAt: Date.now(),
              lastPlayedAt: Date.now(),
              logs: Array.isArray(data.logs) ? data.logs : [],
              characters: Array.isArray(data.characters) ? data.characters : [],
              threads: Array.isArray(data.threads) ? data.threads : [],
              npcs: Array.isArray(data.npcs) ? data.npcs : []
           };
           validAdventures = [legacyAdv];
        }

        if (validAdventures.length > 0) {
           setPendingImportData({
             adventures: validAdventures,
             collections: validCollections
           });
        } else {
           // Debug info for user
           const foundKeys = data ? Object.keys(data).join(', ') : 'null';
           alert(`Formato de arquivo não reconhecido.\nChaves encontradas: ${foundKeys}\n\nO sistema tentou detectar backups antigos mas falhou. Verifique se o arquivo está corrompido.`);
        }
      } catch (err) {
        alert('Erro ao processar o arquivo. Verifique se é um JSON válido.');
        console.error(err);
      }
    };

    // Reset input AFTER read is complete (or failed) to allow selecting same file again
    reader.onloadend = () => {
       if (event.target) {
          event.target.value = '';
       }
    };

    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImportData) return;

    // 1. Restore Adventures (Replace)
    setAdventures(pendingImportData.adventures);

    // 2. Restore Collections (Merge Default + Custom)
    const importedCustomCollections = (pendingImportData.collections || []).filter(c => !c.isBuiltIn);
    
    // Combine built-ins (latest version from code) with user's custom collections
    const mergedCollections = [...DEFAULT_COLLECTIONS, ...importedCustomCollections];
    
    setCollections(mergedCollections);
    
    setPendingImportData(null);
    setImportStatus('Sucesso!');
    setTimeout(() => setImportStatus(null), 3000);
  };

  const cancelImport = () => {
    setPendingImportData(null);
  };

  // --- Adventure CRUD Helpers ---

  const handleCreateAdventure = () => {
    setAdvFormData({ name: '', description: '' });
    setIsEditingAdv(true);
  };

  const handleEditAdventure = (adv: Adventure, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdvFormData({ id: adv.id, name: adv.name, description: adv.description });
    setIsEditingAdv(true);
  };

  const handleSaveAdventure = () => {
    if (!advFormData.name.trim()) return;

    if (advFormData.id) {
      // Edit existing
      setAdventures(prev => prev.map(a => a.id === advFormData.id ? {
        ...a,
        name: advFormData.name,
        description: advFormData.description
      } : a));
    } else {
      // Create new
      const newAdv: Adventure = {
        id: generateUUID(),
        name: advFormData.name,
        description: advFormData.description,
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
        logs: [],
        characters: [],
        threads: [],
        npcs: []
      };
      setAdventures(prev => [newAdv, ...prev]);
    }
    setIsEditingAdv(false);
  };

  const handleDeleteAdventure = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdvToDelete(id);
  };

  const confirmDeleteAdventure = () => {
    if (advToDelete) {
      setAdventures(prev => prev.filter(a => a.id !== advToDelete));
      setAdvToDelete(null);
    }
  };

  const handleSelectAdventure = (id: string) => {
    // Update last played
    setAdventures(prev => prev.map(a => a.id === id ? { ...a, lastPlayedAt: Date.now() } : a));
    setCurrentAdventureId(id);
    setActiveTab(Tab.ORACLE); // Default tab on enter
  };

  // --- Wrappers for Child Components to update the Active Adventure ---

  const activeAdventure = adventures.find(a => a.id === currentAdventureId);

  const updateActiveAdventureData = (updates: Partial<Adventure>) => {
    if (!currentAdventureId) return;
    setAdventures(prev => prev.map(a => a.id === currentAdventureId ? { ...a, ...updates } : a));
  };

  const addLog = (entry: LogEntry) => {
    if (!activeAdventure) return;
    const newLogs = [...activeAdventure.logs, entry];
    updateActiveAdventureData({ logs: newLogs });
  };

  const removeLog = (id: string) => {
    if (!activeAdventure) return;
    const newLogs = activeAdventure.logs.filter(entry => entry.id !== id);
    updateActiveAdventureData({ logs: newLogs });
  };

  const clearLogs = () => {
    updateActiveAdventureData({ logs: [] });
  };

  const setCharactersWrapper = (value: React.SetStateAction<Character[]> | Character[]) => {
    if (!activeAdventure) return;
    const newChars = typeof value === 'function' 
      ? (value as (prev: Character[]) => Character[])(activeAdventure.characters)
      : value;
    updateActiveAdventureData({ characters: newChars });
  };

  const updateThreads = (threads: Thread[]) => {
    updateActiveAdventureData({ threads });
  };

  const updateNpcs = (npcs: NpcEntry[]) => {
    updateActiveAdventureData({ npcs });
  };

  const handleAddNote = (text: string, image?: string, icon?: string, iconColor?: string) => {
     addLog({
       id: generateUUID(),
       timestamp: Date.now(),
       type: 'NOTE',
       title: 'Nota',
       result: text,
       imageUrl: image,
       icon,
       iconColor
     });
  };

  // --- Helper: Contextual Help Data ---

  const getHelpData = () => {
    if (showSettings) {
        return { title: "Configurações", text: "Gerencie seus dados e backups.", icon: <Settings /> };
    }
    if (!currentAdventureId) {
      return {
        title: "Minhas Aventuras",
        text: "Aqui você gerencia suas campanhas. Crie novas aventuras clicando em '+', ou selecione uma existente para jogar. Você pode editar o nome ou excluir aventuras antigas.",
        icon: <ScrollText size={32} className="text-amber-500" />
      };
    }

    switch (activeTab) {
      case Tab.ORACLE:
        return {
          title: "Oráculo",
          text: "O coração do sistema. Faça perguntas de 'Sim ou Não' e clique em Rolar para ver o resultado. A cada rolagem '6' (Sim, e...), você acumula 1 ponto. Com 3 pontos, há uma Intervenção do Oráculo na história. Use o botão 'Tramas & NPCs' para gerenciar pontos de enredo.",
          icon: <MessageSquare size={32} className="text-amber-500" />
        };
      case Tab.TOOLS:
        return {
          title: "Coleções",
          text: "Aqui você encontra tabelas aleatórias (como Presságio, Reação de NPC) e Baralhos de Cartas. Você pode criar suas próprias tabelas e baralhos personalizadas clicando em 'Criar Coleção'.",
          icon: <Wrench size={32} className="text-amber-500" />
        };
      case Tab.PERSONA:
        return {
          title: "Personagens",
          text: "Gerencie fichas de personagens. Adicione recursos (vida, mana, sorte, munição), atributos (força, agilidade, sabedoria), faça testes, gerencie inventário e adicione rolagens (dano, cura).",
          icon: <User size={32} className="text-amber-500" />
        };
      case Tab.DICE:
        return {
          title: "Dados",
          text: "Clique no botão ou digite fórmulas (ex: 2d20+5). 'KH' (Keep Highest) mantém os maiores dados (Vantagem). 'KL' (Keep Lowest) mantém os menores. Clique neles repetidamente para ajustar a quantidade (ex: kh1, kh2).",
          icon: <Dices size={32} className="text-amber-500" />
        };
      case Tab.LOG:
        return {
          title: "Registro (Log)",
          text: "Histórico automático. Você pode exportar como PDF (Impressora) ou Markdown (.md) para usar em Obsidian/Notion. Use o botão flutuante de Lápis para adicionar notas manuais e imagens.",
          icon: <ScrollText size={32} className="text-amber-500" />
        };
      default:
        return { title: "Ajuda", text: "Selecione uma aba.", icon: <HelpCircle /> };
    }
  };

  const helpContent = getHelpData();

  // --- RENDER: Adventure List (Home) ---

  const renderAdventureList = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-6 mt-2">
        <h2 className="text-xl font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
          <ScrollText className="text-amber-500" /> Minhas Aventuras
        </h2>
        <button 
          onClick={() => { play('CLICK'); handleCreateAdventure(); }}
          className="bg-amber-600 hover:bg-amber-500 text-on-primary p-2 rounded-full shadow-lg active:scale-95 transition-all"
          title="Nova Aventura"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="grid gap-4 pb-20">
        {adventures.length === 0 ? (
          <div className="text-center py-20 opacity-50 flex flex-col items-center">
            <Dices size={64} className="mb-4 text-slate-600" />
            <p className="text-lg font-bold">Nenhuma aventura encontrada.</p>
            <p className="text-sm">Clique no botão "+" para começar sua jornada.</p>
          </div>
        ) : (
          adventures.map(adv => (
            <div 
              key={adv.id}
              onClick={() => { play('CLICK'); handleSelectAdventure(adv.id); }}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg hover:border-amber-500/50 transition-all active:scale-[0.98] group cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-amber-500 transition-colors line-clamp-1">{adv.name}</h3>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono mt-1">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(adv.lastPlayedAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><User size={10} /> {adv.characters.length} Personas</span>
                    <span className="flex items-center gap-1"><ScrollText size={10} /> {adv.logs.length} Logs</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[1.25rem]">
                {adv.description || <span className="italic opacity-50">Sem descrição...</span>}
              </p>

              <div className="flex justify-between items-center border-t border-slate-700/50 pt-3 mt-2">
                 <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                   <Play size={12} fill="currentColor" /> Jogar
                 </span>
                 
                 <div className="flex gap-2">
                    <button 
                      onClick={(e) => { play('CLICK'); handleEditAdventure(adv, e); }}
                      className="p-2 text-slate-500 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { play('CLICK'); handleDeleteAdventure(adv.id, e); }}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create/Edit Adventure */}
      {isEditingAdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-slate-100">
                 {advFormData.id ? 'Editar Aventura' : 'Nova Aventura'}
               </h3>
               <button onClick={() => { play('CLICK'); setIsEditingAdv(false); }}><X className="text-slate-500" /></button>
             </div>
             
             <div className="space-y-4">
               <div>
                 <label className="text-xs uppercase font-bold text-slate-500 block mb-1">Título</label>
                 <input 
                   autoFocus
                   type="text" 
                   value={advFormData.name}
                   onChange={e => setAdvFormData({...advFormData, name: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-100 focus:border-amber-500 placeholder-slate-500 outline-none"
                   placeholder="Ex: A Tumba dos Horrores"
                 />
               </div>
               <div>
                 <label className="text-xs uppercase font-bold text-slate-500 block mb-1">Descrição</label>
                 <textarea 
                   value={advFormData.description}
                   onChange={e => setAdvFormData({...advFormData, description: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-slate-100 focus:border-amber-500 placeholder-slate-500 outline-none h-24 resize-none"
                   placeholder="Uma breve sinopse..."
                   />
               </div>
               <button 
                 onClick={() => { play('CLICK'); handleSaveAdventure(); }}
                 disabled={!advFormData.name.trim()}
                 className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary font-bold py-3 rounded-lg flex items-center justify-center gap-2"
               >
                 <Save size={18} /> Salvar
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {advToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
             <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
               <Trash2 className="text-red-500" /> Excluir Aventura?
             </h3>
             <p className="text-slate-400 text-sm mb-6">
               Isso apagará permanentemente todos os logs e personagens desta aventura.
             </p>
             <div className="flex gap-3">
               <button 
                 onClick={() => { play('CLICK'); setAdvToDelete(null); }}
                 className="flex-1 py-2 bg-slate-700 text-slate-200 rounded font-bold"
               >
                 Cancelar
               </button>
               <button 
                 onClick={() => { play('CLICK'); confirmDeleteAdventure(); }}
                 className="flex-1 py-2 bg-red-600 text-slate-100 rounded font-bold"
               >
                 Excluir
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden relative">
      {/* Header */}
      <header className="flex-none h-14 bg-slate-950 flex items-center justify-between px-4 border-b border-slate-800 shadow-md z-20 relative">
        <div className="flex items-center gap-3 min-w-0">
          {showSettings ? (
             <div className="flex items-center gap-2 animate-in slide-in-from-left duration-200 min-w-0">
                <button 
                  onClick={() => { play('CLICK'); setShowSettings(false); }}
                  className="p-1 ml-1 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800 transition-colors flex-none"
                >
                  <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-slate-100 truncate">Configurações</h1>
             </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0 animate-in fade-in duration-300">
              {currentAdventureId && (
                <button 
                  onClick={() => { play('CLICK'); setCurrentAdventureId(null); }}
                  className="p-1 ml-1 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800 transition-colors flex-none"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {!currentAdventureId && (
                <div 
                  className="w-8 h-8 rounded-lg bg-amber-500 flex-none"
                  style={{
                    maskImage: 'url("/mune-var.svg")',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    maskSize: 'contain',
                    WebkitMaskImage: 'url("/mune-var.svg")',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    WebkitMaskSize: 'contain'
                  }}
                />
              )}
              
              <div className="flex flex-col min-w-0">
                <h1 className="text-sm sm:text-lg font-bold tracking-wider text-amber-500 uppercase truncate">
                  {currentAdventureId && activeAdventure ? activeAdventure.name : 'Mestre Mune'}
                </h1>
                {currentAdventureId && (
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none">Em Aventura</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {!showSettings && (
            <>
              <button 
                onClick={() => { play('CLICK'); setShowHelp(true); }}
                className="p-2 text-slate-500 hover:text-amber-500 active:text-amber-400 transition-colors rounded-full hover:bg-slate-900"
                aria-label="Ajuda Contextual"
              >
                <HelpCircle size={20} />
              </button>
              <button 
                onClick={() => { play('CLICK'); setShowSettings(true); }}
                className="p-2 text-slate-500 hover:text-amber-500 active:text-amber-400 transition-colors rounded-full hover:bg-slate-900"
                aria-label="Configurações"
              >
                <Settings size={20} />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area + SideNav Wrapper */}
      <div className="flex-1 flex overflow-hidden flex-col landscape:flex-row">
        
        {/* Side Navigation (Landscape Only) */}
        {currentAdventureId && !showSettings && (
          <nav className="hidden landscape:flex flex-col w-16 bg-slate-950 border-r border-slate-800 h-full py-4 items-center gap-4 z-30">
            <NavButton 
              active={activeTab === Tab.ORACLE} 
              onClick={() => setActiveTab(Tab.ORACLE)}
              icon={<MessageSquare size={24} />}
              label="Oráculo"
              vertical
            />
            <NavButton 
              active={activeTab === Tab.TOOLS} 
              onClick={() => setActiveTab(Tab.TOOLS)}
              icon={<Wrench size={24} />}
              label="Coleções"
              vertical
            />
            <NavButton 
              active={activeTab === Tab.PERSONA} 
              onClick={() => setActiveTab(Tab.PERSONA)}
              icon={<User size={24} />}
              label="Persona"
              vertical
            />
            <NavButton 
              active={activeTab === Tab.DICE} 
              onClick={() => setActiveTab(Tab.DICE)}
              icon={<Dices size={24} />}
              label="Dados"
              vertical
            />
            <NavButton 
              active={activeTab === Tab.LOG} 
              onClick={() => setActiveTab(Tab.LOG)}
              icon={<ScrollText size={24} />}
              label="Log"
              badge={activeAdventure?.logs.length || 0}
              vertical
            />
          </nav>
        )}

        <main className="flex-1 overflow-hidden relative w-full h-full">
          {showSettings ? (
            <SettingsView 
              onBackup={handleGlobalBackup}
              onRestoreTrigger={handleImportTrigger}
              fileInputRef={fileInputRef}
              importStatus={importStatus}
              onRestoreAction={handleGlobalRestore}
              currentTheme={theme}
              setTheme={setTheme}
            />
          ) : !currentAdventureId ? (
            // View: Adventure List
            renderAdventureList()
          ) : activeAdventure ? (
            // View: Playing Tabs
            <>
              <div className={activeTab === Tab.ORACLE ? 'h-full w-full' : 'hidden'}>
                <OracleView 
                  addLog={addLog} 
                  threads={activeAdventure.threads || []}
                  npcs={activeAdventure.npcs || []}
                  updateThreads={updateThreads}
                  updateNpcs={updateNpcs}
                />
              </div>
              
              <div className={activeTab === Tab.TOOLS ? 'h-full w-full' : 'hidden'}>
                <ToolsView 
                  addLog={addLog} 
                  collections={collections}
                  setCollections={setCollections}
                />
              </div>

              <div className={activeTab === Tab.PERSONA ? 'h-full w-full' : 'hidden'}>
                <PersonaView 
                  characters={activeAdventure.characters} 
                  setCharacters={setCharactersWrapper} 
                  addLog={addLog} 
                />
              </div>

              <div className={activeTab === Tab.DICE ? 'h-full w-full' : 'hidden'}>
                <DiceView addLog={addLog} />
              </div>

              <div className={activeTab === Tab.LOG ? 'h-full w-full' : 'hidden'}>
                <LogView 
                  logs={activeAdventure.logs} 
                  adventureName={activeAdventure.name}
                  clearLogs={clearLogs} 
                  removeLog={removeLog} 
                  isActive={activeTab === Tab.LOG}
                />
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-red-500">Erro ao carregar aventura.</div>
          )}
        </main>
      </div>

      {/* GLOBAL DRAGGABLE FAB for Notes */}
      {currentAdventureId && !showSettings && (
        <DraggableFab onClick={() => { play('CLICK'); setShowNoteModal(true); }} />
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <NoteModal 
          onClose={() => setShowNoteModal(false)}
          onSave={handleAddNote}
        />
      )}

      {/* HELP MODAL */}
      {showHelp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => { play('CLICK'); setShowHelp(false); }}
        >
           <div 
             className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 flex flex-col items-center text-center"
             onClick={e => e.stopPropagation()}
           >
              <button onClick={() => { play('CLICK'); setShowHelp(false); }} className="absolute top-4 right-4 text-slate-500 hover:text-slate-100"><X size={20} /></button>
              
              <div className="p-4 bg-slate-900 rounded-full mb-4 text-amber-500 border border-slate-700 shadow-inner">
                 {helpContent.icon}
              </div>
              
              <h3 className="text-xl font-bold text-slate-100 mb-2">{helpContent.title}</h3>
              
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                 {helpContent.text}
              </p>
              
              {/* SPACER LINE */}
              <div className="w-full h-px bg-slate-700/50 my-4"></div>

              {/* PDF BUTTON */}
              <a 
                href={MANUAL_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-amber-500 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm mb-2"
              >
                <BookOpen size={18} />
                Acessar M.U.N.E. em PDF
              </a>

              {/* SMALL TEXT */}
              <p className="text-[10px] text-slate-500 mb-2 max-w-[200px] leading-tight mx-auto">
                 Este app foi baseado no sistema M.U.N.E. disponível no botão acima.
              </p>
              <p className="text-[10px] text-slate-500 mb-2 max-w-[200px] leading-tight mx-auto">
                 Ícones por <a href="https://game-icons.net/" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-amber-500 underline">Game-Icons.Net</a> sob licença CC BY 3.0.
              </p>

              <button 
                onClick={() => { play('CLICK'); setShowHelp(false); }}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-on-primary font-bold rounded-lg transition-colors shadow-lg shadow-amber-900/20"
              >
                Entendi
              </button>
           </div>
        </div>
      )}

      {/* Bottom Navigation (Portrait Only) */}
      {currentAdventureId && !showSettings && (
        <nav className="flex-none h-16 bg-slate-950 border-t border-slate-800 grid grid-cols-5 pb-safe z-30 animate-in slide-in-from-bottom duration-300 landscape:hidden">
          <NavButton 
            active={activeTab === Tab.ORACLE} 
            onClick={() => setActiveTab(Tab.ORACLE)}
            icon={<MessageSquare size={20} />}
            label="Oráculo"
          />
          <NavButton 
            active={activeTab === Tab.TOOLS} 
            onClick={() => setActiveTab(Tab.TOOLS)}
            icon={<Wrench size={20} />}
            label="Coleções"
          />
          <NavButton 
            active={activeTab === Tab.PERSONA} 
            onClick={() => setActiveTab(Tab.PERSONA)}
            icon={<User size={20} />}
            label="Persona"
          />
          <NavButton 
            active={activeTab === Tab.DICE} 
            onClick={() => setActiveTab(Tab.DICE)}
            icon={<Dices size={20} />}
            label="Dados"
          />
          <NavButton 
            active={activeTab === Tab.LOG} 
            onClick={() => setActiveTab(Tab.LOG)}
            icon={<ScrollText size={20} />}
            label="Log"
            badge={activeAdventure?.logs.length || 0}
          />
        </nav>
      )}

      {/* Restore Confirmation Modal (Replaces native window.confirm for Mobile) */}
      {pendingImportData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
              <UploadCloud size={24} className="text-amber-500" />
              Confirmar Restauração?
            </h3>
            
            <div className="bg-slate-900/50 p-3 rounded-lg mb-4 border border-slate-800">
               <p className="text-sm text-slate-300 mb-2 font-bold uppercase tracking-wider">
                 Conteúdo do Arquivo:
               </p>
               <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                 <li><strong className="text-slate-100">{pendingImportData.adventures.length}</strong> Aventuras</li>
                 <li>
                   <strong className="text-slate-100">
                      {pendingImportData.adventures.reduce((acc, a) => acc + (a?.threads?.length || 0) + (a?.npcs?.length || 0), 0)}
                   </strong> Tramas e NPCs
                 </li>
                 <li>
                   <strong className="text-slate-100">
                     {(pendingImportData.collections || []).filter(c => !c.isBuiltIn).length}
                   </strong> Coleções Customizadas
                 </li>
                 <li>
                   <strong className="text-slate-100">
                     {pendingImportData.adventures.reduce((acc, a) => acc + (a?.characters?.length || 0), 0)}
                   </strong> Personagens
                 </li>
                 <li>
                   <strong className="text-slate-100">
                     {pendingImportData.adventures.reduce((acc, a) => acc + (a?.logs?.length || 0), 0)}
                   </strong> Logs
                 </li>
               </ul>
            </div>

            <p className="text-xs text-amber-500/80 mb-6 border-l-2 border-amber-500 pl-3">
              Atenção: Isso substituirá suas aventuras atuais. Coleções padrão do sistema serão mantidas.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => { play('CLICK'); cancelImport(); }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { play('CLICK'); confirmImport(); }}
                className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-on-primary rounded-lg font-bold text-sm transition-colors shadow-lg shadow-amber-900/20"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const NavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  vertical?: boolean;
}> = ({ active, onClick, icon, label, badge, vertical }) => {
  const { play } = useGameSound();
  
  return (
  <button
    onClick={() => { play('CLICK'); onClick(); }}
    title={label}
    className={`relative flex items-center justify-center transition-colors ${
      vertical 
        ? 'flex-col p-2 w-full rounded-lg hover:bg-slate-800' 
        : 'flex-col gap-1'
    } ${
      active ? 'text-amber-500 bg-slate-900/50' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {icon}
    {/* Hide label in vertical mode if space is tight, currently showing very small */}
    <span className={`font-bold uppercase truncate max-w-full px-1 ${vertical ? 'hidden' : 'text-[9px] sm:text-[10px]'}`}>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute top-1 right-1 sm:right-4 w-4 h-4 bg-red-600 text-slate-100 text-[9px] flex items-center justify-center rounded-full shadow-sm border border-slate-900">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
  );
};

const App: React.FC = () => {
  return (
    <SoundProvider>
      <AppContent />
    </SoundProvider>
  );
};

export default App;
