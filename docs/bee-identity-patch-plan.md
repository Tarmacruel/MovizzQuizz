# MovizzQuizz — Plano de execução da nova identidade visual Bee

## 1. Objetivo

Migrar a identidade visual do MovizzQuizz para uma linguagem **bee / honeycomb / neon gold + purple**, alinhando o significado sonoro dos “zz” ao zumbido da abelha e aplicando essa identidade em site, PWA e app Android.

Este documento organiza:

- os ativos já gerados;
- o que entra no primeiro patch;
- o que fica para patches seguintes;
- a ordem de implementação no repositório;
- a checklist de acompanhamento.

---

## 2. Direção visual aprovada

### Conceito

**MovizzQuizz** passa a ter uma identidade baseada em:

- abelha gamer / bee bot;
- honeycomb / hexágonos;
- fundo escuro premium;
- dourado mel como cor primária;
- violeta/neon como cor secundária;
- elementos de game UI moderna;
- mascote como eixo visual para app, splash, avatar e empty states.

### Paleta base sugerida

| Uso | Cor | Hex |
|---|---|---:|
| Fundo principal | Charcoal / quase preto | `#070713` |
| Superfície escura | Deep navy | `#0d1020` |
| Mel primário | Honey gold | `#f7c948` |
| Âmbar | Amber | `#f59e0b` |
| Dourado claro | Soft gold | `#ffe08a` |
| Violeta neon | Electric violet | `#8b5cf6` |
| Magenta de energia | Neon magenta | `#ec4899` |
| Texto principal | White/silver | `#f8fafc` |
| Texto secundário | Slate | `#cbd5e1` |
| Erro | Red honey warning | `#f87171` |
| Sucesso | Green neon | `#34d399` |

---

## 3. Catálogo resumido de ativos já gerados

> Observação: este catálogo lista os ativos já disponíveis na sessão de geração. Na implementação, os arquivos precisam ser copiados/exportados para `client/public/brand/bee/` ou caminho equivalente.

### 3.1 Ativos canônicos recomendados para o Patch 1

| Função | Arquivo de origem | Status |
|---|---|---:|
| Brand board / guia visual | `futuristic_honeybee_themed_game_app_branding.png` | `[x]` |
| Ícone principal base | `neon_bee_robot_gaming_icon.png` | `[x]` |
| Avatar padrão | `neon_bee_robot_mascot_emblem.png` | `[x]` |
| Badge admin | `royal_robotic_bee_crest_badge.png` | `[x]` |
| Splash mobile | `futuristic_bee_themed_app_splash_screen.png` | `[x]` |
| Login mobile referência | `futuristic_quiz_app_login_screen.png` | `[x]` |
| Home/lobby referência | `bee_themed_game_lobby_ui_design.png` | `[x]` |
| Quiz gameplay referência | `cinematic_quiz_app_with_bee_theme.png` | `[x]` |
| Ludo gameplay referência | `bee_themed_ludo_mobile_game_interface.png` | `[x]` |
| Background horizontal | `futuristic_hexagonal_glow_symmetry.png` | `[x]` |
| Background vertical | `futuristic_hexagonal_tech_grid_design.png` | `[x]` |
| Painel/card base | `futuristic_glowing_sci_fi_panel_design.png` | `[x]` |
| CTA Criar Sala | `futuristic_create_room_button_design.png` | `[x]` |
| CTA Entrar | `glowing_futuristic_enter_button_design.png` | `[x]` |

### 3.2 Ativos alternativos em espera

Estes arquivos são úteis como inspiração, mas não devem entrar todos no Patch 1 para evitar duplicidade visual:

- `neon_bee_gamer_mascot_icon.png`
- `neon_bee_gamer_icon_design.png`
- `neon_gaming_bee_mascot.png`
- `bee_robot_mascot_icon_with_neon_glow.png`
- `bee_gamer_mascot_in_neon_corner_glow.png`
- `playful_bee_mascot_with_game_controller.png`
- `futuristic_neon_ui_button_design.png`
- `glowing_game_button_with_bee_mascot.png`
- `sleek_honeycomb_themed_gaming_platform_dashboard.png`
- `futuristic_gaming_quiz_platform_dashboard.png`
- `bee_themed_mobile_app_login_screen.png`
- `futuristic_quiz_game_interface_in_neon.png`
- `movizzquizz_board_game_interface_design.png`

