import React, { useState } from 'react';
import {
  MessageSquare, Wrench, User, BookOpen, ScrollText,
  Dices, Sword, Zap, HelpCircle, ChevronRight, ChevronLeft, X 
} from 'lucide-react';
import { useGameSound } from '../hooks/useGameSound';

interface HelpViewProps {
  onClose: () => void;
}

const HelpSection = ({
  title,
  icon,
  children 
}: {
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { play } = useGameSound();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-3">
      <button 
        onClick={() => { play('CLICK'); setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between p-4 hover:bg-card-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <h3 className="font-bold text-txt-main text-lg">{title}</h3>
        </div>
        <ChevronRight size={20} className={`text-txt-muted transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="p-4 pt-0 text-txt-muted text-sm leading-relaxed border-t border-border/50 animate-in slide-in-from-top-2">
          {children}
        </div>
      )}
    </div>
  );
};

const HelpView: React.FC<HelpViewProps> = ({ onClose }) => {
  const { play } = useGameSound();

  return (
    <div className="fixed inset-0 z-[100] bg-app flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex-none h-14 bg-card flex items-center justify-between px-4 border-b border-border shadow-md">
        <div className="flex items-center gap-2">
           <button 
             onClick={() => { play('CLICK'); onClose(); }}
             className="p-1 -ml-1 text-txt-muted hover:text-txt-main rounded-full hover:bg-card-hover transition-colors"
           >
             <ChevronLeft size={24} />
           </button>
           <HelpCircle size={24} className="text-primary" />
           <h1 className="text-lg font-bold text-txt-main">Manual do Sistema</h1>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full pb-24">
        
        <div className="mb-6 bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
           <p className="text-txt-main font-bold mb-1">Bem-vindo ao Mestre Mune</p>
           <p className="text-xs text-txt-muted">Um emulador de Game Master para jogos de RPG Solo.</p>
        </div>

        <HelpSection title="O Oráculo" icon={<MessageSquare />}>
          <p className="mb-3">
            O Oráculo é o coração do sistema MUNE. Ele responde a perguntas de "Sim" ou "Não" para guiar sua narrativa.
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li><strong>Pergunta:</strong> Faça uma pergunta fechada (ex: "A porta está trancada?").</li>
            <li><strong>Rolar:</strong> O sistema rola 1d6.</li>
            <li><strong>Resultados:</strong>
               <ul className="list-none mt-1 space-y-1 text-xs pl-2 border-l-2 border-border">
                 <li><strong>1: Não, e...</strong> (Negativa com uma complicação)</li>
                 <li><strong>2: Não</strong> (Negativa simples)</li>
                 <li><strong>3: Não, mas...</strong> (Negativa com uma vantagem)</li>
                 <li><strong>4: Sim, mas...</strong> (Positiva com uma complicação)</li>
                 <li><strong>5: Sim</strong> (Positiva simples)</li>
                 <li><strong>6: Sim, e...</strong> (Positiva com uma vantagem)</li>
               </ul>
            </li>
          </ul>
          <p className="mb-2"><strong>Pontos de Intervenção:</strong></p>
          <p>
            Cada vez que você rola um <strong>6</strong>, você ganha 1 Ponto de Intervenção. Ao acumular <strong>3 pontos</strong>, uma <strong>Intervenção</strong> ocorre automaticamente, mudando o rumo da história (ex: Novo NPC, Evento de Trama, etc).
          </p>
        </HelpSection>

        <HelpSection title="Personagens & Testes" icon={<User />}>
          <p className="mb-3">
            A aba Persona permite criar e gerenciar seus personagens.
          </p>
          <h4 className="font-bold text-txt-main mt-4 mb-2">Atributos</h4>
          <p className="mb-2">Você pode definir atributos com diferentes tipos de teste:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li><strong>Menor ou Igual (Under):</strong> Sucesso se o resultado do dado for ≤ Valor do atributo (ex: GURPS, Blackjack).</li>
            <li><strong>Maior ou Igual (Over):</strong> Sucesso se o resultado do dado for ≥ Valor do atributo (ex: D&D, Pathfinder).</li>
            <li><strong>Bater Alvo (Target):</strong> Você define um número alvo (DC) na hora de rolar. Sucesso se (Dado + Mod) ≥ Alvo.</li>
          </ul>
          
          <h4 className="font-bold text-txt-main mt-4 mb-2">Recursos</h4>
          <p>
            Use recursos para rastrear Vida, Mana, Munição, etc. Eles possuem valor Atual e Máximo.
          </p>
        </HelpSection>

        <HelpSection title="Ferramentas & Coleções" icon={<Wrench />}>
          <p className="mb-3">
            O Mestre Mune vem com várias ferramentas para auxiliar a criatividade.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Presságio (Portent):</strong> Gera duas palavras aleatórias (Verbo + Substantivo) para inspirar cenas ou interpretações.</li>
            <li><strong>NPCs:</strong> Gera traços de personalidade, motivações e descrições para personagens.</li>
            <li><strong>TWENE:</strong> (The World Is Not Enough) Um gerador de eventos aleatórios para dar vida ao mundo.</li>
            <li><strong>Baralhos:</strong> Simula um baralho de cartas padrão para jogos que utilizam este recurso (ex: Savage Worlds).</li>
          </ul>
          <p className="mt-3 text-xs text-txt-dim">
            Você pode criar suas próprias tabelas e baralhos personalizados na aba "Nova Coleção".
          </p>
        </HelpSection>

        <HelpSection title="Relógios de Progresso" icon={<Zap />}>
          <p className="mb-3">
            Baseado no sistema de <em>Blades in the Dark</em>, os relógios rastreiam o progresso de eventos no mundo.
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li><strong>Ameaça:</strong> Algo ruim que vai acontecer quando o relógio encher (ex: "Guardas alertados").</li>
            <li><strong>Progresso:</strong> Um objetivo complexo que o jogador está tentando alcançar (ex: "Decifrar o ritual").</li>
          </ul>
          <p>
            Use os botões <strong>+</strong> e <strong>-</strong> para avançar ou recuar o relógio conforme as consequências das suas ações na história.
          </p>
        </HelpSection>

        <HelpSection title="Rastreador de Conflito" icon={<Sword />}>
          <p className="mb-3">
            Uma ferramenta para gerenciar combates e cenas de ação.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Adicione <strong>Jogadores</strong> e <strong>Inimigos</strong> à lista.</li>
            <li>Rastreie <strong>HP</strong> (Vida) e <strong>Iniciativa</strong>.</li>
            <li>Use o botão <strong>Próximo</strong> para avançar turnos e rodadas automaticamente.</li>
            <li>A lista pode ser reordenada arrastando os participantes.</li>
          </ul>
        </HelpSection>

        <HelpSection title="Acervo (Wiki)" icon={<BookOpen />}>
          <p className="mb-3">
            Sua base de conhecimento pessoal. Crie anotações sobre o mundo, personagens e locais.
          </p>
          <p className="mb-2"><strong>Links Automáticos:</strong></p>
          <p>
            Use <strong>@Nome</strong> para linkar para um Personagem e <strong>#Tag</strong> para criar etiquetas. O sistema cria conexões entre as páginas automaticamente.
          </p>
        </HelpSection>

        <HelpSection title="Dados & Log" icon={<Dices />}>
          <p className="mb-3">
            <strong>Rolador de Dados:</strong> Suporta fórmulas complexas (ex: <code>2d20kh1+5</code> para vantagem).
          </p>
          <p className="mb-3">
            <strong>Log de Aventura:</strong> Tudo o que acontece é registrado automaticamente. Você pode:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Adicionar notas de texto e imagens.</li>
            <li>Exportar o log como <strong>PDF</strong> ou <strong>Markdown</strong>.</li>
            <li>Pesquisar por eventos passados usando a barra de busca.</li>
          </ul>
        </HelpSection>

        {/* Credits Section */}
        <div className="mt-8 pt-8 border-t border-border/50">
           <h3 className="text-sm font-bold text-txt-muted uppercase tracking-widest mb-4">Créditos & Recursos</h3>
           
           <a 
             href="https://drive.google.com/file/d/1mJbHcCNscMfs_NPnqMMz2Y8KiD8gWrkZ/view" 
             target="_blank" 
             rel="noopener noreferrer"
             className="w-full py-3 bg-card border border-border hover:bg-card-hover text-primary font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm mb-6"
           >
             <BookOpen size={18} />
             Acessar M.U.N.E. Original em PDF
           </a>

           <div className="text-center space-y-2">
              <p className="text-[10px] text-txt-dim leading-tight">
                 Este aplicativo foi desenvolvido como uma ferramenta de auxílio para o sistema <strong>M.U.N.E.</strong> (Made Up Normal Entity) de autoria de <em>Rev. S. Rowan</em>.
              </p>
              <p className="text-[10px] text-txt-dim leading-tight">
                 Ícones por <a href="https://game-icons.net/" target="_blank" rel="noopener noreferrer" className="text-txt-dim hover:text-primary underline">Game-Icons.Net</a> sob licença <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 3.0</a>.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};

export default HelpView;
