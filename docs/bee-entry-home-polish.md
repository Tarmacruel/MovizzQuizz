# MovizzQuizz — Patch visual Bee para entrada e home

## Objetivo

Avançar o Patch 2 da identidade Bee sem alterar a lógica de autenticação, visitante, criação de sala ou entrada por código.

Este patch reforça visualmente a nova identidade nas telas de entrada e home/lobby por meio de uma camada CSS isolada.

## Arquivo principal

```txt
client/src/bee-entry-home.css
```

## Escopo implementado

- Fundo visual com honeycomb e luzes gold/violet nas telas de entrada e home.
- Marca visual “ZZ” como referência ao zumbido da abelha.
- Mascote/ícone Bee aplicado de forma decorativa no bloco de entrada.
- Polimento dos cards de acesso: Conta, Visitante e Admin.
- Polimento dos cards de modo de jogo.
- Polimento dos cards de sala pública.
- Estado vazio visual para “nenhuma sala pública”.
- Microinterações de hover/active em botões e cards.
- Topbar da home com aparência glassmorphism.
- Badge textual “Buzz Hub” no header desktop.

## Fora do escopo

- Alterar lógica de login.
- Alterar socket/criação de sala.
- Alterar telas internas de Quiz, Stop ou Ludo.
- Alterar regras de jogo.
- Reestruturar `AuthFirstEntry.jsx`.

## Validação sugerida

```bash
cd client
npm run assets:bee
npm run build
```

Testar:

1. Tela inicial sem sessão.
2. Login com conta.
3. Criar conta.
4. Entrar como visitante.
5. Criar sala.
6. Entrar com código.
7. Sair da sala e confirmar que não volta tela antiga.
8. Visual mobile no navegador.
9. Visual no APK Android.

## Próxima etapa sugerida

`feat/bee-identity-entry-home-structure`

Escopo recomendado:

- Pequena revisão estrutural do `AuthFirstEntry.jsx` para permitir ícones por tipo de conta.
- Empty states mais ricos.
- Cards de modo de jogo com ícones específicos Bee.
- Melhor distinção visual entre Quiz, Stop e Ludo.