---

## 4. Patch 1 — Foundation visual e assets obrigatórios

### Objetivo

Criar a base visual global sem reescrever todas as telas de uma vez. O Patch 1 deve trocar a linguagem visual geral, preparar os arquivos finais de instalação e criar o sistema de tokens CSS.

### Escopo

#### 4.1 Assets finais de instalação

- [ ] Exportar `icon-192x192.png`
- [ ] Exportar `icon-512x512.png`
- [ ] Exportar `icon-maskable-512x512.png`
- [ ] Exportar `apple-touch-icon-180x180.png`
- [ ] Exportar `favicon-32x32.png`
- [ ] Exportar `favicon-16x16.png`
- [ ] Exportar `android-notification-monochrome.png` ou SVG equivalente
- [ ] Exportar `adaptive-icon-foreground.png`
- [ ] Exportar `adaptive-icon-background.png`

#### 4.2 Estrutura de arquivos sugerida

```txt
client/public/brand/bee/
  icons/
    icon-192x192.png
    icon-512x512.png
    icon-maskable-512x512.png
    apple-touch-icon-180x180.png
    favicon-32x32.png
    favicon-16x16.png
    android-notification-monochrome.png
    adaptive-icon-foreground.png
    adaptive-icon-background.png
  backgrounds/
    app-bg-vertical.png
    app-bg-horizontal.png
    honeycomb-subtle.png
    splash-mobile.png
  avatars/
    default-user.png
    guest-user.png
    admin-badge.png
  ui/
    panel-glass.png
    cta-primary.png
    cta-secondary.png
```

#### 4.3 CSS global

- [ ] Criar `client/src/bee-theme.css`
- [ ] Definir tokens CSS globais:
  - `--bee-bg`
  - `--bee-surface`
  - `--bee-surface-strong`
  - `--bee-gold`
  - `--bee-amber`
  - `--bee-violet`
  - `--bee-magenta`
  - `--bee-text`
  - `--bee-muted`
  - `--bee-border`
  - `--bee-shadow`
- [ ] Atualizar `main.jsx` para importar `bee-theme.css`
- [ ] Aplicar fundo global dark/honeycomb no `body`
- [ ] Atualizar botões globais `.auth-primary`, `.auth-secondary`, `.primary`, `.secondary`
- [ ] Atualizar cards globais e painéis principais
- [ ] Atualizar estados `disabled`, `focus`, `hover`, `loading`

#### 4.4 Manifest/PWA

- [ ] Atualizar `vite.config.js` para apontar para PNGs reais
- [ ] Atualizar `index.html` para usar favicons reais
- [ ] Atualizar `theme-color` para a nova paleta
- [ ] Validar manifest no DevTools
- [ ] Validar instalação no Chrome Android
- [ ] Validar Safari/iOS via “Adicionar à Tela de Início”

### Critérios de aceite do Patch 1

- [ ] O app abre normalmente no navegador e APK
- [ ] A tela de login já exibe a identidade bee global
- [ ] A home/lobby já exibe a identidade bee global
- [ ] Ícones PWA reais aparecem corretamente
- [ ] O APK não volta a exibir assets antigos principais
- [ ] `npm run build` passa
- [ ] `npm run android:sync` passa

---

## 5. Patch 2 — Telas de entrada, home e conta

### Objetivo

Aplicar a nova identidade nas telas mais vistas antes de mexer nos jogos.

### Escopo

- [ ] Reestilizar `AuthFirstEntry.jsx`
- [ ] Reestilizar tela de login/registro
- [ ] Reestilizar opção visitante/admin
- [ ] Reestilizar home/lobby pós-login
- [ ] Aplicar avatar padrão bee
- [ ] Aplicar badge admin e visitante
- [ ] Reestilizar cards de modo de jogo
- [ ] Reestilizar salas públicas, privadas e recuperáveis
- [ ] Criar empty states bee:
  - sem salas públicas;
  - sem salas privadas;
  - sem salas recuperáveis.
- [ ] Criar bottom navigation mobile com a nova identidade, se aplicável

### Critérios de aceite

- [ ] Login, visitante e admin continuam funcionando
- [ ] Criar sala continua funcionando
- [ ] Entrar com código continua funcionando
- [ ] Tela antiga não reaparece ao sair de sala
- [ ] Visual desktop e mobile seguem a mesma identidade

