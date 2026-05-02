# MovizzQuizz

Plataforma multiplayer de jogos de sala. O MovizzQuizz preserva o quiz de filmes, séries e cultura pop e adiciona os modos **Stop / Adedanha** e **Ludo**, com salas por código, tempo real e ranking.

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

## Automação Windows

Na raiz do projeto existem arquivos `.bat` para operação local:

```txt
iniciar.bat   sobe frontend e backend em modo dev
parar.bat     encerra processos nas portas 5180/8001 e processos do projeto
resetar.bat   reseta o banco movizzquizz, aplica migrations e roda seed
atualizar.bat faz git pull, instala dependências, aplica migrations/seed e build
```

Use `resetar.bat` com cuidado: ele apaga os dados atuais do banco local antes de recriar tudo.
Para automação sem prompt, use `resetar.bat /y /nopause`, `atualizar.bat /y /nopause` ou `parar.bat /nopause`.

## Salas

- Na tela inicial o jogador escolhe entre **Quiz de Cultura Pop**, **Stop / Adedanha** e **Ludo**.
- A entrada por código funciona para qualquer modo de jogo.
- Toda sala possui `gameType`: `quiz`, `stop` ou `ludo`.
- O navegador guarda a identidade do jogador e tenta reconectar automaticamente na mesma sala após F5/reload.
- Toda sala pode ser compartilhada pelo link `/jogar/CODIGO`; quem abre o convite informa o nome e entra direto na sala.
- O host escolhe se a sala é pública ou privada.
- O host define o máximo de participantes, de 1 a 20.
- O host define rodadas livres ou um número pré-definido de rodadas.
- A tela inicial exibe salas públicas e privadas em listas separadas.
- Salas públicas podem ser acessadas pela lista; salas privadas aparecem sem expor o código e exigem o código enviado pelo host.
- A entrada é bloqueada quando a sala atinge o limite de participantes.
- Ao fim de cada rodada, o jogo mostra vencedor, pontuação e classificação.
- O host pode iniciar a próxima rodada, e ao fim da partida pode jogar novamente.
- Se o host sair, a sala passa para a próxima pessoa por ordem de entrada.

## Modo Quiz

O modo original continua disponível com:

- lobby, filtros de categoria/dificuldade e limite de participantes;
- perguntas de múltipla escolha com cronômetro;
- respostas em tempo real via Socket.IO;
- revelação da resposta correta;
- pontuação por acerto e velocidade;
- ranking por rodada e ranking final.

## Modo Stop / Adedanha

O host cria uma sala Stop e configura a partida no lobby:

- nome da partida;
- tempo por rodada;
- quantidade de rodadas;
- letras permitidas, com opção de remover K, W e Y;
- temas/categorias livres, com adicionar, remover, renomear e reordenar;
- pontos por resposta válida;
- bônus por resposta única;
- validação manual pelo host;
- sala pública ou privada e limite de participantes.

Fluxo da rodada:

1. O host inicia a partida.
2. O servidor sorteia uma letra sem repetir enquanto houver letras disponíveis.
3. Cada jogador preenche uma resposta por tema.
4. Ao preencher todos os temas, qualquer jogador pode clicar em **STOP**.
5. O STOP encerra a rodada para todos e bloqueia novas respostas.
6. O servidor calcula respostas vazias, respostas de uma única letra, repetidas e únicas.
7. Respostas com apenas uma letra são desconsideradas automaticamente e não podem pontuar.
8. A revisão passa por um tema de cada vez, com respostas anônimas exibidas como botões.
9. Durante a revisão, os jogadores têm um chat em tempo real para comentar e discutir o tema sem revelar autoria das respostas.
10. Cada tema tem 60 segundos de votação; quando o tempo acaba ou todos os jogadores conectados clicam em **Pronto**, o jogo avança para o próximo tema.
11. As respostas entram válidas por padrão, exceto vazias ou com apenas uma letra; clicar no botão alterna entre válida e inválida.
12. Uma resposta só é invalidada por votação quando metade ou mais dos participantes votam "não"; por exemplo, em uma sala com 4 pessoas, são necessários 2 votos "não".
13. Pontuação e classificação só aparecem ao final da revisão da rodada.
14. O host confirma a pontuação e avança para a próxima rodada.
15. Ao final, o ranking final é exibido.

Eventos Socket.IO adicionados para Stop:

```txt
stop:settings
stop:start
stop:submitAnswers
stop:callStop
stop:roundTimeout
stop:validateAnswer
stop:reviewReady
stop:reviewChat
stop:finishReview
stop:nextRound
```

Estados principais do Stop:

```txt
lobby
stop-playing
stop-review
stop-finished
```

Persistência: o Stop roda em memória na sessão atual e o Prisma já possui `gameType` em `Room`/`GameSession`, campos JSON para settings/history e tabelas preparadas para `StopRound`, `StopCategory` e `StopAnswer`.

## Modo Ludo

O Ludo funciona em tempo real com regras validadas pelo servidor:

- 2 a 6 jogadores;
- cores atribuídas automaticamente por ordem de entrada;
- tabuleiro classico quando a sala esta configurada para ate 4 jogadores, com 52 casas externas e 6 casas finais;
- tabuleiro radial estilo pizza quando a sala esta configurada para 5 ou 6 jogadores, com 72 casas externas, 6 casas finais e acabamento 3D;
- 4 peças por jogador;
- precisa tirar 6 para sair da base;
- 6 dá turno extra;
- finalizar uma peça também dá turno extra;
- três 6 seguidos faz o jogador perder a vez;
- capturas mandam peças adversárias de volta para a base;
- casas seguras impedem captura;
- chegada exige número exato;
- a partida termina quando o primeiro jogador finaliza as 4 peças.

Interações do Ludo:

- dado 3D animado;
- peças clicáveis apenas quando o movimento é válido, com deslocamento animado no tabuleiro;
- movimento automático quando, após rolar o dado, existe apenas uma peça possível de jogar;
- destaque do jogador da vez;
- reações rápidas com emojis;
- fala curta em balão temporário sobre o ícone do jogador;
- reconexão por F5/reload usando a identidade salva no navegador.

A escolha visual e tambem a regra de tamanho do tabuleiro sao automaticas e vem de `settings.maxPlayers`: configuracoes ate 4 usam o layout classico curto de 52 casas; configuracoes com 5 ou 6 usam o layout radial de 6 setores com 72 casas.

Eventos Socket.IO adicionados para Ludo:

```txt
ludo:settings
ludo:start
ludo:rollDice
ludo:movePiece
ludo:react
ludo:say
```

Estados principais do Ludo:

```txt
lobby
ludo-playing
ludo-finished
```

Persistência: o Ludo usa `gameType`, `settings`, `deck` e `history` JSON em `Room`/`GameSession`; não exige migration própria nesta versão.

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
npm --prefix server run prisma:migrate -- --name stop_adedanha
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
│   │   ├── persistence.js
│   │   └── stopEngine.js
│   ├── .env.example
│   └── package.json
├── .env.example
├── package.json
└── README.md
```

## Observação sobre propriedade intelectual

O projeto usa perguntas textuais de conhecimento geral sobre obras de cultura pop. Não foram incluídos logos, imagens, pôsteres, trilhas ou assets oficiais das franquias. Para uso comercial, recomenda-se manter identidade visual própria e evitar exploração de marcas registradas como elemento visual central do produto.
