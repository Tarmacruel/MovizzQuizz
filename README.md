# MovizzQuizz

Quiz multiplayer de filmes, séries e cultura pop, com salas personalizadas, lobby, perguntas de múltipla escolha e rodada com cronômetro de 30 segundos.

## Stack

- **Frontend:** React + Vite + Socket.IO Client
- **Backend:** Node.js + Express + Socket.IO
- **Banco inicial:** `server/data/questions.json`, com 200 perguntas categorizadas
- **Modo atual:** MVP jogável em tempo real com armazenamento em memória

## Funcionalidades entregues

- Criação de sala com código curto de acesso.
- Entrada de amigos por código da sala.
- Lobby em tempo real.
- Host configura categorias, dificuldades e quantidade de perguntas.
- Rodadas simultâneas: todos os participantes respondem à mesma pergunta.
- Cronômetro de 30 segundos por pergunta.
- Pontuação automática com bônus por tempo restante.
- Revelação da resposta correta após cada rodada.
- Ranking final.
- Banco inicial com 200 perguntas de múltipla escolha.

## Como rodar localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Rodar cliente e servidor juntos

```bash
npm run dev
```

O frontend abre em:

```txt
http://localhost:5173
```

O backend roda em:

```txt
http://localhost:3333
```

## Scripts úteis

```bash
npm run dev       # roda client e server simultaneamente
npm run dev:web   # roda apenas o frontend
npm run dev:api   # roda apenas o backend
npm run build     # gera build do frontend
npm run start     # inicia o backend em modo produção
```

## Estrutura

```txt
MovizzQuizz/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   └── package.json
├── server/
│   ├── data/
│   │   └── questions.json
│   ├── src/
│   │   ├── gameEngine.js
│   │   └── index.js
│   └── package.json
├── package.json
└── README.md
```

## Passos sugeridos para evolução

### Fase 1 — Persistência real

- Trocar armazenamento em memória por PostgreSQL.
- Criar tabelas para usuários, salas, partidas, perguntas, respostas e ranking.
- Salvar histórico de partidas.
- Permitir reentrada em salas após queda de conexão.

### Fase 2 — Painel administrativo

- Criar CRUD de perguntas.
- Importar perguntas por CSV/Excel.
- Revisar perguntas por status: rascunho, aprovada, arquivada.
- Criar filtros por franquia, dificuldade, obra, tipo e ano.

### Fase 3 — Multiplayer avançado

- Criar modo por equipes.
- Criar modo todos contra todos.
- Criar modo eliminação.
- Criar modo anfitrião, em que apenas o host avança as rodadas.
- Criar modo automático, em que o sistema avança sozinho.

### Fase 4 — Conta, ranking e monetização

- Login por e-mail, Google ou Discord.
- Ranking global semanal/mensal.
- Perfil do jogador.
- Conquistas e medalhas.
- Partidas públicas e privadas.

### Fase 5 — Produção

- Backend em Render, Railway, Fly.io ou VPS.
- Frontend em Vercel ou Netlify.
- Banco PostgreSQL gerenciado.
- Redis para presença, salas e escalabilidade horizontal do Socket.IO.
- CI/CD pelo GitHub Actions.

## Observação sobre propriedade intelectual

O projeto usa perguntas textuais de conhecimento geral sobre obras de cultura pop. Não foram incluídos logos, imagens, pôsteres, trilhas ou assets oficiais das franquias. Para uso comercial, recomenda-se manter identidade visual própria e evitar exploração de marcas registradas como elemento visual central do produto.