---

## 6. Patch 3 — Jogos: Quiz, Stop e Ludo

### Objetivo

Aplicar a identidade bee nas telas internas de jogo sem alterar regra de jogo.

### Escopo geral

- [ ] Criar tokens visuais específicos de game HUD
- [ ] Reestilizar cabeçalhos de sala
- [ ] Reestilizar placares e avatars de jogadores
- [ ] Reestilizar botões de ação e chat
- [ ] Criar estado de loading por jogo
- [ ] Criar tela de resultado por jogo

### Quiz

- [ ] Reestilizar pergunta/card central
- [ ] Reestilizar alternativas A/B/C/D
- [ ] Reestilizar timer
- [ ] Reestilizar ranking parcial
- [ ] Criar feedback correto/incorreto com paleta bee

### Stop / Adedanha

- [ ] Reestilizar letra sorteada
- [ ] Reestilizar categorias
- [ ] Reestilizar inputs de resposta
- [ ] Reestilizar revisão/validação de respostas
- [ ] Reestilizar ranking da rodada

### Ludo

- [ ] Reestilizar board container
- [ ] Reestilizar peças com tema bee, mantendo legibilidade
- [ ] Reestilizar indicação de destino possível
- [ ] Reestilizar stack de peças na mesma casa
- [ ] Reestilizar dado/dice area
- [ ] Reestilizar chat/reações rápidas

### Critérios de aceite

- [ ] Nenhuma regra do motor é alterada
- [ ] Ludo continua clicável em mobile
- [ ] Quiz continua respondendo corretamente
- [ ] Stop continua salvando/resolvendo respostas
- [ ] Visual mantém contraste e legibilidade

---

## 7. Patch 4 — Android/Play Store readiness

### Objetivo

Preparar os ativos reais e a camada visual final para empacotamento Android.

### Escopo

- [ ] Gerar ícones Android finais por densidade
- [ ] Gerar adaptive icon final
- [ ] Gerar splash screen final Android
- [ ] Atualizar configuração Capacitor/Android se necessário
- [ ] Validar em aparelho físico
- [ ] Gerar APK debug
- [ ] Gerar AAB release
- [ ] Configurar keystore
- [ ] Testar instalação do APK fora do Android Studio
- [ ] Preparar assets para Play Store:
  - ícone 512x512;
  - feature graphic 1024x500;
  - screenshots mobile;
  - descrição curta;
  - descrição completa.

---

## 8. Patch 5 — Refinamento, performance e acessibilidade

### Objetivo

Concluir a migração visual com polimento técnico.

### Escopo

- [ ] Lighthouse Performance
- [ ] Lighthouse PWA
- [ ] Lighthouse Accessibility
- [ ] Reduzir peso de imagens
- [ ] Converter imagens grandes para WebP/AVIF quando adequado
- [ ] Lazy-load de imagens decorativas
- [ ] Testar dispositivo Android antigo
- [ ] Revisar contraste mínimo
- [ ] Revisar tamanho mínimo de toque
- [ ] Revisar estados de foco e teclado
- [ ] Revisar animações para 60fps

---

## 9. Ordem recomendada de execução imediata

1. **Gerar/exportar PNGs finais a partir dos ativos canônicos**
2. **Adicionar assets em `client/public/brand/bee/`**
3. **Criar `bee-theme.css` com tokens globais**
4. **Atualizar manifest/PWA para os PNGs reais**
5. **Aplicar tema global em Auth/Home**
6. **Validar build web e Android**
7. **Só depois aplicar telas internas de jogo**

---

## 10. Checklist vivo

Este arquivo deve ser atualizado a cada PR visual.

### Atualizações realizadas neste PR

- [x] Criado plano faseado da nova identidade bee
- [x] Catalogados ativos canônicos e alternativos
- [x] Definida estrutura de diretórios sugerida
- [x] Definidos critérios de aceite por patch
- [x] Definida ordem recomendada de execução

### Próximo PR sugerido

**`feat/bee-identity-assets-pack`**

Escopo:

- exportar PNGs finais;
- adicionar assets em `client/public/brand/bee/`;
- atualizar `vite.config.js` e `index.html` para usar os novos ícones;
- criar `bee-theme.css` inicial.
