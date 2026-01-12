
import { Collection, CollectionItem } from './types';

export const ORACLE_ANSWERS = [
  { roll: 1, text: "Não, e...", sentiment: 'negative' },
  { roll: 2, text: "Não.", sentiment: 'negative' },
  { roll: 3, text: "Não, mas...", sentiment: 'neutral' },
  { roll: 4, text: "Sim, mas...", sentiment: 'neutral' },
  { roll: 5, text: "Sim.", sentiment: 'positive' },
  { roll: 6, text: "Sim, e...", sentiment: 'positive' },
];

export const INTERVENTION_TYPES = [
  { roll: 1, text: "Nova Entidade" },
  { roll: 2, text: "Entidade Positiva" },
  { roll: 3, text: "Entidade Negativa" },
  { roll: 4, text: "Avançar Trama" },
  { roll: 5, text: "Regredir Trama" },
  { roll: 6, text: "Selvagem" },
];

// --- COLEÇÕES PADRÃO (Tabelas e Decks) ---

const NPC_ATTITUDES_ITEMS: CollectionItem[] = [
  { text: "Hostil" }, { text: "Hostil" },
  { text: "Neutro" }, { text: "Neutro" },
  { text: "Amigável" }, { text: "Amigável" }
];

const TWENE_ITEMS: CollectionItem[] = [
  { text: "Aumentar elemento simples" },
  { text: "Diminuir elemento simples" },
  { text: "Adicionar elemento simples" },
  { text: "Remover elemento simples" },
  { text: "Aumentar elemento maior" },
  { text: "Diminuir elemento maior" },
  { text: "Adicionar elemento maior" },
  { text: "Remover elemento maior" },
  { text: "Selvagem Positivo" },
  { text: "Selvagem Negativo" },
];

// Baralho Padrão 52 Cartas
const SUITS = [
  { icon: '♠', name: 'Espadas', color: 'black' },
  { icon: '♥', name: 'Copas', color: 'red' },
  { icon: '♣', name: 'Paus', color: 'black' },
  { icon: '♦', name: 'Ouros', color: 'red' }
];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const STANDARD_DECK_ITEMS: CollectionItem[] = [];
SUITS.forEach(suit => {
  RANKS.forEach(rank => {
    STANDARD_DECK_ITEMS.push({
      text: rank,
      subtext: suit.name,
      icon: suit.icon,
      color: suit.color
    });
  });
});
STANDARD_DECK_ITEMS.push({ text: 'Coringa', subtext: 'Preto', icon: '🃏', color: 'black' });
STANDARD_DECK_ITEMS.push({ text: 'Coringa', subtext: 'Vermelho', icon: '🃏', color: 'red' });


