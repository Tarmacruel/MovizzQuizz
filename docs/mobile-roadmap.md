# MovizzQuizz Mobile Roadmap

## Direcao adotada

A publicacao na Apple Store nao faz parte do plano atual por custo. A compatibilidade com iPhone/iPad sera mantida via Safari/PWA, com suporte a adicionar o app na Tela de Inicio.

A publicacao nativa planejada e apenas para Android/Google Play, via Capacitor.

---

## Fase 1 - PWA

Status nesta branch:

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
- [ ] Gerar PNGs reais 192x192, 512x512 e maskable a partir dos SVGs
- [ ] Testar instalacao no Chrome/Android
- [ ] Testar instalacao no Safari/iOS
- [ ] Testar modo offline real
- [ ] Validar Lighthouse PWA
- [ ] Deploy em producao

Observacao: SVG funciona como base visual e manifest inicial, mas para melhor compatibilidade na Play Store/Android e recomendavel gerar PNGs reais.

---

## Fase 2 - Capacitor Android

Escopo revisado:

- [ ] Instalar Capacitor
- [ ] Configurar `capacitor.config.json`
- [ ] Configurar Android package id
- [ ] Instalar Android platform
- [ ] Instalar plugins realmente uteis:
  - Network
  - Haptics
  - App
  - Local Notifications, se for usada notificacao local
- [ ] Criar splash screen
- [ ] Configurar icones Android
- [ ] Build APK debug
- [ ] Build APK release
- [ ] Assinar APK/AAB com keystore
- [ ] Publicar na Google Play Store

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

## Comandos recomendados

```bash
cd client
npm install
npm run build
npm run preview
```

Teste PWA:

1. Abrir o app em HTTPS.
2. Verificar aba Application no DevTools.
3. Confirmar Manifest.
4. Confirmar Service Worker ativo.
5. Instalar no Chrome/Android.
6. Testar offline parcial.

