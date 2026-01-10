# 🎲 Mestre Mune - Assistente de RPG Solo

**Mestre Mune** é uma aplicação web progressiva (PWA) desenvolvida para facilitar sessões de RPG Solo. Baseada no sistema **M.U.N.E. (Madey Upy Namey Emulator)**, a ferramenta centraliza oráculo, gerenciamento de fichas, rolagens de dados e anotações em uma interface moderna, responsiva e altamente customizável.

![Status do Projeto](https://img.shields.io/badge/Status-Funcional-green)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20Vite%20%7C%20TypeScript%20%7C%20Tailwind-blue)

## ✨ Funcionalidades Principais

### 🔮 O Oráculo Automatizado
- **Rolagens MUNE:** Sistema completo com opções de "Normal", "Provável" (Vantagem) e "Improvável" (Desvantagem).
- **Intervenções Automáticas:** O sistema rastreia os pontos de intervenção (gerados ao rolar um 6). Ao atingir 3 pontos, uma Intervenção é disparada automaticamente com feedback visual e sonoro.
- **Gestão de Tramas & NPCs:** Listas rápidas integradas à tela do oráculo para adicionar/remover elementos da narrativa dinamicamente.

### 👤 Gestão de Personagens (Persona)
- **Fichas Completas:** Crie personagens ilimitados com imagem, arquétipo e descrição.
- **Atributos Flexíveis:** Defina atributos customizados (Força, Agilidade, etc.), escolha o dado (d20, d6, etc.) e o tipo de teste (Rolar Abaixo/Acima).
- **Rolagens Complexas:** Clique nos atributos para rolar com modificadores e Vantagem/Desvantagem.
- **Recursos Dinâmicos:** Contadores para Vida, Mana, Munição, Sanidade, etc.
- **Inventário Interativo:** Adicione itens, marque como "Permanentes" ou consumíveis, e defina fórmulas de dado para o item (ex: `1d8+2` de dano).

### 🛠️ Coleções & Ferramentas
- **Tabelas de Rolagem:** Crie suas próprias tabelas aleatórias ou use as padrões (Presságio, etc.).
- **Baralhos Customizáveis:** Crie baralhos de cartas, saque cartas, embaralhe e gerencie o descarte.
- **Persistência:** Todas as coleções customizadas são salvas localmente.

### 📜 Diário de Sessão (Log)
- **Histórico Automático:** Todas as ações (rolagens do oráculo, testes de atributo, uso de itens) são registradas automaticamente.
- **Notas Manuais:** Adicione anotações de texto ou imagens ao log a qualquer momento.
- **Exportação:** 
  - **PDF:** Imprima sua sessão formatada.
  - **Markdown (.md):** Exporte para usar no Obsidian, Notion ou outros editores de texto.

### 🎨 Customização & Imersão
- **Temas Visuais:** Alterne entre temas como Padrão (Dark), Claro (Paper/Journal), Fantasia, Sci-Fi, Cyberpunk e Terminal.
- **Efeitos Sonoros:** Feedback auditivo para rolagens de dados, cartas e interações (pode ser desativado).
- **Backup & Restore:** Exporte todos os seus dados (Aventuras e Coleções) para um arquivo JSON e restaure em qualquer dispositivo.

---

## 🚀 Como Rodar Localmente

Este projeto utiliza **Vite** e **React**.

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/mestre-mune.git
   cd mestre-mune
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. Acesse `http://localhost:5173` no seu navegador.

---

## 🛠️ Tecnologias Utilizadas

- **Core:** React 19, TypeScript
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS v4
- **Ícones:** Lucide React
- **Áudio:** Howler.js / use-sound
- **Armazenamento:** LocalStorage (Offline-first)

---

## 📄 Créditos

Baseado no sistema de RPG Solo **M.U.N.E.** (Madey Upy Namey Emulator).
Desenvolvido como um assistente digital para facilitar a fluidez do jogo solo, eliminando a necessidade de múltiplas abas ou papelada excessiva.

---

*Boas rolagens!* 🎲