// Lista Enorme de Palavras para Presságio (200 Adjetivos + 200 Substantivos)
export const PORTENT_ADJECTIVES = [
  "Abandonado(a)", "Aberto(a)", "Abençoado(a)", "Abstrato(a)", "Absurdo(a)", "Oculto(a)", "Acessível", "Ácido(a)", "Adormecido(a)", "Aéreo(a)",
  "Afiado(a)", "Agitado(a)", "Agressivo(a)", "Ágil", "Agradável", "Alado(a)", "Alheio(a)", "Alto(a)", "Amaldiçoado(a)", "Amargo(a)",
  "Ambicioso(a)", "Ameaçador(a)", "Amigável", "Amplo(a)", "Ancestral", "Angustiado(a)", "Anormal", "Ansioso(a)", "Antigo(a)", "Apagado(a)",
  "Apaixonado(a)", "Ápero(a)", "Ardente", "Arrogante", "Artificial", "Assustador(a)", "Atento(a)", "Atraente", "Audaz", "Ausente",
  "Automático(a)", "Avarento(a)", "Azul", "Banal", "Barulhento(a)", "Belo(a)", "Benéfico(a)", "Bestial", "Branco(a)", "Brilhante",
  "Brusco(a)", "Brutal", "Caótico(a)", "Calmo(a)", "Cansado(a)", "Caro(a)", "Cego(a)", "Celestial", "Certo(a)", "Cheio(a)",
  "Cínico(a)", "Civilizado(a)", "Claro(a)", "Coberto(a)", "Cômico(a)", "Comum", "Complexo(a)", "Confuso(a)", "Congelado(a)", "Corrompido(a)",
  "Corajoso(a)", "Covarde", "Crente", "Criminal", "Cruel", "Curioso(a)", "Curto(a)", "Danificado(a)", "Decadente", "Defensivo(a)",
  "Delicado(a)", "Demente", "Denso(a)", "Desconfiado(a)", "Desconhecido(a)", "Deserto(a)", "Desesperado(a)", "Destruído(a)", "Diferente", "Difícil",
  "Digno(a)", "Distante", "Divino(a)", "Doente", "Doce", "Doloroso(a)", "Dourado(a)", "Duvidoso(a)", "Elegante", "Elevado(a)",
  "Encantado(a)", "Enorme", "Enfraquecido(a)", "Enganoso(a)", "Enigmático(a)", "Épico(a)", "Errado(a)", "Escuro(a)", "Especial", "Esquecido(a)",
  "Estável", "Estranho(a)", "Eterno(a)", "Exótico(a)", "Falso(a)", "Famoso(a)", "Fanático(a)", "Fatal", "Fechado(a)", "Feio(a)",
  "Feliz", "Feroz", "Fiel", "Fino(a)", "Firme", "Físico(a)", "Flutuante", "Focado(a)", "Fofo(a)", "Forte",
  "Fraco(a)", "Frágil", "Fresco(a)", "Frio(a)", "Fugaz", "Furioso(a)", "Fútil", "Gélido(a)", "Generoso(a)", "Gigante",
  "Glorioso(a)", "Gordo(a)", "Grande", "Grato(a)", "Grave", "Grosseiro(a)", "Guardião", "Habilidoso(a)", "Harmônico(a)", "Heroico(a)",
  "Honesto(a)", "Honrado(a)", "Horrível", "Hostil", "Humano(a)", "Húmido(a)", "Ignorante", "Ilusório(a)", "Imenso(a)", "Imortal",
  "Impossível", "Impuro(a)", "Inabalável", "Inativo(a)", "Incerto(a)", "Incomum", "Incrível", "Indeciso(a)", "Indefeso(a)", "Infame",
  "Infantil", "Infernal", "Inimigo(a)", "Inocente", "Insano(a)", "Instável", "Intenso(a)", "Inútil", "Invisível", "Irritado(a)",
  "Jovem", "Justo(a)", "Lamentável", "Largo(a)", "Leal", "Lento(a)", "Leve", "Livre", "Longo(a)", "Louco(a)",
  "Luminoso(a)", "Luxuoso(a)", "Mágico(a)", "Magnífico(a)", "Maior", "Maldito(a)", "Maligno(a)", "Manco(a)", "Manchado(a)", "Maravilhoso(a)",
  "Mecânico(a)", "Medonho(a)", "Melhor", "Menor", "Mentiroso(a)", "Metálico(a)", "Militar", "Misterioso(a)", "Místico(a)", "Moderno(a)",
  "Molhado(a)", "Monstruoso(a)", "Morno(a)", "Mortal", "Morto(a)", "Mudo(a)", "Muitos(as)", "Mundano(a)", "Musical", "Mútuo(a)",
  "Nacional", "Natural", "Nocivo(a)", "Noturno(a)", "Novo(a)", "Nu/Nua", "Nublado(a)", "Obscuro(a)", "Ocupado(a)", "Odioso(a)",
  "Ofensivo(a)", "Oleoso(a)", "Orgulhoso(a)", "Ótimo(a)", "Ousado(a)", "Pacífico(a)", "Pálido(a)", "Perigoso(a)", "Pesado(a)", "Pio(a)",
  "Pobre", "Poderoso(a)", "Podre", "Poético(a)", "Político(a)", "Popular", "Possível", "Poucos(as)", "Precioso(a)", "Preso(a)",
  "Profundo(a)", "Pronto(a)", "Próximo(a)", "Puro(a)", "Quebrado(a)", "Quente", "Quieto(a)", "Rápido(a)", "Raro(a)", "Real",
  "Recente", "Religioso(a)", "Repentino(a)", "Responsável", "Rico(a)", "Rígido(a)", "Roliço(a)", "Roxo(a)", "Rude", "Ruidoso(a)",
  "Sábio(a)", "Sagrado(a)", "Salgado(a)", "Sangrento(a)", "São/Sã", "Saudável", "Seco(a)", "Secreto(a)", "Selvagem", "Semelhante",
  "Sensível", "Sereno(a)", "Sério(a)", "Severo(a)", "Silencioso(a)", "Simples", "Sincero(a)", "Singular", "Sistêmico(a)", "Soberbo(a)",
  "Social", "Sozinho(a)", "Sombrio(a)", "Sujo(a)", "Surdo(a)", "Talentoso(a)", "Tardio(a)", "Temível", "Terrível", "Tímido(a)",
  "Típico(a)", "Tonto(a)", "Torto(a)", "Tóxico(a)", "Trágico(a)", "Traiçoeiro(a)", "Tranquilo(a)", "Transparente", "Triste", "Último(a)",
  "Único(a)", "Urgente", "Útil", "Vago(a)", "Valioso(a)", "Vazio(a)", "Velho(a)", "Veloz", "Verdadeiro(a)", "Verde",
  "Vermelho(a)", "Violento(a)", "Visível", "Vivo(a)", "Voraz", "Vulgar", "Vulnerável", "Zangado(a)", "Zeloso(a)", "Zona"
];

