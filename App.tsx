import React, { useState, useRef, useEffect } from 'react';
import { Howler } from 'howler';
import { Tab, LogEntry, Character, Adventure, Collection, AppTheme, WikiEntry, CustomCategory } from './types';
import OracleView from './components/OracleView';
import ToolsView from './components/ToolsView';
import WikiView from './components/WikiView';
import DiceView from './components/DiceView';
import LogView from './components/LogView';
import PersonaView from './components/PersonaView';
import SettingsView from './components/SettingsView';
import NoteModal from './components/NoteModal';
import DraggableFab from './components/DraggableFab';
import ImageEditorModal from './components/ImageEditorModal';
import ImageUploadArea from './components/ImageUploadArea';
import HelpView from './components/HelpView';
import { MessageSquare, Wrench, Dices, ScrollText, HelpCircle, X, User, ChevronLeft, Plus, Calendar, Trash2, Edit2, Play, Save, Settings, BookOpen, UploadCloud, Image as ImageIcon, Upload, Search } from 'lucide-react';
import { generateUUID, generateSlug } from './utils';
import { DEFAULT_COLLECTIONS } from './constants';
import { exportTextFile } from './utils/exportUtils';
import { SoundProvider } from './contexts/SoundContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useGameSound } from './hooks/useGameSound';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { useBackButton } from './hooks/useBackButton';
import { App as CapacitorApp } from '@capacitor/app';

import { initCapacitor } from './capacitorInit';

