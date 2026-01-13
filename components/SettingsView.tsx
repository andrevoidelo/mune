
import React from 'react';
import { Database, Download, Upload, Check, CloudCog, Sun, Moon, Volume2, VolumeX, Palette } from 'lucide-react';
import { useSoundSettings } from '../contexts/SoundContext';
import { useGameSound } from '../hooks/useGameSound';

interface SettingsViewProps {
  onBackup: () => void;
  onRestoreTrigger: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  importStatus: string | null;
  onRestoreAction: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentTheme: string;
  setTheme: (t: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  onBackup, 
  onRestoreTrigger, 
  fileInputRef, 
  importStatus, 
  onRestoreAction,
  currentTheme,
  setTheme
}) => {
  const { isSoundEnabled, toggleSound } = useSoundSettings();
  const { play } = useGameSound();

  return (
    <div className="flex flex-col h-full bg-app p-4 overflow-y-auto animate-in fade-in slide-in-from-right duration-300">
      
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

             {/* Theme Selector */}
             <div className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                   <div className="p-2 rounded-xl bg-card-hover text-txt-muted">
                      <Palette size={20} />
                   </div>
                   <div>
                      <h4 className="text-base font-bold text-txt-main">Tema Visual</h4>
                      <p className="text-xs text-txt-muted">Personalize a aparência.</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                   {[
                     { id: 'default', name: 'Padrão', color: 'bg-slate-900 border-slate-700' },
                     { id: 'light', name: 'Claro', color: 'bg-stone-100 border-stone-300' },
                     { id: 'fantasy', name: 'Fantasia', color: 'bg-[#292524] border-[#44403c]' },
                     { id: 'scifi', name: 'Sci-Fi', color: 'bg-sky-950 border-sky-800' },
                     { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-purple-950 border-purple-800' },
                     { id: 'terminal', name: 'Terminal', color: 'bg-black border-green-900' },
                   ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => { play('CLICK'); setTheme(t.id); }}
                        className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${currentTheme === t.id ? 'bg-primary/20 border-primary text-primary ring-1 ring-primary' : 'bg-app border-border text-txt-muted hover:bg-card hover:text-txt-main'}`}
                      >
                         <div className={`w-6 h-6 rounded-full border shadow-sm ${t.color}`} />
                         <span className="text-[10px] font-bold uppercase tracking-wider">{t.name}</span>
                      </button>
                   ))}
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
                  <span className="text-[10px] uppercase font-bold text-txt-muted tracking-wider">Exportar JSON</span>
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
                      <span className="text-[10px] uppercase font-bold text-txt-muted tracking-wider">Importar JSON</span>
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
          accept="application/json, .json" 
          ref={fileInputRef as React.LegacyRef<HTMLInputElement>}
          onChange={onRestoreAction} 
          style={{ display: 'none' }}
        />

      </div>

      {/* Rodapé com Créditos */}
      <div className="mt-auto pt-6 pb-4 flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-opacity space-y-2 flex-none">
        <div className="w-12 h-1 bg-card rounded-full mb-1"></div>
        <span className="px-2 py-0.5 rounded bg-card border border-border text-[10px] font-mono text-txt-muted">
          v1.0.6
        </span>
        <p className="text-[10px] font-medium text-txt-muted font-mono uppercase tracking-widest">
          Conjurado por André Ricardo Voidelo
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