export const PORTENT_NOUNS = [
  "Abismo", "Abrigo", "Acaso", "Aço", "Acordo", "Adeus", "Água", "Ajuda", "Alarme", "Alegria",
  "Aliança", "Alimento", "Alma", "Altar", "Ambição", "Ameaça", "Amizade", "Amor", "Anjo", "Animal",
  "Ano", "Ansiedade", "Arma", "Armadilha", "Arte", "Árvore", "Assassino", "Ataque", "Atenção", "Ato",
  "Autoridade", "Aventura", "Azar", "Batalha", "Beleza", "Bem", "Besta", "Bloqueio", "Boca", "Buraco",
  "Cabeça", "Caçada", "Cadeia", "Caixa", "Calor", "Cama", "Caminho", "Campo", "Canção", "Caos",
  "Carga", "Carta", "Casa", "Castelo", "Causa", "Caverna", "Céu", "Chama", "Chave", "Chefe",
  "Cheiro", "Cidade", "Círculo", "Clima", "Coisa", "Comando", "Combate", "Comércio", "Comida", "Companhia",
  "Comunidade", "Confiança", "Conflito", "Conhecimento", "Conselho", "Conto", "Contrato", "Controle", "Coração", "Coragem",
  "Corpo", "Corte", "Crença", "Criança", "Crime", "Cristal", "Cruz", "Culpa", "Cultura", "Cura",
  "Curso", "Dano", "Dança", "Decisão", "Defesa", "Demônio", "Dente", "Desafio", "Desastre", "Descoberta",
  "Desejo", "Deserto", "Destino", "Deus", "Dia", "Diabo", "Diferença", "Dinheiro", "Direito", "Disputa",
  "Distância", "Dívida", "Doença", "Dom", "Dor", "Dúvida", "Duelo", "Efeito", "Elemento", "Emoção",
  "Energia", "Enigma", "Ensino", "Entrada", "Equilíbrio", "Erro", "Escuridão", "Espaço", "Espada", "Esperança",
  "Espírito", "Esposa", "Esqueleto", "Estado", "Estrada", "Estrela", "Estrutura", "Evento", "Exemplo", "Exército",
  "Experiência", "Faca", "Fato", "Falta", "Família", "Fantasma", "Fé", "Feitiço", "Fera", "Ferida",
  "Festa", "Fim", "Flor", "Floresta", "Fogo", "Folha", "Fome", "Fonte", "Força", "Forma",
  "Fortaleza", "Fracasso", "Frio", "Fronteira", "Fruto", "Fuga", "Fundo", "Futuro", "Gado", "Ganho",
  "Gelo", "Gênio", "Gente", "Gesto", "Glória", "Golpe", "Gosto", "Governo", "Graça", "Grandeza",
  "Grito", "Grupo", "Guarda", "Guerra", "Guia", "Habilidade", "Herança", "Herói", "História", "Homem",
  "Honra", "Hora", "Hóspede", "Humor", "Idade", "Ideia", "Imagem", "Império", "Início", "Inimigo",
  "Instinto", "Intenção", "Interesse", "Inverno", "Ira", "Irmão", "Ilha", "Jogo", "Jóia", "Jornada",
  "Juiz", "Julgamento", "Justiça", "Lado", "Ladrão", "Lago", "Lágrima", "Lama", "Lança", "Lar",
  "Lei", "Lenda", "Leste", "Liberdade", "Líder", "Ligação", "Limite", "Linguagem", "Linha", "Livro",
  "Lobo", "Local", "Loucura", "Lua", "Lugar", "Luta", "Luto", "Luz", "Machado", "Mãe",
  "Magia", "Mago", "Mal", "Maldição", "Manhã", "Mão", "Mapa", "Mar", "Marca", "Marcha",
  "Marido", "Máscara", "Matéria", "Medicina", "Medo", "Meio", "Membro", "Memória", "Mensagem", "Mente",
  "Mentira", "Mercado", "Mestre", "Metal", "Método", "Milagre", "Minuto", "Missão", "Mistério", "Mito",
  "Modelo", "Modo", "Momento", "Monstro", "Montanha", "Morte", "Motivo", "Movimento", "Mudança", "Mulher",
  "Mundo", "Muro", "Música", "Nação", "Nada", "Natureza", "Navio", "Necessidade", "Negócio", "Neve",
  "Nível", "Noite", "Nome", "Norte", "Notícia", "Nuvem", "Objeto", "Obra", "Oeste", "Olhar",
  "Olho", "Ombro", "Onda", "Opinião", "Oportunidade", "Ordem", "Orgulho", "Origem", "Ouro", "Outono",
  "Ovo", "Pacto", "Padrão", "Pagamento", "Pai", "País", "Paixão", "Palácio", "Palavra", "Pão",
  "Papel", "Par", "Paraíso", "Parte", "Passado", "Passagem", "Passo", "Pássaro", "Paz", "Pecado",
  "Pedra", "Peito", "Peixe", "Pele", "Pena", "Pensamento", "Perda", "Perdão", "Perigo", "Período",
  "Perna", "Personagem", "Perto", "Peso", "Pessoa", "Peste", "Plano", "Planta", "Poder", "Poesia",
  "Ponto", "Ponte", "Porta", "Porto", "Povo", "Prazer", "Prazo", "Preço", "Prêmio", "Presente",
  "Pressão", "Primavera", "Princípio", "Prisão", "Problema", "Processo", "Produto", "Professor", "Profundidade", "Promessa",
  "Proposta", "Proteção", "Prova", "Público", "Queda", "Questão", "Raça", "Rainha", "Raiva", "Raiz",
  "Ramo", "Rapaz", "Razão", "Reação", "Realidade", "Rebanho", "Receio", "Recompensa", "Recurso", "Rede",
  "Refúgio", "Região", "Regra", "Rei", "Reino", "Relação", "Religião", "Remédio", "Renda", "Repouso",
  "Respeito", "Resposta", "Resto", "Resultado", "Retorno", "Reunião", "Revolta", "Rio", "Risco", "Riso",
  "Ritmo", "Rito", "Roda", "Rolo", "Romance", "Rosto", "Roupa", "Ruído", "Ruína", "Rumor",
  "Saber", "Sabor", "Saco", "Sacrifício", "Saída", "Sala", "Salvação", "Sangue", "Santo", "Sapato",
  "Saúde", "Segredo", "Selva", "Semana", "Semente", "Senhor", "Sensação", "Sentido", "Sentimento", "Sinal",
  "Sistema", "Sítio", "Situação", "Sol", "Solo", "Sombra", "Sonho", "Sono", "Sorte", "Sul",
  "Tempo", "Tempestade", "Templo", "Terra", "Terror", "Tesouro", "Teste", "Teto", "Tipo", "Tiro",
  "Título", "Tolo", "Tom", "Topo", "Toque", "Tormenta", "Torre", "Trabalho", "Traição", "Trama",
  "Trato", "Trevas", "Tribo", "Tristeza", "Troca", "Trono", "Tropa", "Trovão", "Tudo", "Túmulo",
  "União", "Universo", "Uso", "Valor", "Vantagem", "Vapor", "Vazio", "Vegetal", "Veículo", "Velho",
  "Vento", "Verão", "Verdade", "Vergonha", "Vestido", "Viagem", "Vício", "Vida", "Vidro", "Vila",
  "Vingança", "Vinho", "Violência", "Virtude", "Visão", "Visita", "Vista", "Vitória", "Vítima", "Viúva",
  "Volta", "Volume", "Vontade", "Voto", "Voz", "Zelo", "Zona"
];

