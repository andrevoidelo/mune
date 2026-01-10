# 🎲 Mestre Mune

> **Um Emulador de Mestre de Jogo (GM Emulator) completo, focado em dispositivos móveis e baseado no sistema MUNE.**

O **Mestre Mune** é uma Progressive Web App (PWA) desenvolvida para facilitar sessões de RPG Solo. Ele automatiza as rolagens do sistema MUNE, gerencia fichas de personagens, rolagens de dados e mantém um diário automático de toda a sua aventura.

---

## ✨ Funcionalidades

O aplicativo é dividido em 5 módulos principais, acessíveis através da barra de navegação inferior:

### 1. 🔮 Oráculo
O coração do sistema MUNE.
- **Perguntas Sim/Não:** Faça perguntas ao oráculo e obtenha respostas baseadas em 1d6.
- **Viés:** Suporte para perguntas "Prováveis" (Vantagem/Keep Highest) e "Improváveis" (Desvantagem/Keep Lowest).
- **Intervenções Automáticas:** O app rastreia automaticamente os resultados `6` no dado. Ao acumular 3 pontos, ele dispara um alerta de **Intervenção**, sugerindo a natureza da mudança na cena.

### 2. 🛠️ Ferramentas
Geradores rápidos para destravar a criatividade durante o jogo.
- **Presságio:** Gera duas palavras (Adjetivo + Substantivo) para inspirar o clima ou detalhes da cena.
- **Atitude de NPC:** Define a reação inicial de um personagem (Hostil, Neutro, Amigável).
- **TWENE (Inesperado):** Tabela de elementos inesperados para alterar o rumo da narrativa quando necessário.

### 3. 👤 Personas (Gerenciador de Personagens)
Fichas de personagens completas e interativas.
- **Atributos:** Crie atributos personalizados. Clique neles para realizar testes (rolagens) diretamente, com opções de Vantagem, Desvantagem e Modificadores.
- **Recursos:** Contadores para Vida, Mana, Munição, etc.
- **Inventário:** Adicione itens, defina se são permanentes ou consumíveis e anexe dados de dano/efeito (ex: `1d8+2`).
- **Imagem:** Upload de imagem para personalizar a ficha.

### 4. 🎲 Rolador de Dados
Um rolador de dados avançado e flexível.
- **Notação Complexa:** Suporta expressões como `2d20+5`, `4d6kh3` (Keep Highest 3), etc.
- **Histórico:** Visualização clara do resultado total e dos dados individuais rolados.
- **Atalhos:** Botões rápidos para modificadores (+1/-1) e dados comuns.

### 5. 📜 Log (Diário de Aventura)
Tudo o que acontece é registrado automaticamente.
- **Histórico Automático:** Rolagens do oráculo, testes de atributos, uso de itens e resultados de ferramentas são salvos cronologicamente.
- **Notas de Diário:** Um botão flutuante (que pode ser arrastado pela tela) permite adicionar anotações de texto e imagens a qualquer momento.
- **Exportação PDF:** Formate sua aventura como um documento e imprima ou salve como PDF diretamente pelo navegador.
- **Persistência:** Seus dados são salvos automaticamente no navegador.

### ⚙️ Outros Recursos
- **Gestão de Campanhas:** Crie múltiplas aventuras separadas.
- **Backup e Restauração:** Exporte seus dados para um arquivo JSON para segurança ou para transferir entre dispositivos.
- **Modo Offline:** Funciona sem internet após o primeiro acesso.
- **Responsivo:** Design otimizado para parecer um app nativo em smartphones.

---

## 🚀 Como Rodar o Projeto

Este projeto utiliza **React**, **TypeScript** e **Vite**.

### Pré-requisitos
- Node.js instalado.

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/mestre-mune.git
   cd mestre-mune
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse `http://localhost:5173` no seu navegador.

### Gerar Build para Produção
Para gerar os arquivos estáticos na pasta `dist`:

```bash
npm run build
```

---

## 📱 Transformando em App Android (APK)

Este projeto está configurado para ser convertido facilmente usando **Capacitor**.

1. Inicialize o Capacitor (caso não tenha feito):
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   npx cap add android
   ```

2. Gere o build e sincronize:
   ```bash
   npm run build
   npx cap sync
   ```

3. Abra no Android Studio para gerar o APK:
   ```bash
   npx cap open android
   ```

---

## 🛠️ Tecnologias Utilizadas

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/) (Ícones)
- [Capacitor](https://capacitorjs.com/) (Mobile Runtime)

---

## 📄 Créditos e Licença

- **Desenvolvido por:** André Ricardo Voidelo
- **Sistema Base:** Baseado no sistema **MUNE (Madey Upey Namey Emulator)**. O manual original do sistema pode ser encontrado [aqui](https://drive.google.com/file/d/1mJbHcCNscMfs_NPnqMMz2Y8KiD8gWrkZ/view).

Este projeto é de código aberto e livre para uso pessoal.