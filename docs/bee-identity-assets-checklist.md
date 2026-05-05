# MovizzQuizz — Checklist e catálogo de ativos da identidade Bee

## Objetivo

Catalogar os elementos visuais já gerados para a nova identidade visual do MovizzQuizz, evitando duplicidade antes de iniciar a implementação em código.

A identidade aprovada parte do conceito:

> Os “zz” de MovizzQuizz remetem ao zumbido da abelha.

A linguagem visual consolidada combina:

- abelha gamer / bee bot;
- honeycomb / hexágonos;
- fundo escuro premium;
- dourado mel;
- violeta/magenta neon;
- UI moderna de jogo.

---

## 1. Ativos canônicos já gerados

| Status | Nome funcional | Arquivo de origem | Uso previsto |
|---|---|---|---|
| [x] | Brand board | `futuristic_honeybee_themed_game_app_branding.png` | guia visual macro |
| [x] | Ícone principal base | `neon_bee_robot_gaming_icon.png` | PWA, Android, app icon |
| [x] | Avatar padrão | `neon_bee_robot_mascot_emblem.png` | usuário comum |
| [x] | Badge admin | `royal_robotic_bee_crest_badge.png` | perfil/admin/badge |
| [x] | Splash mobile | `futuristic_bee_themed_app_splash_screen.png` | splash/loading |
| [x] | Login referência | `futuristic_quiz_app_login_screen.png` | tela de acesso |
| [x] | Home/lobby referência | `bee_themed_game_lobby_ui_design.png` | home pós-login/lobby |
| [x] | Quiz gameplay referência | `cinematic_quiz_app_with_bee_theme.png` | tela de quiz |
| [x] | Ludo gameplay referência | `bee_themed_ludo_mobile_game_interface.png` | tela de Ludo |
| [x] | Background horizontal | `futuristic_hexagonal_glow_symmetry.png` | desktop/hero |
| [x] | Background vertical | `futuristic_hexagonal_tech_grid_design.png` | mobile/app |
| [x] | Painel/card base | `futuristic_glowing_sci_fi_panel_design.png` | cards/modais |
| [x] | CTA Criar Sala | `futuristic_create_room_button_design.png` | botão primário |
| [x] | CTA Entrar | `glowing_futuristic_enter_button_design.png` | botão primário/login |

---

## 2. Ativos alternativos já gerados, mas não prioritários no Patch 1

Estes ativos cobrem necessidades semelhantes aos canônicos e devem ficar em espera para não gerar inconsistência visual:

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

## 3. Checklist de assets finais necessários

### 3.1 Instalação/PWA/Android

- [ ] `icon-192x192.png`
- [ ] `icon-512x512.png`
- [ ] `icon-maskable-512x512.png`
- [ ] `apple-touch-icon-180x180.png`
- [ ] `favicon-32x32.png`
- [ ] `favicon-16x16.png`
- [ ] `android-notification-monochrome.png` ou SVG equivalente
- [ ] `adaptive-icon-foreground.png`
- [ ] `adaptive-icon-background.png`

### 3.2 Backgrounds e superfícies

- [x] Background horizontal base gerado
- [x] Background vertical base gerado
- [x] Painel/card base gerado
- [ ] `app-bg-horizontal.png`
- [ ] `app-bg-vertical.png`
- [ ] `honeycomb-subtle.png`
- [ ] `panel-glass.png`
- [ ] `splash-mobile.png`

### 3.3 Avatares/badges

- [x] Avatar padrão base gerado
- [x] Badge admin base gerado
- [ ] `default-user-64.png`
- [ ] `default-user-128.png`
- [ ] `default-user-256.png`
- [ ] `default-user-512.png`
- [ ] `guest-user.png`
- [ ] `admin-badge.png`
- [ ] `host-badge.png`
- [ ] `winner-badge.png`

### 3.4 Ícones funcionais

- [ ] Quiz Cultura Pop
- [ ] Stop / Adedanha
- [ ] Ludo
- [ ] Perfil
- [ ] Sair
- [ ] Entrar em sala
- [ ] Sala pública
- [ ] Sala privada
- [ ] Configurações
- [ ] Som/música
- [ ] Ranking/troféu
- [ ] Loading

### 3.5 UI kit mínimo

- [x] Botão Entrar base gerado
- [x] Botão Criar Sala base gerado
- [ ] Botão primário CSS/tokenizado
- [ ] Botão secundário CSS/tokenizado
- [ ] Botão ghost/terciário
- [ ] Estado hover
- [ ] Estado pressed
- [ ] Estado disabled
- [ ] Estado loading
- [ ] Input focus
- [ ] Input error
- [ ] Input success
- [ ] Toggle/segmented control
- [ ] Modal/card kit

### 3.6 Empty states e feedback

- [ ] Sem salas públicas
- [ ] Sem salas privadas
- [ ] Sem salas recuperáveis
- [ ] Ranking vazio
- [ ] Offline
- [ ] Erro genérico
- [ ] Spinner/loader
- [ ] Skeleton cards

---

## 4. Conjunto canônico recomendado para iniciar o Patch 1

Para evitar duplicidade, o primeiro patch deve partir deste conjunto:

```txt
Brand board: futuristic_honeybee_themed_game_app_branding.png
Ícone base: neon_bee_robot_gaming_icon.png
Avatar padrão: neon_bee_robot_mascot_emblem.png
Badge admin: royal_robotic_bee_crest_badge.png
Splash: futuristic_bee_themed_app_splash_screen.png
Login ref: futuristic_quiz_app_login_screen.png
Home/lobby ref: bee_themed_game_lobby_ui_design.png
Quiz ref: cinematic_quiz_app_with_bee_theme.png
Ludo ref: bee_themed_ludo_mobile_game_interface.png
Background horizontal: futuristic_hexagonal_glow_symmetry.png
Background vertical: futuristic_hexagonal_tech_grid_design.png
Panel/card: futuristic_glowing_sci_fi_panel_design.png
CTA Criar Sala: futuristic_create_room_button_design.png
CTA Entrar: glowing_futuristic_enter_button_design.png
```

---

## 5. Próxima ação recomendada

Criar PR `feat/bee-identity-assets-pack` com:

- export dos PNGs finais;
- inclusão em `client/public/brand/bee/`;
- criação de `client/src/bee-theme.css`;
- atualização do manifest/PWA;
- atualização do `index.html`;
- aplicação inicial em login/home.
