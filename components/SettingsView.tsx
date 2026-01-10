
import React from 'react';
import { Database, Download, Upload, Check, CloudCog, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { useSoundSettings } from '../contexts/SoundContext';

interface SettingsViewProps {
  onBackup: () => void;
  onRestoreTrigger: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  importStatus: string | null;
  onRestoreAction: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isPaperMode: boolean;
  setIsPaperMode: (v: boolean) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  onBackup, 
  onRestoreTrigger, 
  fileInputRef, 
  importStatus, 
  onRestoreAction,
  isPaperMode,
  setIsPaperMode
}) => {
  const { isSoundEnabled, toggleSound } = useSoundSettings();

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
                      <h4 className="text-base font-bold text-white">Efeitos Sonoros</h4>
                      <p className="text-xs text-slate-400">Sons de dados e interações.</p>
                   </div>
                </div>
                
                <button 
                  onClick={toggleSound}
                  className={`w-12 h-7 rounded-full relative transition-colors duration-300 ease-in-out border border-slate-600 ${isSoundEnabled ? 'bg-amber-600 border-amber-500' : 'bg-slate-900'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${isSoundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
             </div>

             {/* Theme Toggle */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-xl ${isPaperMode ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-700 text-slate-400'}`}>
                      {isPaperMode ? <Sun size={20} /> : <Moon size={20} />}
                   </div>
                   <div>
                      <h4 className="text-base font-bold text-white">Modo Papel</h4>
                      <p className="text-xs text-slate-400">Alto contraste e fundo claro.</p>
                   </div>
                </div>
                
                <button 
                  onClick={() => setIsPaperMode(!isPaperMode)}
                  className={`w-12 h-7 rounded-full relative transition-colors duration-300 ease-in-out border border-slate-600 ${isPaperMode ? 'bg-indigo-100 border-indigo-300' : 'bg-slate-900'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${isPaperMode ? 'translate-x-5 bg-indigo-500 text-white' : 'translate-x-0 bg-slate-500 text-slate-200'}`}>
                     {isPaperMode ? <Sun size={12} /> : <Moon size={12} />}
                  </div>
                </button>
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
                  <h4 className="text-base font-bold text-white">Backup & Restauração</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    Seus dados ficam salvos apenas neste dispositivo. Adicione os botões abaixo para salvar seus dados e restaurar backups em outro dispositivo.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-700/50">
              <button 
                onClick={onBackup}
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
                onClick={onRestoreTrigger}
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
          v1.0.5
        </span>
        <p className="text-[10px] font-medium text-slate-500 font-mono uppercase tracking-widest">
          Conjurado por André Ricardo Voidelo
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
