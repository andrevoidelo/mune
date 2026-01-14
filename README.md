<div align="center">
<img src="public/mune.png" alt="Mestre Mune" width="150" />

# Master Mune

[![Language](https://img.shields.io/badge/Lang-English-blue)](#-english) [![Language](https://img.shields.io/badge/Lang-Português-green)](#-português-brasileiro)
![Status](https://img.shields.io/badge/Status-Functional-green)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20Vite%20%7C%20TypeScript%20%7C%20Tailwind-blue)

</div>

---

<a name="-english"></a>
## 🇺🇸 English

**Master Mune** is a Progressive Web App (PWA) developed to facilitate Solo RPG sessions. Based on the **M.U.N.E. (Madey Upy Namey Emulator)** system, the tool centralizes the oracle, character sheet management, dice rolling, and notes into a modern, responsive, and highly customizable interface.


#### 🔮 Automated Oracle
- **Oracle Rolls:** Complete 6-answer system (`No, and...`, `No`, `No, but...`, `Yes, but...`, `Yes`, `Yes, and...`) with "Normal", "Likely" (Advantage), and "Unlikely" (Disadvantage) options.
- **Automatic Interventions:** The optional system tracks intervention points (generated when rolling a `Yes, and...`). Upon reaching 3 points, the result is automatically replaced by an Intervention.
- **Plot & NPC Management:** Quick lists integrated into the oracle screen to dynamically add/remove narrative elements.


#### 👤 Character Management (Personas)
- **Full Sheets:** Create unlimited characters with images, archetypes, and descriptions.
- **Dynamic Resources and Attributes:** Create counters for Resources (Health, Mana, Ammo, Sanity, etc.) and define custom attributes (Strength, Agility, etc.), which call roll formulas (1d20, 3d6, etc.), with modifiers, advantage/disadvantage, and display success/failure based on the test type (Roll Under/Over, Roll Only).
- **Interactive Inventory:** Add items, mark as "Permanent/Equipment" or consumable, and define dice formulas for the item (e.g., `1d8+2 slashing` or `2d6+2 fire magic`).


#### 🛠️ Collections & Tools
- **Roll Tables:** Create your own random tables or use the default Text and Visual Portents (4000+ icons), NPC Disposition and TWENE (Table for When Everything is Not as Expected).
- **Customizable Decks:** Use the default Tarot Deck and Deck of Cards or create, draw, shuffle and manage your own custom card decks.


#### 📜 Session Journal (Log)
- **Automatic History:** All actions (oracle rolls, attribute tests, item usage, etc.) are automatically logged in a easy to find (and search) place.
- **Manual Notes:** Add your own text notes, icons and images to the Log at any time, from anywhere, using the floating Journal button.
- **Export:**
  - **PDF:** Print your formatted session to remember or send to a friend.
  - **Markdown (.md)::** Export to use in Obsidian, Notion, or other text editors.


#### 🎨 Customization & Performance
- **Visual Themes:** Choose between the Default (Dark Slate), Light, Fantasy, Sci-Fi, Cyberpunk, and Terminal themes, or craft your own Custom Theme.
- **Sound Effects:** Simple, clean and optional *beeps* and *boops* for dice rolls, cards, and interactions.
- **Backup & Restore:** Export all your data (Adventures, Collections, Characters, Log, Custom Themes) to a ".MUNE" file and restore on any device.


### 🚀 How to Test Locally

This project uses **Vite** and **React**.

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/mestre-mune.git](https://github.com/your-username/mestre-mune.git)
   cd mestre-mune
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Access `http://localhost:3000` in your browser.


### 🛠️ Tech Stack
- **Core:** React 19, TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React & Game-Icons.Net (SVG)
- **Audio:** Howler.js / use-sound
- **Storage:** LocalStorage (Offline-first)


### 📄 Credits
- Based on the Solo RPG system **[M.U.N.E. (Madey Upy Namey Emulator)](https://drive.google.com/file/d/1mJbHcCNscMfs_NPnqMMz2Y8KiD8gWrkZ/view).**
- Additional icons provided by **[Game-Icons.Net](https://game-icons.net/)** under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) license.

-- 

<a name="-português-brasileiro"></a>

## 🇧🇷 Português (Brasileiro)

**Mestre Mune** é uma aplicação web progressiva (PWA) desenvolvida para facilitar sessões de RPG Solo. Baseada no sistema **M.U.N.E. (Madey Upy Namey Emulator)**, a ferramenta centraliza oráculo, gerenciamento de fichas, rolagens de dados e anotações em uma interface moderna, responsiva e altamente customizável.


#### 🔮 Oráculo Automatizado
- **Rolagens de Oráculo:** Sistema completo de 6 respostas (`Não, e...`, `Não`, `Não, mas...`, `Sim, mas...`, `Sim` e `Sim, e...`) com opções de rolagem "Normal", "Provável" (Vantagem) e "Improvável" (Desvantagem).
- **Intervenções Automáticas:** O sistema opcional rastreia os pontos de intervenção (gerados ao rolar um `Sim, e...`). Ao atingir 3 pontos, o resultado é substituído por uma Intervenção automaticamente.
- **Gestão de Tramas & NPCs:** Listas rápidas integradas à tela do oráculo para adicionar/remover elementos da narrativa dinamicamente.


#### 👤 Gestão de Personagens (Personas)
- **Fichas Completas:** Crie personagens ilimitados com imagem, arquétipo e descrição.
- **Recursos e Atributos Dinâmicos:** Crie contadores para Recursos (Vida, Mana, Munição, Sanidade, etc.) e defina Atributos personalizados (Força, Agilidade, etc.), que acionam fórmulas de rolagem (1d20, 3d6, etc.) com modificadores, vantagem/desvantagem, e exibem sucesso/falha com base no tipo de teste (Rolar Abaixo/Acima, Apenas Rolar).
- **Inventário Interativo:** Adicione itens/característica, marque eles como "Permanentes/Equipamento" ou consumíveis, e defina fórmulas de dado para o item (ex: `1d8+2 cortante` or `2d6+2 magia fogo`).


#### 🛠️ Coleções & Ferramentas
- **Tabelas de Rolagem:** Crie suas próprias tabelas aleatórias ou use as tabelas padrões de Presságio em Texto ou Visual (4000+ ícones), Atitude de NPC e "TWENE" (*Tabela para Quando Tudo não Sai Como Esperado*).
- **Baralhos Customizáveis:** Use os baralhos padrões de Cartas e Tarô ou crie, saque, embarelhe e gerencie seus próprios baralhos customizados.


#### 📜 Histórico de Sessão (Log)
- **Histórico Automático:** Todas as ações (rolagens do oráculo, testes de atributo, uso de itens, etc.) são registradas automaticamente em local fácil de encontrar (e buscar).
- **Notas Manuais:** Adicione anotações de texto, ícones e imagens ao histórico a qualquer momento, de qualquer lugar, usando o botão flutuante de Diário.
- **Exportação:** 
  - **PDF:** Imprima sua sessão formatada para lembrar ou enviar a algum amigo.
  - **Markdown (.md):** Exporte para usar no Obsidian, Notion ou outros editores de texto.


#### 🎨 Customização & Performance
- **Temas Visuais:** Escolha entre os temas Padrão (Azul Marinho), Claro, Fantasia, Sci-Fi, Cyberpunk e Terminal, ou **crie seu Tema Customizado**.
- **Efeitos Sonoros:** *Bips* and *Bops* simples, limpos e opcionais para para rolagens de dados, cartas e interações.
- **Backup & Restauração:** Exporte todos os seus dados (Aventuras, Coleções, Personagens, Histórico, Temas Customizados) para um arquivo ".MUNE" e restaure em qualquer dispositivo.


### 🚀 Como Testar Localmente

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

4. Acesse `http://localhost:3000` no seu navegador.


### 🛠️ Tecnologias Utilizadas

- **Core:** React 19, TypeScript
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS v4
- **Ícones:** Lucide React & Game-Icons.Net (SVG)
- **Áudio:** Howler.js / use-sound
- **Armazenamento:** LocalStorage (Offline-first)


### 📄 Créditos

- Baseado no sistema para RPG Solo **[M.U.N.E. (Madey Upy Namey Emulator)](https://drive.google.com/file/d/1mJbHcCNscMfs_NPnqMMz2Y8KiD8gWrkZ/view).**
- Ícones adicionais fornecidos por **[Game-Icons.Net](https://game-icons.net/)** sob licença [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/).


---


*Happy Rolling! 🎲 Boas rolagens!*
