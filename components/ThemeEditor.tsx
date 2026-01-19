import React, { useState } from 'react';
import { AppTheme } from '../types';
import { X, Save, Dices, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BUILT_IN_THEMES } from '../constants';
import { ColorPicker } from './ColorPicker';

interface ThemeEditorProps {
  initialTheme?: AppTheme;
  onSave: (theme: Omit<AppTheme, 'id' | 'isBuiltIn'>) => void;
  onCancel: () => void;
}

const DEFAULT_TEMPLATE = BUILT_IN_THEMES[0].colors;

interface ThemePreviewProps {
  colors: AppTheme['colors'];
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ colors }) => {
  return (
    <div 
      className="w-full rounded-xl p-4 border shadow-inner transition-colors duration-200 flex flex-col gap-4"
      style={{ 
        backgroundColor: colors.appBg,
        borderColor: colors.border
      }}
    >
      <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: colors.border }}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.textMuted }}>Exemplo</span>
        <Dices size={18} style={{ color: colors.textAccent }} />
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Standard Card */}
        <div 
          className="rounded-lg p-3 border shadow-sm flex flex-col gap-2"
          style={{ 
            backgroundColor: colors.cardBg,
            borderColor: colors.border
          }}
        >
          <div className="flex items-start justify-between">
            <div>
               <h4 className="text-sm font-bold leading-tight" style={{ color: colors.textMain }}>Card Normal</h4>
               <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>Texto secundário aqui.</p>
            </div>
          </div>
          <div className="mt-auto pt-2 border-t" style={{ borderColor: colors.border }}>
             <span className="text-[9px] font-mono" style={{ color: colors.textDim }}>META INFO</span>
          </div>
        </div>

        {/* Hover Card Simulation */}
        <div 
          className="rounded-lg p-3 border shadow-sm flex flex-col gap-2 relative overflow-hidden"
          style={{ 
            backgroundColor: colors.cardHover,
            borderColor: colors.border
          }}
        >
          <div className="absolute top-0 right-0 px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-bl-md" style={{ backgroundColor: colors.primary, color: colors.onPrimary }}>
            Hover State
          </div>
          <div>
             <h4 className="text-sm font-bold leading-tight" style={{ color: colors.textMain }}>Card Hover</h4>
             <p className="text-[10px] mt-1" style={{ color: colors.textMuted }}>Simulação do efeito de tocar/segurar.</p>
          </div>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="space-y-2">
        <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: colors.textDim }}>Botões Primários</label>
        <div className="flex gap-2">
            <button 
                className="flex-1 py-1.5 rounded-md text-[10px] font-bold shadow-sm"
                style={{ backgroundColor: colors.primary, color: colors.onPrimary }}
            >
                Normal
            </button>
            <button 
                className="flex-1 py-1.5 rounded-md text-[10px] font-bold shadow-sm"
                style={{ backgroundColor: colors.primaryHover, color: colors.onPrimary }}
            >
                Hover
            </button>
            <button 
                className="flex-1 py-1.5 rounded-md text-[10px] font-bold shadow-sm ring-2 ring-offset-1 ring-offset-transparent opacity-90"
                style={{ backgroundColor: colors.primaryActive, color: colors.onPrimary, ringColor: colors.primary }}
            >
                Ativo
            </button>
        </div>
      </div>

      {/* Status Row */}
      <div className="grid grid-cols-2 gap-3">
         <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ backgroundColor: colors.cardBg, borderColor: colors.success + '40' }}>
            <CheckCircle2 size={16} style={{ color: colors.success }} />
            <span className="text-[10px] font-bold" style={{ color: colors.success }}>Sucesso!</span>
         </div>
         <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ backgroundColor: colors.cardBg, borderColor: colors.error + '40' }}>
            <AlertCircle size={16} style={{ color: colors.error }} />
            <span className="text-[10px] font-bold" style={{ color: colors.error }}>Falha/Erro</span>
         </div>
      </div>

    </div>
  );
};

export const ThemeEditor: React.FC<ThemeEditorProps> = ({ initialTheme, onSave, onCancel }) => {
  const [name, setName] = useState(initialTheme?.name || '');
  const [colors, setColors] = useState(initialTheme?.colors || { ...DEFAULT_TEMPLATE });
  const [activeField, setActiveField] = useState<keyof AppTheme['colors'] | null>(null);

  const handleColorChange = (key: keyof AppTheme['colors'], value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const ColorInput = ({ label, field }: { label: string, field: keyof AppTheme['colors'] }) => (
    <div className="flex items-center justify-between p-3 bg-app border border-border rounded-lg">
      <span className="text-xs font-bold uppercase text-txt-muted">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-txt-dim uppercase">{colors[field]}</span>
        <button
          onClick={() => setActiveField(field)}
          className="w-8 h-8 rounded-full border border-border shadow-sm hover:scale-110 transition-transform"
          style={{ backgroundColor: colors[field] }}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-card rounded-t-2xl">
          <h3 className="text-lg font-bold text-txt-main">
            {initialTheme ? 'Editar Tema' : 'Novo Tema'}
          </h3>
          <button onClick={onCancel} className="text-txt-muted hover:text-txt-main">
            <X size={24} />
          </button>
        </div>

        {/* Fixed Preview Section */}
        <div className="p-4 border-b border-border bg-app/50 backdrop-blur-sm shrink-0">
          <ThemePreview colors={colors} />
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 space-y-6 flex-1">
          
          {/* Name */}
          <div>
            <label className="text-xs font-bold uppercase text-txt-muted mb-1 block">Nome do Tema</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-app border border-border rounded-lg p-3 text-txt-main outline-none focus:border-primary font-bold"
              placeholder="Ex: Meu Tema"
            />
          </div>

          {/* Groups */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-primary border-b border-border pb-1">Fundos & Bordas</h4>
            <div className="grid grid-cols-1 gap-2">
              <ColorInput label="Fundo do App" field="appBg" />
              <ColorInput label="Fundo dos Cards" field="cardBg" />
              <ColorInput label="Card Hover" field="cardHover" />
              <ColorInput label="Bordas" field="border" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-primary border-b border-border pb-1">Tipografia</h4>
            <div className="grid grid-cols-1 gap-2">
              <ColorInput label="Texto Principal" field="textMain" />
              <ColorInput label="Texto Secundário" field="textMuted" />
              <ColorInput label="Texto Apagado" field="textDim" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-primary border-b border-border pb-1">Cor de Destaque (Marca)</h4>
            <div className="grid grid-cols-1 gap-2">
              <ColorInput label="Cor Primária" field="primary" />
              <ColorInput label="Primária Hover" field="primaryHover" />
              <ColorInput label="Primária Ativa" field="primaryActive" />
              <ColorInput label="Texto em Destaque" field="textAccent" />
              <ColorInput label="Texto sobre Primária" field="onPrimary" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-primary border-b border-border pb-1">Status</h4>
            <div className="grid grid-cols-1 gap-2">
              <ColorInput label="Sucesso (Verde)" field="success" />
              <ColorInput label="Erro (Vermelho)" field="error" />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card rounded-b-2xl flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-txt-muted hover:bg-card-hover transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSave({ name, colors })}
            disabled={!name.trim()}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-on-primary shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            Salvar Tema
          </button>
        </div>

      </div>

      <ColorPicker 
        isOpen={!!activeField}
        onClose={() => setActiveField(null)}
        selectedColor={activeField ? colors[activeField] : undefined}
        forceCustom={true}
        onSelect={(val) => {
            if (activeField) {
                handleColorChange(activeField, val);
            }
        }}
      />
    </div>
  );
};
