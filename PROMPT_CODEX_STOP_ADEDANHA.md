# Prompt para implementar o modo Stop/Adedanha no MovizzQuizz

Você está trabalhando no repositório `Tarmacruel/MovizzQuizz`, projeto **MovizzQuizz**.

O projeto começou como quiz multiplayer de filmes, séries e cultura pop, mas agora deve evoluir para uma **plataforma de jogos de sala**, mantendo o quiz existente e adicionando um novo jogo: **Stop/Adedanha**.

O novo jogo deve funcionar dentro do mesmo site, com a mesma identidade visual, mesma lógica de salas, mesmo backend Socket.IO e mesma preparação para execução local/publicação em `quizz.sirel.com.br`.

## Contexto operacional

Ambiente local do usuário:

```txt
SIREL frontend: localhost:5173
Frota frontend: localhost:3000
Frota backend/API: localhost:8000
MovizzQuizz frontend: localhost:5180
MovizzQuizz backend/API/Socket.IO: localhost:8001
PostgreSQL compartilhado: localhost:5432
Database do Quizz: movizzquizz
Subdomínio futuro: quizz.sirel.com.br
```

Não usar as portas 5173, 3000 ou 8000.

## Objetivo desta implementação

Adicionar ao site um segundo modo de jogo chamado **Stop/Adedanha**, em que o criador da sala pode personalizar 100% os temas/categorias da partida.

O usuário deve poder escolher, ao criar uma sala, entre:

1. **Quiz** — modo atual.
2. **Stop/Adedanha** — novo modo.

## Requisitos gerais da plataforma

### 1. Tela inicial com escolha do jogo

Na tela inicial do site, antes da criação da sala, apresentar cards modernos para seleção do modo:

- `Quiz de Cultura Pop`
- `Stop / Adedanha`

Cada card deve exibir:

- nome do modo;
- descrição curta;
- botão para criar sala naquele modo;
- opção de entrar por código de sala, independentemente do modo.

### 2. Sala com tipo de jogo

Toda sala deve possuir um campo/conceito de `gameType`:

```js
gameType: "quiz" | "stop"
```

O backend deve saber qual engine usar conforme o `gameType`.

Não quebrar o quiz existente.

## Requisitos do modo Stop/Adedanha

### 1. Configuração pelo host

O criador da sala deve poder configurar:

- nome da partida;
- tempo por rodada;
- quantidade de rodadas;
- letras permitidas;
- temas/categorias 100% personalizados;
- pontuação por resposta válida;
- pontuação por resposta única/exclusiva;
- permitir ou não letras difíceis;
- permitir ou não validação manual pelo host.

Valores padrão sugeridos:

```js
{
  gameType: "stop",
  roundSeconds: 90,
  totalRounds: 5,
  letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" sem K, W, Y opcionalmente,
  categories: ["Nome", "Cidade", "Animal", "Objeto", "Filme/Série", "Personagem"],
  basePoints: 10,
  uniqueBonus: 5,
  manualValidation: true
}
```

### 2. Temas 100% personalizáveis

O host deve conseguir:

- adicionar tema;
- remover tema;
- renomear tema;
- reordenar temas, se possível;
- criar partida com qualquer tema textual.

Exemplos de temas possíveis:

```txt
Nome
Cidade
País
Animal
Objeto
Comida
Filme
Série
Personagem
Super-herói
Vilão
Ator/Atriz
Música
Marca
Profissão
Parte do corpo
Lugar
Cor
Time
Celebridade
```

Mas o sistema não deve limitar a esses exemplos. Deve aceitar tema livre.

Validações mínimas:

- tema não pode ser vazio;
- remover espaços duplicados;
- impedir categorias duplicadas com o mesmo nome normalizado;
- sugerir limite visual, por exemplo 3 a 15 temas, mas permitir ajuste futuro.

### 3. Fluxo de jogo

Fluxo esperado:

1. Host cria sala Stop/Adedanha.
2. Jogadores entram pelo código da sala.
3. Host configura temas e regras.
4. Host inicia a partida.
5. Sistema sorteia uma letra para a rodada.
6. Todos os jogadores preenchem respostas para cada tema.
7. O cronômetro roda em tempo real.
8. Jogador pode clicar em **STOP** após preencher suas respostas.
9. Quando alguém clica em STOP:
   - registrar quem pediu STOP;
   - encerrar a rodada imediatamente ou iniciar uma contagem curta de encerramento, conforme configuração futura;
   - bloquear respostas dos demais.
