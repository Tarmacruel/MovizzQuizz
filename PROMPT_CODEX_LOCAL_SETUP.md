# Prompt para continuar o MovizzQuizz no Codex/VSCode

Você está trabalhando no repositório `Tarmacruel/MovizzQuizz`, projeto **MovizzQuizz**, um quiz multiplayer de filmes, séries e cultura pop.

O objetivo agora é evoluir o projeto para funcionar localmente no mesmo padrão operacional usado pelo SIREL e pelo Frota, com porta própria, banco PostgreSQL local compartilhado e posterior publicação via Cloudflare Tunnel no subdomínio:

```txt
quizz.sirel.com.br
```

## Contexto atual do projeto

O repositório já possui um MVP funcional com:

- Frontend React + Vite em `client/`.
- Backend Node.js + Express + Socket.IO em `server/`.
- Multiplayer em tempo real por salas.
- Criação de sala com código curto.
- Lobby em tempo real.
- Configuração de categorias, dificuldades, quantidade de perguntas e tempo por pergunta.
- Rodadas simultâneas.
- Cronômetro padrão de 30 segundos.
- Pontuação automática.
- Ranking final.
- Banco inicial com 200 registros em `server/data/questions.js`.

## Restrições de ambiente local

Existem outros sistemas rodando na mesma máquina:

```txt
SIREL: localhost:5173
Frota: localhost:3000
PostgreSQL compartilhado: localhost:5432
```

Portanto, o MovizzQuizz NÃO deve usar as portas 5173 ou 3000.

Portas desejadas para o MovizzQuizz:

```txt
Frontend Vite: localhost:5180
Backend API/Socket.IO: localhost:3334
PostgreSQL: localhost:5432
Database: movizzquizz
Subdomínio futuro: quizz.sirel.com.br
```

## Objetivo da tarefa

Evoluir o MovizzQuizz para deixar de depender de armazenamento em memória e passar a usar PostgreSQL local, mantendo o multiplayer com Socket.IO.

O sistema deve continuar funcionando localmente e ficar preparado para publicação via Cloudflare Tunnel, da mesma forma que os sistemas SIREL e Frota.

## Tarefas obrigatórias

### 1. Ajustar portas do projeto

Alterar a porta do frontend Vite para `5180`.

No arquivo `client/vite.config.js`, configurar explicitamente:

```js
server: {
  port: 5180,
  host: '0.0.0.0'
}
```

Alterar a porta padrão do backend para `3334`.

No backend, usar:

```js
const PORT = process.env.PORT || 3334;
```

A URL padrão do frontend para o backend deve apontar para:

```txt
http://localhost:3334
```

No `client/src/App.jsx`, ajustar fallback de `VITE_API_URL` para:

```js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3334";
```

### 2. Criar arquivos `.env.example`

Criar `.env.example` na raiz, no `client/` e no `server/`, se fizer sentido.

Sugestão:

#### `.env.example` na raiz

```env
APP_NAME=MovizzQuizz
APP_URL=http://localhost:5180
API_URL=http://localhost:3334
```

#### `client/.env.example`

```env
VITE_API_URL=http://localhost:3334
```

#### `server/.env.example`

```env
PORT=3334
CLIENT_ORIGIN=http://localhost:5180
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/movizzquizz
```

Não commitar `.env` real.

### 3. Adicionar PostgreSQL

O PostgreSQL já existe localmente e roda em:

```txt
localhost:5432
```

Criar orientação SQL para criação do banco:

```sql
CREATE DATABASE movizzquizz;
```

Criar pasta:

```txt
server/prisma/
```

Instalar Prisma no backend:

```bash
cd server
npm install @prisma/client
npm install -D prisma
```

Inicializar/configurar Prisma com provider PostgreSQL.

### 4. Modelagem inicial do banco

Criar `server/prisma/schema.prisma` com modelos suficientes para substituir o armazenamento em memória progressivamente.

Modelos mínimos:

- `Question`
- `Room`
- `Player`
- `GameSession`
- `GameAnswer`

Sugestão de campos:

#### Question

- `id`
- `category`
- `difficulty`
- `question`
- `options` como `Json`
- `answer`
- `active`
- `createdAt`
- `updatedAt`

#### Room

- `id`
- `code`
- `status`
- `hostSocketId`
- `settings` como `Json`
- `createdAt`
- `updatedAt`

#### Player

- `id`
- `roomId`
- `socketId`
- `name`
- `score`
- `connected`
- `createdAt`
- `updatedAt`

#### GameSession

- `id`
- `roomId`
- `status`
- `currentIndex`
- `deck` como `Json`
- `startedAt`
- `finishedAt`
- `createdAt`
- `updatedAt`

#### GameAnswer

- `id`
- `sessionId`
- `playerId`
- `questionId`
- `selectedOption`
- `correct`
- `points`
- `secondsLeft`
- `answeredAt`

### 5. Criar seed das perguntas

O projeto atualmente possui o banco inicial em:

```txt
server/data/questions.js
```

Criar script de seed para gravar essas perguntas na tabela `Question`.

Sugestão:

```txt
server/prisma/seed.js
```

O seed deve:

