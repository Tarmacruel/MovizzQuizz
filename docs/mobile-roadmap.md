# MovizzQuizz Mobile Roadmap

## Direcao adotada

A publicacao na Apple Store nao faz parte do plano atual por custo. A compatibilidade com iPhone/iPad sera mantida via Safari/PWA, com suporte a adicionar o app na Tela de Inicio.

A publicacao nativa planejada e apenas para Android/Google Play, via Capacitor.

---

## Fase 1 - PWA

Status atual:

- [x] Configurar Vite PWA Plugin
- [x] Criar manifest via `vite-plugin-pwa`
- [x] Adicionar icones SVG base
- [x] Adicionar icone maskable SVG
- [x] Adicionar apple touch icon SVG
- [x] Registrar Service Worker com `virtual:pwa-register`
- [x] Adicionar meta tags mobile/iOS
- [x] Configurar cache strategies iniciais
- [x] Adicionar prompt de instalacao PWA
- [x] Adicionar fallback offline simples
- [x] Testar em computador e navegador mobile
- [ ] Gerar PNGs reais 192x192, 512x512 e maskable a partir dos SVGs
- [ ] Validar Lighthouse PWA formalmente

Observacao: SVG funciona como base visual e manifest inicial, mas para melhor compatibilidade na Play Store/Android e recomendavel gerar PNGs reais.

---

## Fase 2 - Capacitor Android

Status atual:

- [x] Adicionar dependencias Capacitor no `client/package.json`
- [x] Configurar `capacitor.config.json`
- [x] Configurar Android package id: `br.com.sirel.movizzquizz`
- [x] Adicionar scripts NPM para Android/Capacitor
- [x] Preparar bridge nativa segura para App, Network, Haptics, StatusBar e SplashScreen
- [x] Adicionar banner de conexao offline para PWA/app nativo
- [x] Fixar `VITE_API_URL=https://quizz.sirel.com.br` para builds Android/producao
- [ ] Rodar `npm install`
- [ ] Rodar `npm run build`
- [ ] Gerar plataforma Android com `npm run android:add`
- [ ] Sincronizar com `npm run android:sync`
- [ ] Abrir Android Studio com `npm run android:open`
- [ ] Criar/validar splash screen real
- [ ] Configurar icones Android PNG reais
- [ ] Build APK debug
- [ ] Build AAB release
- [ ] Assinar AAB com keystore
- [ ] Publicar na Google Play Store

### Observacao critica sobre Android/Capacitor

Dentro do WebView do Capacitor, `window.location.origin` pode apontar para um host interno do app, como `https://localhost`. Por isso, o build de producao precisa usar explicitamente:

```bash
VITE_API_URL=https://quizz.sirel.com.br
```

Esse valor esta registrado em `client/.env.production`. Sem isso, login, criacao de sala e socket podem tentar comunicar com o localhost do proprio dispositivo Android.

Fora do escopo atual:

- App Store
- Build iOS nativo
- Apple Developer Program

Compatibilidade Apple sera pelo navegador/PWA.

---

## Fase 3 - Otimizacoes Mobile

- [ ] Implementar touch gestures onde fizer sentido
- [ ] Lazy loading de componentes pesados
- [ ] Code splitting do `App.jsx`/telas de jogo
- [ ] Reduzir bundle size
- [ ] Loading skeletons
- [ ] Otimizar animacoes para 60fps
- [ ] Testar dispositivos Android antigos
- [ ] Lighthouse Performance
- [ ] Revisar acessibilidade touch: tamanho minimo de botoes, foco e contraste

---

## Comandos recomendados - PWA

```bash
cd client
npm install
npm run build
npm run preview
```

## Comandos recomendados - Android/Capacitor

```bash
cd client
npm install
npm run build
npm run android:sync
npm run android:open
```

Se a pasta `android/` ainda nao existir:

```bash
npm run android:add
npm run android:sync
```

No Android Studio:

1. Aguardar Gradle Sync.
2. Selecionar um emulador ou celular fisico.
3. Rodar o app em debug.
4. Validar login, visitante, criacao de sala e entrada por codigo.
5. Gerar APK debug.
6. Depois configurar assinatura e gerar AAB release para Play Store.