// Função auxiliar para gerar presságio "on the fly" já que ele combina duas listas
// Para o novo sistema de tabelas, vamos criar uma tabela de "Ideias" que combina as duas listas
const PORTENT_ITEMS: CollectionItem[] = [];
for(let i=0; i<50; i++) { // Gerar 50 combinações prévias para a tabela padrão, ou usar lógica customizada
   // Na verdade, o Presságio é especial. Vamos mantê-lo como tabela especial ou criar uma tabela gigante.
}

export const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: 'built-in-portent',
    title: 'Presságio',
    description: 'Gera inspiração (Adjetivo + Substantivo).',
    type: 'TABLE',
    items: [], // Será tratado de forma especial no código devido à complexidade de 2 listas
    isBuiltIn: true
  },
  {
    id: 'built-in-visual-portent',
    title: 'Presságio Visual',
    description: 'Três ícones abstratos para inspirar cenas e detalhes.',
    type: 'TABLE',
    items: [], // Lógica customizada
    isBuiltIn: true
  },
  {
    id: 'built-in-npc',
    title: 'Atitude de NPC',
    description: 'Reação inicial (Hostil, Neutro, Amigável).',
    type: 'TABLE',
    items: NPC_ATTITUDES_ITEMS,
    isBuiltIn: true
  },
  {
    id: 'built-in-twene',
    title: 'TWENE (Inesperado)',
    description: 'Elementos inesperados para alterar a cena.',
    type: 'TABLE',
    items: TWENE_ITEMS,
    isBuiltIn: true
  },
  {
    id: 'built-in-deck',
    title: 'Baralho Padrão',
    description: '54 Cartas (Inclui Coringas).',
    type: 'DECK',
    items: STANDARD_DECK_ITEMS,
    isBuiltIn: true
  }
];