const AppContent: React.FC = () => {
  const { play } = useGameSound();
  const { customThemes, addTheme, restoreThemes } = useTheme();
  
  // --- Back Button Handling ---
  useBackButton(() => {
    // 1. Priority: Global Modals
    if (showNoteModal) {
      setShowNoteModal(false);
      return true;
    }
    if (showSettings) {
      setShowSettings(false);
      return true;
    }
    if (showHelp) {
      setShowHelp(false);
      return true;
    }
    if (isEditingAdv) {
      setIsEditingAdv(false);
      return true;
    }
    if (advToDelete) {
      setAdvToDelete(null);
      return true;
    }
    if (pendingImportData) {
      setPendingImportData(null);
      return true;
    }

    // 2. Priority: Navigation (Adventure -> Home)
    if (currentAdventureId) {
      setCurrentAdventureId(null);
      return true;
    }

    // 3. Fallback: Exit App (Home Screen)
    // We return false to let the master listener handle the exit or do it explicitly here.
    // If we return true, we block exit. 
    // The master listener exits if stack is empty, but we are in the stack.
    // So we should call exit here.
    if (!currentAdventureId && !showSettings) {
        CapacitorApp.exitApp();
        return true;
    }

    return false;
  });

  // Audio Context Unlocker
  useEffect(() => {
    const unlockAudio = () => {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
      // Remove listeners once we've attempted to unlock
      ['click', 'touchstart', 'keydown'].forEach(event => 
        document.removeEventListener(event, unlockAudio)
      );
    };

    ['click', 'touchstart', 'keydown'].forEach(event => 
      document.addEventListener(event, unlockAudio)
    );

    return () => {
      ['click', 'touchstart', 'keydown'].forEach(event => 
        document.removeEventListener(event, unlockAudio)
      );
    };
  }, []);

  // Initialize Capacitor native settings (safe area, status bar)
  useEffect(() => {
    initCapacitor();
  }, []);

  // Global State
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [currentAdventureId, setCurrentAdventureId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // App View State
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ORACLE);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [adventureSearchQuery, setAdventureSearchQuery] = useState('');

  // Adventure Management State
  const [isEditingAdv, setIsEditingAdv] = useState(false);
  const [advFormData, setAdvFormData] = useState<{id?: string, name: string, description: string, coverUrl?: string}>({ name: '', description: '' });
  const [advToDelete, setAdvToDelete] = useState<string | null>(null);
  
  // Wiki Navigation State
  const [wikiTargetId, setWikiTargetId] = useState<string | null>(null);
  const [logTargetId, setLogTargetId] = useState<string | null>(null);

  const handleNavigateToWiki = (entryId: string | null, createSlug?: string) => {
      if (entryId) {
          setWikiTargetId(entryId);
      } else if (createSlug) {
          setWikiTargetId(`CREATE:${createSlug}`);
      }
      setActiveTab(Tab.WIKI);
  };

  const handleNavigateToLog = (logId: string) => {
      setLogTargetId(logId);
      setActiveTab(Tab.LOG);
  };

  const handleUpdateReferences = (oldSlug: string, newSlug: string) => {
    if (!activeAdventure) return;

    // We need to update both @mentions and #tags
    // Regex matches the slug as a whole word
    const mentionRegex = new RegExp(`@${oldSlug}\\b`, 'gi');
    const mentionReplacement = `@${newSlug}`;

    const tagRegex = new RegExp(`#${oldSlug}\\b`, 'gi');
    const tagReplacement = `#${newSlug}`;

    // Update Logs
    const updatedLogs = activeAdventure.logs.map(log => {
      let changed = false;
      let newResult = log.result;
      let newDetails = log.details;

      if (newResult) {
        if (mentionRegex.test(newResult)) {
          newResult = newResult.replace(mentionRegex, mentionReplacement);
          changed = true;
        }
        if (tagRegex.test(newResult)) {
          newResult = newResult.replace(tagRegex, tagReplacement);
          changed = true;
        }
      }
      
      if (newDetails) {
        if (mentionRegex.test(newDetails)) {
          newDetails = newDetails.replace(mentionRegex, mentionReplacement);
          changed = true;
        }
        if (tagRegex.test(newDetails)) {
          newDetails = newDetails.replace(tagRegex, tagReplacement);
          changed = true;
        }
      }

      return changed ? { ...log, result: newResult, details: newDetails } : log;
    });

    // Update Wiki Entries (Backlinks)
    const updatedWiki = (activeAdventure.wiki || []).map(entry => {
      if (entry.content) {
        let newContent = entry.content;
        let changed = false;

        if (mentionRegex.test(newContent)) {
          newContent = newContent.replace(mentionRegex, mentionReplacement);
          changed = true;
        }
        if (tagRegex.test(newContent)) {
          newContent = newContent.replace(tagRegex, tagReplacement);
          changed = true;
        }

        if (changed) {
            return { ...entry, content: newContent, updatedAt: Date.now() };
        }
      }
      return entry;
    });

    updateActiveAdventureData({ logs: updatedLogs, wiki: updatedWiki });
  };

  // Backup State
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [pendingImportData, setPendingImportData] = useState<{adventures: Adventure[], collections: Collection[], themes: AppTheme[]} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Image Editor State
  const [tempCoverImage, setTempCoverImage] = useState<string | null>(null);

  const MANUAL_URL = "https://drive.google.com/file/d/1mJbHcCNscMfs_NPnqMMz2Y8KiD8gWrkZ/view";

  // --- Persistence & Migration Logic ---

  useEffect(() => {
    // Load Global Settings
    const savedCollections = localStorage.getItem('mune_collections');
    if (savedCollections) setCollections(JSON.parse(savedCollections));

    // Load Adventures
    const savedAdventures = localStorage.getItem('mune_adventures');
    
    if (savedAdventures) {
      try {
        const parsed = JSON.parse(savedAdventures);
        const migrated = parsed.map((adv: any) => {
          const wiki = adv.wiki || [];
          const customCategories = adv.customCategories || [];

          // Migration: NPCs -> Wiki (Personagens)
          if (adv.npcs && adv.npcs.length > 0) {
             adv.npcs.forEach((npc: any) => {
                 const exists = wiki.some((e: any) => e.title === npc.name);
                 if (!exists) {
                     wiki.push({
                         id: generateUUID(),
                         title: npc.name,
                         slug: generateSlug(npc.name),
                         content: npc.notes || '',
                         category: 'PERSONAGENS',
                         tags: [],
                         createdAt: Date.now(),
                         updatedAt: Date.now(),
                         isAutoCreated: false
                     });
                 }
             });
          }

          // Migration: Threads -> Wiki (Eventos)
          if (adv.threads && adv.threads.length > 0) {
             adv.threads.forEach((thread: any) => {
                 const exists = wiki.some((e: any) => e.title === thread.name);
                 if (!exists) {
                     wiki.push({
                         id: generateUUID(),
                         title: thread.name,
                         slug: generateSlug(thread.name),
                         content: `Status: ${thread.status === 'OPEN' ? 'Em andamento' : 'Concluída'}`,
                         category: 'EVENTOS',
                         tags: [thread.status.toLowerCase()],
                         createdAt: Date.now(),
                         updatedAt: Date.now(),
                         isAutoCreated: false
                     });
                 }
             });
          }

          return {
            ...adv,
            wiki: wiki,
            customCategories: customCategories,
            clocks: adv.clocks || [],
            conflictState: adv.conflictState || {
              isActive: false,
              round: 1,
              turnIndex: 0,
              participants: []
            }
          };
        });
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
          wiki: [],
          customCategories: [],
          clocks: [],
          conflictState: {
            isActive: false,
            round: 1,
            turnIndex: 0,
            participants: []
          }
        };
        setAdventures([newAdv]);
        
        localStorage.removeItem('mune_logs');
        localStorage.removeItem('mune_personas');
      }
    }
    
    setIsLoaded(true);
  }, []);

  // Persist State
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('mune_adventures', JSON.stringify(adventures));
    }
  }, [adventures, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('mune_collections', JSON.stringify(collections));
    }
  }, [collections, isLoaded]);

  // Derived State: Sorted Adventures
  const sortedAdventures = React.useMemo(() => {
    return [...adventures].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
  }, [adventures]);


  // --- Global Data Management (Backup/Restore) ---

  const handleGlobalBackup = async () => {
    // Fix: Filter out built-in collections to avoid redundancy and version conflicts
    const customCollections = collections.filter(c => !c.isBuiltIn);

    const data = {
      version: 3,
      exportedAt: new Date().toISOString(),
      adventures: adventures,
      collections: customCollections,
      themes: customThemes
    };

    const fileName = `MUNE_Backup_${new Date().toISOString().slice(0, 10)}.mune`;
    const content = JSON.stringify(data, null, 2);
    
    await exportTextFile(content, fileName, 'application/json');
  };

  const handleImportTrigger = () => {
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
        let validThemes: AppTheme[] = [];

        if (data && typeof data === 'object' && Array.isArray(data.adventures)) {
           validAdventures = data.adventures;
           validCollections = data.collections || [];
           validThemes = data.themes || [];
        } 
        else if (data && typeof data === 'object' && (data.logs || data.characters)) {
           const legacyAdv: Adventure = {
              id: generateUUID(),
              name: 'Aventura Importada (Legado)',
              description: `Restaurada em ${new Date().toLocaleDateString()}.`,
              createdAt: Date.now(),
              lastPlayedAt: Date.now(),
              logs: Array.isArray(data.logs) ? data.logs : [],
              characters: Array.isArray(data.characters) ? data.characters : [],
              wiki: [],
              customCategories: [],
              clocks: []
           };
           validAdventures = [legacyAdv];
        }

        if (validAdventures.length > 0) {
           setPendingImportData({
             adventures: validAdventures,
             collections: validCollections,
             themes: validThemes
           });
        } else {
           const foundKeys = data ? Object.keys(data).join(', ') : 'null';
           alert(`Formato de arquivo não reconhecido.\nChaves encontradas: ${foundKeys}\n\nO sistema tentou detectar backups antigos mas falhou. Verifique se o arquivo está corrompido.`);
        }
      } catch (err) {
        alert('Erro ao processar o arquivo. Verifique se é um JSON válido.');
        console.error(err);
      }
    };

    reader.onloadend = () => {
       if (event.target) {
          event.target.value = '';
       }
    };

    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImportData) return;

    setAdventures(pendingImportData.adventures);
    const importedCustomCollections = (pendingImportData.collections || []).filter(c => !c.isBuiltIn);
    const mergedCollections = [...DEFAULT_COLLECTIONS, ...importedCustomCollections];
    setCollections(mergedCollections);

    if (pendingImportData.themes) {
        restoreThemes(pendingImportData.themes);
    }
    
    setPendingImportData(null);
    setImportStatus('Sucesso!');
    setTimeout(() => setImportStatus(null), 3000);
  };

  const cancelImport = () => {
    setPendingImportData(null);
  };

  // --- Adventure CRUD Helpers ---

  const handleCreateAdventure = () => {
    setAdvFormData({ name: '', description: '', coverUrl: '' });
    setIsEditingAdv(true);
  };

  const handleEditAdventure = (adv: Adventure, e: React.MouseEvent) => {
    e.stopPropagation();
    setAdvFormData({ id: adv.id, name: adv.name, description: adv.description, coverUrl: adv.coverUrl });
    setIsEditingAdv(true);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSaveAdventure = () => {
    if (!advFormData.name.trim()) return;

    if (advFormData.id) {
      // Edit existing
      setAdventures(prev => prev.map(a => a.id === advFormData.id ? {
        ...a,
        name: advFormData.name,
        description: advFormData.description,
        coverUrl: advFormData.coverUrl
      } : a));
    } else {
      // Create new
      const newAdv: Adventure = {
        id: generateUUID(),
        name: advFormData.name,
        description: advFormData.description,
        coverUrl: advFormData.coverUrl,
        createdAt: Date.now(),
        lastPlayedAt: Date.now(),
        logs: [],
        characters: [],
        wiki: [],
        customCategories: [],
        clocks: [],
        conflictState: {
          isActive: false,
          round: 1,
          turnIndex: 0,
          participants: []
        }
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
    setAdventures(prev => prev.map(a => a.id === id ? { ...a, lastPlayedAt: Date.now() } : a));
    setCurrentAdventureId(id);
    setActiveTab(Tab.ORACLE);
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

  const setWikiWrapper = (wiki: WikiEntry[]) => {
    updateActiveAdventureData({ wiki });
  };

  const setCustomCategoriesWrapper = (customCategories: CustomCategory[]) => {
    updateActiveAdventureData({ customCategories });
  };

  const setClocksWrapper = (value: React.SetStateAction<import('./types').Clock[]> | import('./types').Clock[]) => {
    if (!activeAdventure) return;
    const newClocks = typeof value === 'function'
      ? (value as (prev: import('./types').Clock[]) => import('./types').Clock[])(activeAdventure.clocks || [])
      : value;
    updateActiveAdventureData({ clocks: newClocks });
  };

  const setConflictStateWrapper = (newState: import('./types').ConflictState) => {
    updateActiveAdventureData({ conflictState: newState });
  };

  const unreadLogsCount = React.useMemo(() => {
    if (!activeAdventure) return 0;
    const lastViewed = activeAdventure.lastLogViewedAt || 0;
    return activeAdventure.logs.filter(log => log.timestamp > lastViewed).length;
  }, [activeAdventure]);

  const handleMarkLogRead = (timestamp: number) => {
    if (!activeAdventure || !currentAdventureId) return;
    if (timestamp > (activeAdventure.lastLogViewedAt || 0)) {
      updateActiveAdventureData({ lastLogViewedAt: timestamp });
    }
  };

  const handleAddNote = (text: string, image?: string, icon?: string, iconColor?: string, newWikiEntries?: WikiEntry[], details?: string) => {
     if (newWikiEntries && newWikiEntries.length > 0 && activeAdventure) {
         const updatedWiki = [...(activeAdventure.wiki || []), ...newWikiEntries];
         updateActiveAdventureData({ wiki: updatedWiki });
     }

     addLog({
       id: generateUUID(),
       timestamp: Date.now(),
       type: 'NOTE',
       title: 'Nota',
       result: text,
       imageUrl: image,
       icon,
       iconColor,
       details
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
        icon: <ScrollText size={32} className="text-primary" />
      };
    }

    switch (activeTab) {
      case Tab.ORACLE:
        return {
          title: "Oráculo",
          text: "O coração do sistema. Faça perguntas de 'Sim ou Não' e clique em Rolar para ver o resultado. A cada rolagem '6' (Sim, e...), você acumula 1 ponto. Com 3 pontos, há uma Intervenção do Oráculo na história. Use o botão 'Tramas & NPCs' para gerenciar pontos de enredo.",
          icon: <MessageSquare size={32} className="text-primary" />
        };
      case Tab.WIKI:
        return {
          title: "Acervo (Wiki)",
          text: "Sua base de conhecimento conectada. Crie entradas para Personagens, Locais e Itens. Use @Nome e #Tag para criar links automáticos entre as páginas. Tudo que você cria aqui pode ser referenciado rapidamente em suas notas.",
          icon: <BookOpen size={32} className="text-primary" />
        };
      case Tab.TOOLS:
        return {
          title: "Coleções",
          text: "Aqui você encontra tabelas aleatórias (como Presságio, Reação de NPC) e Baralhos de Cartas. Você pode criar suas próprias tabelas e baralhos personalizadas clicando em 'Criar Coleção'.",
          icon: <Wrench size={32} className="text-primary" />
        };
      case Tab.PERSONA:
        return {
          title: "Personagens",
          text: "Gerencie fichas de personagens. Adicione recursos (vida, mana, sorte, munição), atributos (força, agilidade, sabedoria), faça testes, gerencie inventário e adicione rolagens (dano, cura).",
          icon: <User size={32} className="text-primary" />
        };
      case Tab.DICE:
        return {
          title: "Dados",
          text: "Clique no botão ou digite fórmulas (ex: 2d20+5). 'KH' (Keep Highest) mantém os maiores dados (Vantagem). 'KL' (Keep Lowest) mantém os menores. Clique neles repetidamente para ajustar a quantidade (ex: kh1, kh2).",
          icon: <Dices size={32} className="text-primary" />
        };
      case Tab.LOG:
        return {
          title: "Registro (Log)",
          text: "Histórico automático. Você pode exportar como PDF (Impressora) ou Markdown (.md) para usar em Obsidian/Notion. Use o botão flutuante de Lápis para adicionar notas manuais e imagens.",
          icon: <ScrollText size={32} className="text-primary" />
        };
      default:
        return { title: "Ajuda", text: "Selecione uma aba.", icon: <HelpCircle /> };
    }
  };

  const helpContent = getHelpData();

  // --- RENDER: Adventure List (Home) ---

  const renderAdventureList = () => {
    const filteredAdventures = sortedAdventures.filter(adv => 
      adv.name.toLowerCase().includes(adventureSearchQuery.toLowerCase()) || 
      (adv.description || '').toLowerCase().includes(adventureSearchQuery.toLowerCase())
    );

    return (
    <div className="flex flex-col h-full bg-app text-txt-main overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-border bg-app/95 sticky top-0 z-10 backdrop-blur-sm h-16 shrink-0">
        <div className="flex items-center gap-2 flex-1 bg-card/50 border border-border rounded-lg px-3 py-2 mr-2 focus-within:border-primary transition-colors">
           <Search size={16} className="text-txt-dim" />
           <input 
             type="text" 
             value={adventureSearchQuery}
             onChange={(e) => setAdventureSearchQuery(e.target.value)}
             placeholder="Buscar aventura..." 
             className="bg-transparent border-none outline-none text-sm text-txt-main placeholder-txt-dim w-full"
           />
           {adventureSearchQuery && (
             <button onClick={() => setAdventureSearchQuery('')} className="text-txt-dim hover:text-txt-main">
               <X size={14} />
             </button>
           )}
        </div>
        <button 
          onClick={() => { play('CLICK'); handleCreateAdventure(); }}
          className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-hover transition-all rounded-xl flex items-center justify-center font-bold whitespace-nowrap uppercase tracking-wider text-[10px] shadow-sm active:scale-95"
        >
          <Plus size={16} className="mr-1" /> Nova
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-24 max-w-7xl mx-auto">
          {filteredAdventures.map((adv, index) => {
              const isLastPlayed = !adventureSearchQuery && index === 0;
              return (
              <div 
                key={adv.id}
                onClick={() => { play('CLICK'); handleSelectAdventure(adv.id); }}
                className={`bg-card border rounded-xl shadow-lg transition-all active:scale-[0.98] group cursor-pointer relative flex flex-col overflow-hidden aspect-[3/4] ${isLastPlayed ? 'border-primary ring-1 ring-primary shadow-primary/20' : 'border-border hover:border-primary/50'}`}
              >
                {adv.coverUrl && (
                  <div className="absolute inset-0 z-0">
                    <img src={adv.coverUrl} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-card/50" />
                  </div>
                )}

                {isLastPlayed && (
                   <div className="absolute bottom-0 left-0 bg-primary text-on-primary text-[9px] font-bold px-2 py-1 rounded-tr-lg shadow-sm z-10 uppercase tracking-wider">
                      Último Jogo
                   </div>
                )}

                <div className="flex-1 p-3 flex flex-col relative z-10">
                  <h3 className="text-sm font-bold text-txt-main group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-2 drop-shadow-md">
                    {adv.name}
                  </h3>
                  
                  <p className="text-xs text-txt-muted line-clamp-4 leading-relaxed flex-1">
                    {adv.description || <span className="italic opacity-50"></span>}
                  </p>
                </div>

                <div className="absolute bottom-2 right-2 flex gap-2 z-20">
                   <button 
                     onClick={(e) => { e.stopPropagation(); play('CLICK'); handleEditAdventure(adv, e); }}
                     className="w-8 h-8 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-md text-txt-muted hover:text-txt-main transition-all"
                   >
                     <Edit2 size={14} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); play('CLICK'); handleDeleteAdventure(adv.id, e); }}
                     className="w-8 h-8 flex items-center justify-center rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-md text-txt-muted hover:text-error transition-all"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            )})}
        </div>
      </div>

      {/* Modal: Create/Edit Adventure */}
      {isEditingAdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
               <button onClick={() => { play('CLICK'); setIsEditingAdv(false); }} className="p-2 text-txt-muted hover:text-txt-main hover:bg-card-hover rounded-full transition-colors"><X size={24} /></button>
               <h3 className="text-lg font-bold text-txt-main">
                 {advFormData.id ? 'Editar Aventura' : 'Nova Aventura'}
               </h3>
               <button 
                 onClick={() => { play('CLICK'); handleSaveAdventure(); }}
                 disabled={!advFormData.name.trim()}
                 className="p-2 bg-success/20 backdrop-blur-md text-success hover:bg-success/30 rounded-full shadow-lg pointer-events-auto transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                 title="Salvar"
               >
                 <Save size={24} />
               </button>
             </div>
             
             <div className="space-y-4">
               {/* Cover Image Upload Area */}
               <ImageUploadArea
                 imageUrl={advFormData.coverUrl}
                 onUpload={() => coverInputRef.current?.click()}
                 onClear={() => setAdvFormData(prev => ({ ...prev, coverUrl: undefined }))}
                 heightClass="h-40"
                 placeholderText="Adicionar Capa"
               />
               <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   ref={coverInputRef}
                   onChange={handleCoverUpload}
               />

               <div>
                 <label className="text-xs uppercase font-bold text-txt-muted block mb-1">Título</label>
                 <input 
                   type="text" 
                   value={advFormData.name}
                   onChange={e => setAdvFormData({...advFormData, name: e.target.value})}
                   className="w-full bg-app border border-border rounded p-3 text-txt-main focus:border-primary placeholder-txt-dim outline-none"
                   placeholder="Ex: A Tumba dos Horrores"
                 />
               </div>
               <div>
                 <label className="text-xs uppercase font-bold text-txt-muted block mb-1">Descrição</label>
                 <textarea 
                   value={advFormData.description}
                   onChange={e => setAdvFormData({...advFormData, description: e.target.value})}
                   className="w-full bg-app border border-border rounded p-3 text-txt-main focus:border-primary placeholder-txt-dim outline-none h-24 resize-none"
                   placeholder="Uma breve sinopse..."
                   />
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {advToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
             <h3 className="text-lg font-bold text-txt-main mb-2 flex items-center gap-2">
               <Trash2 className="text-error" /> Excluir Aventura?
             </h3>
             <p className="text-txt-muted text-sm mb-6">
               Isso apagará permanentemente todos os logs e personagens desta aventura.
             </p>
             <div className="flex gap-3">
               <button 
                 onClick={() => { play('CLICK'); setAdvToDelete(null); }}
                 className="flex-1 py-2 bg-card-hover text-txt-main rounded font-bold"
               >
                 Cancelar
               </button>
               <button 
                 onClick={() => { play('CLICK'); confirmDeleteAdventure(); }}
                 className="flex-1 py-2 bg-error text-slate-100 rounded font-bold"
               >
                 Excluir
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-app text-txt-main overflow-hidden relative pt-safe">
      {/* Header */}
      <header className="flex-none h-14 bg-card flex items-center justify-between px-4 border-b border-border shadow-md z-20 relative">
        <div className="flex items-center gap-3 min-w-0">
          {showSettings ? (
             <div className="flex items-center gap-2 animate-in slide-in-from-left duration-200 min-w-0">
                <button 
                  onClick={() => { play('CLICK'); setShowSettings(false); }}
                  className="p-1 ml-1 text-txt-muted hover:text-txt-main rounded-full hover:bg-card-hover transition-colors flex-none"
                >
                  <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold text-txt-main truncate">Configurações</h1>
             </div>
          ) : (
            <div className="flex items-center gap-3 min-w-0 animate-in fade-in duration-300">
              {currentAdventureId && (
                <button 
                  onClick={() => { play('CLICK'); setCurrentAdventureId(null); }}
                  className="p-1 ml-1 text-txt-muted hover:text-txt-main rounded-full hover:bg-card-hover transition-colors flex-none"
                >
                  <ChevronLeft size={24} />
                </button>
              )}

              {!currentAdventureId && (
                <div 
                  className="w-8 h-8 rounded-lg bg-primary flex-none"
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
                <h1 className="text-sm sm:text-lg font-bold tracking-wider text-primary uppercase truncate">
                  {currentAdventureId && activeAdventure ? activeAdventure.name : 'Mestre Mune'}
                </h1>
                {currentAdventureId && (
                  <span className="text-[10px] text-txt-dim uppercase font-bold tracking-widest leading-none">Em Aventura</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {!showSettings && !currentAdventureId && (
            <button 
              onClick={() => { play('CLICK'); setShowHelp(true); }}
              className="p-2 text-txt-muted hover:text-primary active:text-primary-active transition-colors rounded-full hover:bg-app"
              aria-label="Manual do Sistema"
            >
              <HelpCircle size={20} />
            </button>
          )}
          {!showSettings && (
            <button 
              onClick={() => { play('CLICK'); setShowSettings(true); }}
              className="p-2 text-txt-muted hover:text-primary active:text-primary-active transition-colors rounded-full hover:bg-app"
              aria-label="Configurações"
            >
              <Settings size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden flex-col min-h-0">
        
        <main className="flex-1 overflow-hidden relative w-full h-full min-h-0">
          {showSettings ? (
            <SettingsView 
              onBackup={handleGlobalBackup}
              onRestoreTrigger={handleImportTrigger}
              fileInputRef={fileInputRef}
              importStatus={importStatus}
              onRestoreAction={handleGlobalRestore}
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
                  activeSystem={activeAdventure.activeOracleSystem || 'MUNE'}
                  onSystemChange={(sys) => updateActiveAdventureData({ activeOracleSystem: sys })}
                />
              </div>

              <div className={activeTab === Tab.TOOLS ? 'h-full w-full' : 'hidden'}>
                <ToolsView 
                  addLog={addLog} 
                  collections={collections}
                  setCollections={setCollections}
                  clocks={activeAdventure.clocks || []}
                  setClocks={setClocksWrapper}
                  entries={activeAdventure.wiki || []}
                  onCreateEntries={(newEntries) => {
                      const currentWiki = activeAdventure.wiki || [];
                      updateActiveAdventureData({ wiki: [...newEntries, ...currentWiki] });
                  }}
                  onNavigateToWiki={handleNavigateToWiki}
                />
              </div>

              <div className={activeTab === Tab.DICE ? 'h-full w-full' : 'hidden'}>
                <DiceView addLog={addLog} />
              </div>

              <div className={activeTab === Tab.PERSONA ? 'h-full w-full' : 'hidden'}>
                <PersonaView 
                  characters={activeAdventure.characters} 
                  setCharacters={setCharactersWrapper} 
                  addLog={addLog}
                  conflictState={activeAdventure.conflictState || { isActive: false, round: 1, turnIndex: 0, participants: [] }}
                  setConflictState={setConflictStateWrapper}
                />
              </div>

              <div className={activeTab === Tab.WIKI ? 'h-full w-full' : 'hidden'}>
                <WikiView 
                  entries={activeAdventure.wiki || []}
                  setEntries={setWikiWrapper}
                  customCategories={activeAdventure.customCategories || []}
                  setCustomCategories={setCustomCategoriesWrapper}
                  collections={collections}
                  addLog={addLog}
                  targetEntryId={wikiTargetId}
                  onClearTarget={() => setWikiTargetId(null)}
                  onUpdateReferences={handleUpdateReferences}
                  logs={activeAdventure.logs || []}
                  onNavigateToLog={handleNavigateToLog}
                />
              </div>

              <div className={activeTab === Tab.LOG ? 'h-full w-full' : 'hidden'}>
                <LogView 
                  logs={activeAdventure.logs} 
                  adventureName={activeAdventure.name}
                  clearLogs={clearLogs} 
                  removeLog={removeLog} 
                  isActive={activeTab === Tab.LOG}
                  wikiEntries={activeAdventure.wiki || []}
                  onNavigateToWiki={handleNavigateToWiki}
                  targetLogId={logTargetId}
                  onClearTargetLog={() => setLogTargetId(null)}
                  onLogRead={handleMarkLogRead}
                  lastLogViewedAt={activeAdventure.lastLogViewedAt}
                />
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-error">Erro ao carregar aventura.</div>
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
          wikiEntries={activeAdventure?.wiki || []}
          customCategories={activeAdventure?.customCategories || []}
          collections={collections}
        />
      )}

      {/* HELP VIEW */}
      {showHelp && (
        <HelpView onClose={() => setShowHelp(false)} />
      )}

      {/* Bottom Navigation (Portrait Only) */}
      {currentAdventureId && !showSettings && (
        <nav className="flex-none bg-card border-t border-border z-30 animate-in slide-in-from-bottom duration-300 pb-safe-area">
          <div className="grid grid-cols-6 h-16">
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
              label="Ferramentas"
            />
            <NavButton 
              active={activeTab === Tab.DICE} 
              onClick={() => setActiveTab(Tab.DICE)}
              icon={<Dices size={20} />}
              label="Dados"
            />
            <NavButton 
              active={activeTab === Tab.PERSONA} 
              onClick={() => setActiveTab(Tab.PERSONA)}
              icon={<User size={20} />}
              label="Persona"
            />
            <NavButton 
              active={activeTab === Tab.WIKI} 
              onClick={() => setActiveTab(Tab.WIKI)}
              icon={<BookOpen size={20} />}
              label="Acervo"
            />
            <NavButton 
              active={activeTab === Tab.LOG} 
              onClick={() => setActiveTab(Tab.LOG)}
              icon={<ScrollText size={20} />}
              label="Log"
              badge={unreadLogsCount}
            />
          </div>
        </nav>
      )}

      {/* Restore Confirmation Modal (Replaces native window.confirm for Mobile) */}
      {pendingImportData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-txt-main mb-3 flex items-center gap-2">
              <UploadCloud size={24} className="text-primary" />
              Confirmar Restauração?
            </h3>
            
            <div className="bg-app/50 p-3 rounded-lg mb-4 border border-card">
               <p className="text-sm text-txt-muted mb-2 font-bold uppercase tracking-wider">
                 Conteúdo do Arquivo:
               </p>
               <ul className="text-xs text-txt-muted list-disc list-inside space-y-1">
                 <li><strong className="text-txt-main">{pendingImportData.adventures.length}</strong> Aventuras</li>
                 <li>
                   <strong className="text-txt-main">
                     {(pendingImportData.collections || []).filter(c => !c.isBuiltIn).length}
                   </strong> Coleções Customizadas
                 </li>
                 <li>
                   <strong className="text-txt-main">
                     {pendingImportData.adventures.reduce((acc, a) => acc + (a?.characters?.length || 0), 0)}
                   </strong> Personagens
                 </li>
                 <li>
                   <strong className="text-txt-main">
                     {pendingImportData.adventures.reduce((acc, a) => acc + (a?.logs?.length || 0), 0)}
                   </strong> Logs
                 </li>
               </ul>
            </div>

            <p className="text-xs text-primary/80 mb-6 border-l-2 border-primary pl-3">
              Atenção: Isso substituirá suas aventuras atuais. Coleções padrão do sistema serão mantidas.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => { play('CLICK'); cancelImport(); }}
                className="flex-1 px-4 py-3 bg-card-hover hover:bg-border text-txt-main rounded-lg font-bold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { play('CLICK'); confirmImport(); }}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-hover text-on-primary rounded-lg font-bold text-sm transition-colors shadow-lg shadow-primary/20"
              >
                Sim, Restaurar
              </button>
            </div>
          </div>
        </div>
      )}

      {tempCoverImage && (
        <ImageEditorModal 
          imageSrc={tempCoverImage}
          aspectRatio={3/4}
          onCancel={() => setTempCoverImage(null)}
          onSave={(cropped) => {
            setAdvFormData(prev => ({ ...prev, coverUrl: cropped }));
            setTempCoverImage(null);
          }}
        />
      )}

    </div>
  );
};

const NavButton: React.FC <{
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
        ? 'flex-col p-2 w-full rounded-lg hover:bg-card-hover' 
        : 'flex-col gap-1'
    } ${ 
      active ? 'text-primary bg-app/50' : 'text-txt-muted hover:text-txt-main'
    }`}
  >
    {icon}
    {/* Hide label in vertical mode if space is tight, currently showing very small */}
    <span className={`font-bold uppercase truncate max-w-full px-1 ${vertical ? 'hidden' : 'text-[9px] sm:text-[10px]'}`}>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute top-1 right-1 sm:right-4 w-4 h-4 bg-error text-slate-100 text-[9px] flex items-center justify-center rounded-full shadow-sm border border-app">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SoundProvider>
        <AppContent />
      </SoundProvider>
    </ThemeProvider>
  );
};

export default App;