10. Exibir tela de revisão/validação.
11. Calcular pontuação.
12. Host avança para próxima rodada.
13. Ao final, exibir ranking final.

### 4. Letras

O sistema deve sortear uma letra por rodada.

Regras:

- não repetir letra dentro da mesma partida, se houver letras suficientes;
- permitir configurar letras disponíveis;
- permitir excluir letras difíceis, como K, W, Y, se o host desejar;
- mostrar letra em destaque na interface da rodada.

### 5. Respostas

Cada jogador deve preencher uma resposta por tema.

Estrutura sugerida:

```js
answers: {
  [playerId]: {
    [categoryId]: "resposta digitada"
  }
}
```

Validação automática mínima:

- resposta vazia: 0 ponto;
- resposta que não começa com a letra da rodada: inválida/0 ponto;
- comparação deve ignorar acentos, caixa alta/baixa e espaços extras.

Exemplo:

```txt
Letra: A
Animal: Anta -> válido
Animal: Elefante -> inválido
Animal: águia -> válido para A
```

### 6. Pontuação

Pontuação inicial sugerida:

- resposta vazia: 0 ponto;
- resposta que não começa com a letra: 0 ponto;
- resposta repetida entre jogadores no mesmo tema: `basePoints`, padrão 10;
- resposta única no mesmo tema: `basePoints + uniqueBonus`, padrão 15;
- resposta marcada como inválida pelo host: 0 ponto.

O sistema deve calcular automaticamente, mas permitir validação manual pelo host.

### 7. Validação manual pelo host

Na tela de revisão da rodada, o host deve ver uma tabela com:

- jogador;
- tema;
- resposta;
- status calculado automaticamente;
- pontuação automática;
- botão para marcar válida/inválida;
- pontuação final ajustada.

Jogadores não-host devem ver apenas o resumo da rodada e aguardar o host finalizar a validação.

### 8. Estados do jogo Stop

Criar estados específicos para Stop/Adedanha:

```txt
lobby
stop-playing
stop-review
stop-finished
```

Ou usar um estado geral com subtipo, desde que fique claro e não quebre o quiz.

### 9. Eventos Socket.IO sugeridos

Adicionar eventos específicos sem remover os eventos atuais do quiz:

```txt
stop:settings
stop:start
stop:submitAnswers
stop:callStop
stop:roundTimeout
stop:validateAnswer
stop:finishReview
stop:nextRound
```

Eventos esperados:

#### stop:settings

Host atualiza categorias e regras.

#### stop:start

Host inicia partida Stop.

#### stop:submitAnswers

Jogador envia ou atualiza respostas durante a rodada.

#### stop:callStop

Jogador aciona STOP.

#### stop:validateAnswer

Host marca resposta como válida/inválida na revisão.

#### stop:finishReview

Host confirma pontuação da rodada.

#### stop:nextRound

Host avança para a próxima letra/rodada.

### 10. Interface visual

Manter a identidade visual atual do MovizzQuizz:

- fundo escuro com gradiente;
- cards translúcidos;
- botões arredondados;
- visual moderno;
- responsivo para celular.

Telas necessárias:

1. Home com seleção de modo de jogo.
2. Lobby Stop.
3. Configuração de temas.
4. Rodada Stop.
5. Tela de STOP/aguardando revisão.
6. Revisão da rodada pelo host.
7. Ranking final.

### 11. UX da rodada Stop

Durante a rodada, exibir:

- código da sala;
- letra sorteada em grande destaque;
- cronômetro;
- lista de temas com inputs;
- botão grande **STOP**;
- placar lateral;
- indicador de jogadores que já enviaram resposta.

Ao clicar em STOP:

- bloquear edição do jogador;
- avisar todos os participantes;
- encerrar a rodada para todos ou iniciar fechamento imediato.

### 12. Persistência no PostgreSQL

A implementação pode começar em memória, mas deve preparar persistência no banco.

Se o Prisma já estiver implementado conforme `PROMPT_CODEX_LOCAL_SETUP.md`, adicionar modelos ou campos para suportar múltiplos modos de jogo.