- importar `questions` de `server/data/questions.js`;
- inserir ou atualizar perguntas usando `upsert`;
- preservar categoria, dificuldade, enunciado, alternativas e resposta correta;
- manter `active = true`.

Adicionar scripts ao `server/package.json`:

```json
{
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "node prisma/seed.js",
  "db:studio": "prisma studio"
}
```

Configurar seed, se necessário, conforme padrão atual do Prisma.

### 6. Criar camada de acesso ao banco

Criar arquivo:

```txt
server/src/db.js
```

Com instância única do Prisma Client.

Exemplo:

```js
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```

### 7. Integrar perguntas do banco ao jogo

Atualmente o servidor importa perguntas diretamente de `server/data/questions.js`.

Alterar para:

- carregar perguntas ativas do PostgreSQL;
- manter fallback para `server/data/questions.js` caso o banco esteja indisponível ou vazio;
- preservar o funcionamento atual do Socket.IO.

A primeira versão pode carregar as perguntas em memória ao iniciar o servidor, desde que venha do banco.

Exemplo conceitual:

```js
async function loadQuestionBank() {
  try {
    const dbQuestions = await prisma.question.findMany({ where: { active: true } });
    if (dbQuestions.length > 0) return dbQuestions;
    return fallbackQuestions;
  } catch (error) {
    console.warn("Usando fallback local de perguntas", error.message);
    return fallbackQuestions;
  }
}
```

### 8. Persistência progressiva das salas e partidas

Manter a lógica em memória para Socket.IO, mas começar a persistir eventos importantes:

- criação da sala;
- entrada de jogador;
- início da partida;
- respostas enviadas;
- finalização da partida.

Não precisa reescrever toda a engine de uma vez. A prioridade é deixar o PostgreSQL funcionando e registrar o histórico mínimo.

### 9. Preparação para Cloudflared

O sistema deverá ser publicado futuramente em:

```txt
quizz.sirel.com.br
```

Como o Cloudflare Tunnel provavelmente encaminhará o subdomínio para a porta local do frontend, preparar documentação para uma das opções:

#### Opção A — Tunnel para frontend Vite/build

```txt
quizz.sirel.com.br -> http://localhost:5180
```

E backend em:

```txt
http://localhost:3334
```

Nesse caso, ajustar CORS para aceitar:

```txt
http://localhost:5180
https://quizz.sirel.com.br
```

#### Opção B — Servir frontend pelo backend em produção

Gerar build do frontend e servir `client/dist` pelo Express. Nesse cenário:

```txt
quizz.sirel.com.br -> http://localhost:3334
```

Essa opção é preferível para publicação simples, pois evita expor duas portas no tunnel.

Implementar preferencialmente a Opção B:

- `npm run build` no client;
- Express servindo arquivos estáticos de `client/dist` quando `NODE_ENV=production`;
- manter Socket.IO no mesmo host/porta;
- ajustar frontend para conectar no mesmo host quando `VITE_API_URL` não estiver definido em produção.

### 10. Atualizar README

Atualizar o `README.md` com:

- portas corretas: frontend `5180`, backend `3334`;
- criação do banco `movizzquizz`;
- configuração de `.env`;
- comandos Prisma;
- seed das perguntas;
- execução local;
- orientação para Cloudflare Tunnel/subdomínio `quizz.sirel.com.br`.

## Comandos esperados após implementação

### Criar banco manualmente no PostgreSQL local

```bash
psql -U postgres -h localhost -p 5432
```

Dentro do psql:

```sql
CREATE DATABASE movizzquizz;
```

### Configurar env do servidor

Criar `server/.env` com:

```env
PORT=3334
CLIENT_ORIGIN=http://localhost:5180
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/movizzquizz
```

Atenção: substituir usuário/senha se o PostgreSQL local tiver credenciais diferentes.

### Instalar tudo

```bash
npm run install:all
```

### Rodar migration e seed

```bash
cd server
npm run prisma:migrate -- --name init
npm run prisma:seed
```

### Rodar localmente

Na raiz:

```bash
npm run dev
```

URLs esperadas:

```txt
Frontend: http://localhost:5180
Backend: http://localhost:3334
Healthcheck: http://localhost:3334/health
```

## Cuidados importantes

- Não usar `localhost:5173`, pois já está ocupado pelo SIREL.
- Não usar `localhost:3000`, pois já está ocupado pelo Frota.
- Não alterar o PostgreSQL existente dos outros sistemas.
- Criar banco separado chamado `movizzquizz`.
- Não commitar `.env` real.
- Manter o banco inicial de 200 perguntas.
- Manter o layout moderno e responsivo.
- Manter o jogo funcional mesmo se o banco estiver indisponível, usando fallback local.

## Resultado esperado

Ao final, o MovizzQuizz deve:

1. Rodar localmente em `localhost:5180` com backend em `localhost:3334`.
2. Usar PostgreSQL local `localhost:5432`, banco `movizzquizz`.
3. Carregar perguntas do banco após seed.
4. Registrar histórico mínimo de partidas/respostas.
5. Estar preparado para publicação em `https://quizz.sirel.com.br` via Cloudflare Tunnel.
6. Ter README atualizado com todos os comandos.
7. Continuar jogável entre amigos em tempo real.
