
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
    <div className="flex flex-col h-full bg-slate-900 p-4 overflow-y-auto animate-in fade-in slide-in-from-right duration-300">
      
      {/* Conteúdo Principal */}
      <div className="flex-1 max-w-lg mx-auto w-full space-y-6 mt-2">
        
        {/* Seção de Preferências (Som e Tema) */}
        <section>
          <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
            <Volume2 size={16} /> Preferências
          </h3>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg p-4 space-y-4">
             {/* Sound Toggle */}
             <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-xl ${isSoundEnabled ? 'bg-amber-900/30 text-amber-500' : 'bg-slate-700 text-slate-400'}`}>
                      {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                   </div>
                   <div>
                      <h4 className="text-base font-bold text-slate-100">Efeitos Sonoros</h4>
                      <p className="text-xs text-slate-400">Sons de dados e interações.</p>
                   </div>
                </div>
                
                <button 
                  onClick={() => { play('CLICK'); toggleSound(); }}
                  className={`w-12 h-7 rounded-full relative transition-colors duration-300 ease-in-out border border-slate-600 ${isSoundEnabled ? 'bg-amber-600 border-amber-500' : 'bg-slate-900'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${isSoundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
             </div>

             {/* Theme Selector */}
             <div className="pt-4">
                <div className="flex items-center gap-3 mb-3">
                   <div className="p-2 rounded-xl bg-slate-700 text-slate-400">
                      <Palette size={20} />
                   </div>
                   <div>
                      <h4 className="text-base font-bold text-slate-100">Tema Visual</h4>
                      <p className="text-xs text-slate-400">Personalize a aparência.</p>
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
                        className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${currentTheme === t.id ? 'bg-amber-600/20 border-amber-500 text-amber-500 ring-1 ring-amber-500' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
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
          <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
            <Database size={16} /> Gestão de Dados
          </h3>
          
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 flex-none">
                  <CloudCog size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-100">Backup & Restauração</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    Seus dados ficam salvos apenas neste dispositivo. Adicione os botões abaixo para salvar seus dados e restaurar backups em outro dispositivo.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-700/50">
              <button 
                onClick={() => { play('CLICK'); onBackup(); }}
                className="p-4 hover:bg-slate-700/50 transition-colors flex flex-col items-center justify-center gap-2 group active:bg-slate-700"
              >
                <div className="p-2 bg-slate-900 rounded-full group-hover:scale-110 transition-transform shadow-inner">
                  <Download size={20} className="text-amber-500" />
                </div>
                <div className="text-center">
                  <span className="block font-bold text-slate-200 text-sm">Backup</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Exportar JSON</span>
                </div>
              </button>

              <button 
                onClick={() => { play('CLICK'); onRestoreTrigger(); }}
                className="p-4 hover:bg-slate-700/50 transition-colors flex flex-col items-center justify-center gap-2 group active:bg-slate-700 relative overflow-hidden"
              >
                {importStatus ? (
                  <div className="absolute inset-0 bg-green-900/20 flex flex-col items-center justify-center animate-in zoom-in">
                    <Check size={24} className="text-green-500 mb-1" />
                    <span className="font-bold text-green-500 text-sm">{importStatus}</span>
                  </div>
                ) : (
                  <>
                    <div className="p-2 bg-slate-900 rounded-full group-hover:scale-110 transition-transform shadow-inner">
                      <Upload size={20} className="text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <span className="block font-bold text-slate-200 text-sm">Restaurar</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Importar JSON</span>
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
        <div className="w-12 h-1 bg-slate-800 rounded-full mb-1"></div>
        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
          v1.0.6
        </span>
        <p className="text-[10px] font-medium text-slate-500 font-mono uppercase tracking-widest">
          Conjurado por André Ricardo Voidelo
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
