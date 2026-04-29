# MovizzQuizz

Quiz multiplayer de filmes, séries e cultura pop, com salas personalizadas, lobby, perguntas de múltipla escolha, cronômetro por rodada e ranking final em tempo real.

## Stack

- **Frontend:** React + Vite + Socket.IO Client
- **Backend:** Node.js + Express + Socket.IO
- **Banco:** PostgreSQL local via Prisma
- **Fallback:** `server/data/questions.js`, com 1500 perguntas categorizadas
- **Publicação prevista:** Cloudflare Tunnel em `https://quizz.sirel.com.br`

## Portas locais

O MovizzQuizz usa portas próprias para não conflitar com SIREL e Frota:

```txt
Frontend Vite: http://localhost:5180
Backend API/Socket.IO: http://localhost:8001
PostgreSQL: localhost:5432
Database: movizzquizz
Healthcheck: http://localhost:8001/health
```

## Configuração de ambiente

Copie os exemplos conforme necessário e ajuste credenciais locais do PostgreSQL:

```bash
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env
```

`server/.env` esperado:

```env
PORT=8001
CLIENT_ORIGIN=http://localhost:5180
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/movizzquizz
```

Não versione arquivos `.env` reais.

## Banco PostgreSQL

Crie o banco no PostgreSQL local compartilhado:

```bash
psql -U postgres -h localhost -p 5432
```

Dentro do `psql`:

```sql
CREATE DATABASE movizzquizz;
```

Depois rode migration e seed:

```bash
cd server
npm run prisma:migrate -- --name init
npm run prisma:seed
```

O seed sincroniza 1500 perguntas de `server/data/questions.js` na tabela `Question`:

- 1000 perguntas dos temas originais: Marvel, Star Wars, DC, O Senhor dos Anéis e Cultura Pop.
- 500 perguntas de League of Legends, incluindo lore, campeões e competitivo brasileiro/mundial.
- Perguntas antigas que não existem mais no arquivo ficam `active = false`.
- As alternativas são embaralhadas de forma determinística para distribuir a resposta correta entre as 4 posições.
- Durante a partida, as alternativas também são embaralhadas a cada deck, evitando decorar a posição correta.
- As alternativas seedadas usam distratores do mesmo grupo/tema da resposta para manter coerência e aumentar a dificuldade.

## Como rodar localmente

Instale tudo:

```bash
npm run install:all
```

Gere o Prisma Client se necessário:

```bash
npm --prefix server run prisma:generate
```

Rode frontend e backend juntos:

```bash
npm run dev
```

URLs esperadas:

```txt
Frontend: http://localhost:5180
Backend: http://localhost:8001
Healthcheck: http://localhost:8001/health
```

Se o `DATABASE_URL` não estiver configurado, o banco estiver indisponível ou não houver perguntas ativas, o servidor continua jogável usando o fallback local.

## Salas

- O host escolhe se a sala é pública ou privada.
- O host define o máximo de participantes, de 1 a 20.
- O host define rodadas livres ou um número pré-definido de rodadas.
- A tela inicial exibe salas públicas e privadas em listas separadas.
- Salas públicas podem ser acessadas pela lista; salas privadas aparecem sem expor o código e exigem o código enviado pelo host.
- A entrada é bloqueada quando a sala atinge o limite de participantes.
- Ao fim de cada rodada, o jogo mostra vencedor, pontuação e classificação.
- O host pode iniciar a próxima rodada, e ao fim da partida pode jogar novamente.
- Se o host sair, a sala passa para a próxima pessoa por ordem de entrada.

## Admin

O painel admin fica em:

```txt
http://localhost:5180/admin
https://quizz.sirel.com.br/admin
```

Credencial inicial criada pelo seed:

```txt
Usuário: Tarmac
Senha: Thmpv77d6f*
```

No painel é possível:

- criar e editar perguntas;
- ativar ou inativar perguntas;
- ajustar parâmetros globais de perguntas, tempo, jogadores e rodadas;
- criar novos usuários admin.

## Scripts úteis

```bash
npm run install:all # instala dependências da raiz, client e server
npm run dev         # roda client e server simultaneamente
npm run dev:web     # roda apenas o frontend
npm run dev:api     # roda apenas o backend
npm run build       # gera build do frontend
npm run start       # inicia o backend em modo produção
```

Scripts do backend:

```bash
npm --prefix server run prisma:generate
npm --prefix server run prisma:migrate -- --name init
npm --prefix server run prisma:seed
npm --prefix server run db:studio
```

## Produção com Cloudflare Tunnel

A opção preferida é servir o frontend pelo próprio backend:

```bash
npm --prefix client run build
$env:NODE_ENV="production"; npm --prefix server run start
```

Nesse modo, o Express serve `client/dist`, API e Socket.IO na mesma porta:

```txt
quizz.sirel.com.br -> http://localhost:8001
```

O CORS aceita por padrão:

```txt
http://localhost:5180
http://localhost:8001
https://quizz.sirel.com.br
```

Durante o desenvolvimento também é possível apontar o tunnel para o Vite:

```txt
quizz.sirel.com.br -> http://localhost:5180
```

O Vite está configurado com `allowedHosts` para `quizz.sirel.com.br` e proxy de `/socket.io` para `http://localhost:8001`, mantendo o multiplayer no mesmo domínio público.

## Estrutura principal

```txt
MovizzQuizz/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── server/
│   ├── data/questions.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── db.js
│   │   ├── gameEngine.js
│   │   ├── index.js
│   │   └── persistence.js
│   ├── .env.example
│   └── package.json
├── .env.example
├── package.json
└── README.md
```

## Observação sobre propriedade intelectual

O projeto usa perguntas textuais de conhecimento geral sobre obras de cultura pop. Não foram incluídos logos, imagens, pôsteres, trilhas ou assets oficiais das franquias. Para uso comercial, recomenda-se manter identidade visual própria e evitar exploração de marcas registradas como elemento visual central do produto.
