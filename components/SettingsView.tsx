
import React, { useState } from 'react';
import { Database, Download, Upload, Check, CloudCog, Sun, Moon, Volume2, VolumeX, Palette, Plus, Edit2, Trash2 } from 'lucide-react';
import { useSoundSettings } from '../contexts/SoundContext';
import { useGameSound } from '../hooks/useGameSound';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeEditor } from './ThemeEditor';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { AppTheme } from '../types';

interface SettingsViewProps {
  onBackup: () => void;
  onRestoreTrigger: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  importStatus: string | null;
  onRestoreAction: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  onBackup, 
  onRestoreTrigger, 
  fileInputRef, 
  importStatus, 
  onRestoreAction
}) => {
  const { isSoundEnabled, toggleSound } = useSoundSettings();
  const { activeThemeId, setActiveTheme, allThemes, addTheme, updateTheme, deleteTheme } = useTheme();
  const { play } = useGameSound();
  
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [themeToEdit, setThemeToEdit] = useState<AppTheme | undefined>(undefined);
  const [themeToDelete, setThemeToDelete] = useState<AppTheme | null>(null);

  const activeTheme = allThemes.find(t => t.id === activeThemeId);

  const handleNewTheme = () => {
    // Clone colors from active theme (or default if none) to serve as a template
    const templateTheme = activeTheme ? { 
        name: '', 
        colors: { ...activeTheme.colors },
        id: '', // Placeholder
        isBuiltIn: false
    } : undefined;
    
    setThemeToEdit(templateTheme as AppTheme);
    setShowThemeEditor(true);
  };

  const handleEditTheme = () => {
    if (activeTheme && !activeTheme.isBuiltIn) {
      setThemeToEdit(activeTheme);
      setShowThemeEditor(true);
    }
  };

  const handleDeleteTheme = () => {
    if (activeTheme && !activeTheme.isBuiltIn) {
      setThemeToDelete(activeTheme);
    }
  };

  const confirmDeleteTheme = () => {
    if (themeToDelete) {
      deleteTheme(themeToDelete.id);
      setThemeToDelete(null);
    }
  };

  const handleSaveTheme = (themeData: Omit<AppTheme, 'id' | 'isBuiltIn'>) => {
    if (themeToEdit && themeToEdit.id) {
      updateTheme(themeToEdit.id, themeData);
    } else {
      addTheme(themeData);
    }
    setShowThemeEditor(false);
  };

  return (
    <div className="flex flex-col h-full bg-app p-4 pb-safe-area overflow-y-auto animate-in fade-in slide-in-from-right duration-300">
      
      {/* Conteúdo Principal */}
      <div className="flex-1 max-w-lg mx-auto w-full space-y-6 mt-2">
        
        {/* Seção de Preferências (Som e Tema) */}
        <section>
          <h3 className="text-txt-muted font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
            <Volume2 size={16} /> Preferências
          </h3>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg p-4 space-y-4">
             {/* Sound Toggle */}
             <div className="flex items-center justify-between border-b border-border/50 pb-4">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-xl ${isSoundEnabled ? 'bg-primary/30 text-primary' : 'bg-card-hover text-txt-muted'}`}>
                      {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                   </div>
                   <div>
                      <h4 className="text-base font-bold text-txt-main">Efeitos Sonoros</h4>
                      <p className="text-xs text-txt-muted">Sons de dados e interações.</p>
                   </div>
                </div>
                
                <button 
                  onClick={() => { play('CLICK'); toggleSound(); }}
                  className={`w-12 h-7 rounded-full relative transition-colors duration-300 ease-in-out border border-border ${isSoundEnabled ? 'bg-primary border-primary' : 'bg-app'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-on-primary rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${isSoundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
             </div>

             {/* Theme Selector (New UI) */}
             <div className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                   <div className="p-2 rounded-xl bg-card-hover text-txt-muted">
                      <Palette size={20} />
                   </div>
                   <div>
                      <h4 className="text-base font-bold text-txt-main">Tema Visual</h4>
                      <p className="text-xs text-txt-muted">Personalize a aparência do app.</p>
                   </div>
                </div>
                
                <div className="flex gap-2">
                   <div className="relative flex-1">
                     <select 
                        value={activeThemeId}
                        onChange={(e) => { play('CLICK'); setActiveTheme(e.target.value); }}
                        className="w-full appearance-none bg-app border border-border rounded-xl px-4 py-3 text-sm font-bold text-txt-main outline-none focus:border-primary transition-colors"
                     >
                        <optgroup label="Padrão">
                          {allThemes.filter(t => t.isBuiltIn).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </optgroup>
                        {allThemes.some(t => !t.isBuiltIn) && (
                          <optgroup label="Customizados">
                            {allThemes.filter(t => !t.isBuiltIn).map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </optgroup>
                        )}
                     </select>
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-txt-muted">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                     </div>
                   </div>

                   {/* Action Buttons */}
                   {activeTheme && !activeTheme.isBuiltIn ? (
                     <>
                        <button 
                          onClick={() => { play('CLICK'); handleEditTheme(); }}
                          className="p-3 bg-card-hover hover:bg-border text-txt-main rounded-xl transition-colors border border-border"
                          title="Editar Tema"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => { play('CLICK'); handleDeleteTheme(); }}
                          className="p-3 bg-card-hover hover:bg-error/20 text-txt-muted hover:text-error rounded-xl transition-colors border border-border"
                          title="Excluir Tema"
                        >
                          <Trash2 size={18} />
                        </button>
                     </>
                   ) : (
                     <div className="w-[100px] flex items-center justify-end px-2">
                       <span className="text-[10px] uppercase font-bold text-txt-muted opacity-50">Sistema</span>
                     </div>
                   )}
                   
                   <button 
                      onClick={() => { play('CLICK'); handleNewTheme(); }}
                      className="w-11 h-11 flex items-center justify-center bg-primary hover:bg-primary-hover text-on-primary rounded-full shadow-lg transition-colors active:scale-95 flex-none"
                      title="Novo Tema"
                   >
                      <Plus size={24} />
                   </button>
                </div>
             </div>
          </div>
        </section>

        {/* Seção de Dados */}
        <section>
          <h3 className="text-txt-muted font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
            <Database size={16} /> Gestão de Dados
          </h3>
          
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 flex-none">
                  <CloudCog size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-txt-main">Backup & Restauração</h4>
                  <p className="text-xs text-txt-muted mt-0.5 leading-snug">
                    Seus dados ficam salvos apenas neste dispositivo. Adicione os botões abaixo para salvar seus dados e restaurar backups em outro dispositivo.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-border/50">
              <button 
                onClick={() => { play('CLICK'); onBackup(); }}
                className="p-4 hover:bg-border/50 transition-colors flex flex-col items-center justify-center gap-2 group active:bg-border"
              >
                <div className="p-2 bg-app rounded-full group-hover:scale-110 transition-transform shadow-inner">
                  <Download size={20} className="text-primary" />
                </div>
                <div className="text-center">
                  <span className="block font-bold text-txt-main text-sm">Backup</span>
                  <span className="text-[10px] uppercase font-bold text-txt-muted tracking-wider">Exportar .mune</span>
                </div>
              </button>

              <button 
                onClick={() => { play('CLICK'); onRestoreTrigger(); }}
                className="p-4 hover:bg-border/50 transition-colors flex flex-col items-center justify-center gap-2 group active:bg-border relative overflow-hidden"
              >
                {importStatus ? (
                  <div className="absolute inset-0 bg-success/20 flex flex-col items-center justify-center animate-in zoom-in">
                    <Check size={24} className="text-success mb-1" />
                    <span className="font-bold text-success text-sm">{importStatus}</span>
                  </div>
                ) : (
                  <>
                    <div className="p-2 bg-app rounded-full group-hover:scale-110 transition-transform shadow-inner">
                      <Upload size={20} className="text-success" />
                    </div>
                    <div className="text-center">
                      <span className="block font-bold text-txt-main text-sm">Restaurar</span>
                      <span className="text-[10px] uppercase font-bold text-txt-muted tracking-wider">Importar .mune</span>
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Input Oculto para Importação */}
        <input 
          type="file" 
          accept=".mune, .json, application/json, application/octet-stream, *.*" 
          ref={fileInputRef as React.LegacyRef<HTMLInputElement>}
          onChange={onRestoreAction} 
          style={{ display: 'none' }}
        />

        {/* Theme Editor Modal */}
        {showThemeEditor && (
          <ThemeEditor 
            initialTheme={themeToEdit}
            onSave={handleSaveTheme}
            onCancel={() => setShowThemeEditor(false)}
          />
        )}

        <ConfirmDeleteModal 
          isOpen={!!themeToDelete}
          title="Excluir Tema"
          description={
            <>
              Tem certeza que deseja excluir permanentemente o tema <strong>{themeToDelete?.name}</strong>?
              <br/>
              <span className="text-xs text-txt-dim mt-1 block">Esta ação não pode ser desfeita.</span>
            </>
          }
          onConfirm={confirmDeleteTheme}
          onCancel={() => setThemeToDelete(null)}
        />

      </div>

      {/* Rodapé com Créditos */}
      <div className="pt-4 pb-8 flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity space-y-2 flex-none">
        <div className="w-12 h-1 bg-card rounded-full mb-1"></div>
        <span className="px-2 py-0.5 rounded bg-card border border-border text-[10px] font-mono text-txt-muted">
          v0.9.6
        </span>
        <p className="text-[10px] font-medium text-txt-muted font-mono uppercase tracking-widest">
          André Ricardo Voidelo
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