Modelos sugeridos adicionais:

#### StopRound

- `id`
- `roomId`
- `sessionId`
- `roundNumber`
- `letter`
- `status`
- `startedAt`
- `endedAt`
- `stoppedByPlayerId`
- `createdAt`
- `updatedAt`

#### StopCategory

- `id`
- `roomId` ou `sessionId`
- `name`
- `order`
- `createdAt`
- `updatedAt`

#### StopAnswer

- `id`
- `roundId`
- `playerId`
- `categoryId`
- `answer`
- `normalizedAnswer`
- `autoValid`
- `hostValid`
- `unique`
- `points`
- `createdAt`
- `updatedAt`

Se preferir, na primeira versão usar JSON em `GameSession.deck/settings/history`, mas deixar clara a evolução para tabelas específicas.

### 13. Compatibilidade com o quiz existente

Não remover nem quebrar:

- criação de sala do quiz;
- lobby do quiz;
- início do quiz;
- respostas do quiz;
- ranking do quiz;
- banco de perguntas do quiz.

A mudança deve ser incremental:

- extrair componentes compartilhados quando útil;
- criar engines separadas se necessário:

```txt
server/src/engines/quizEngine.js
server/src/engines/stopEngine.js
```

Ou manter `gameEngine.js` se a alteração for pequena, mas preferir separação para manutenção.

### 14. Nomes de componentes sugeridos no frontend

```txt
client/src/components/GameModeSelector.jsx
client/src/components/RoomHeader.jsx
client/src/components/Scoreboard.jsx
client/src/games/quiz/QuizGame.jsx
client/src/games/stop/StopLobby.jsx
client/src/games/stop/StopGame.jsx
client/src/games/stop/StopReview.jsx
client/src/games/stop/StopFinal.jsx
```

Não é obrigatório seguir exatamente, mas a estrutura deve ficar organizada.

### 15. Normalização de respostas

Criar função utilitária para normalizar texto:

```js
function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
```

Criar função para verificar letra inicial:

```js
function startsWithLetter(answer, letter) {
  return normalizeAnswer(answer).startsWith(normalizeAnswer(letter));
}
```

### 16. Critério mínimo de aceite

A implementação será considerada pronta quando for possível:

1. Abrir `localhost:5180`.
2. Escolher entre Quiz e Stop/Adedanha.
3. Criar sala Stop.
4. Entrar na sala Stop em outra aba/navegador usando código.
5. Host adicionar/remover/renomear temas livremente.
6. Host iniciar partida.
7. Sistema sortear letra.
8. Jogadores preencherem respostas.
9. Jogador clicar STOP.
10. Rodada encerrar e ir para revisão.
11. Host validar/invalidar respostas.
12. Sistema calcular pontos.
13. Host avançar rodadas.
14. Ranking final aparecer.
15. Quiz anterior continuar funcionando.

## Observações de produto

O nome público do jogo pode ser exibido como:

```txt
Stop / Adedanha
```

Como há variações regionais no Brasil, usar os dois nomes facilita o entendimento.

## Observações legais e de marca

O modo Stop/Adedanha é genérico e não depende de marcas oficiais. Manter identidade visual própria do MovizzQuizz, sem uso de logos de franquias protegidas.

## Resultado esperado

Ao final, entregar:

- site com dois modos de jogo;
- quiz existente preservado;
- novo modo Stop/Adedanha jogável entre amigos;
- temas 100% personalizados pelo host;
- interface moderna e responsiva;
- backend Socket.IO com eventos específicos do Stop;
- documentação atualizada no README;
- compatibilidade com portas locais atuais:

```txt
Frontend: localhost:5180
Backend/API/Socket.IO: localhost:8001
PostgreSQL: localhost:5432
```

## Prompt curto para execução no Codex

Leia integralmente este arquivo `PROMPT_CODEX_STOP_ADEDANHA.md` e implemente o novo modo de jogo Stop/Adedanha no MovizzQuizz, preservando o quiz atual. O host deve poder personalizar 100% os temas da partida, criar sala, receber amigos por código, iniciar rodadas por letra, receber respostas, permitir STOP, revisar respostas, pontuar e exibir ranking final. Atualize o README e mantenha as portas locais: frontend 5180, backend 8001, PostgreSQL 5432.
