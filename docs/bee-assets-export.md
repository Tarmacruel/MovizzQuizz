# MovizzQuizz — Exportação dos PNGs da identidade Bee

## Objetivo

Garantir que navegador, PWA e APK Android usem os novos ícones Bee em PNG, não mais o SVG antigo `/favicon.svg`.

## Fluxo obrigatório antes do build/deploy

```bash
cd client
npm install
npm run assets:bee
npm run build
```

O comando `npm run assets:bee` gera os PNGs finais a partir dos SVGs-fonte em `client/public/brand/bee/`.

## Arquivos esperados

### Ícones PWA/navegador

```txt
client/public/brand/bee/icons/icon-192x192.png
client/public/brand/bee/icons/icon-512x512.png
client/public/brand/bee/icons/icon-maskable-512x512.png
client/public/brand/bee/icons/apple-touch-icon-180x180.png
client/public/brand/bee/icons/favicon-32x32.png
client/public/brand/bee/icons/favicon-16x16.png
client/public/brand/bee/icons/android-notification-monochrome.png
```

### Android adaptive icon

```txt
client/public/brand/bee/android/adaptive-icon-foreground.png
client/public/brand/bee/android/adaptive-icon-background.png
```

### Avatares

```txt
client/public/brand/bee/avatars/default-user-64x64.png
client/public/brand/bee/avatars/default-user-128x128.png
client/public/brand/bee/avatars/default-user-256x256.png
client/public/brand/bee/avatars/default-user-512x512.png
client/public/brand/bee/avatars/guest-user-64x64.png
client/public/brand/bee/avatars/guest-user-128x128.png
client/public/brand/bee/avatars/guest-user-256x256.png
client/public/brand/bee/avatars/guest-user-512x512.png
```

## Pontos alterados para usar os novos ícones

- `client/index.html`
- `client/vite.config.js`

## Validação no navegador

1. Rodar build/deploy com os PNGs gerados.
2. Abrir DevTools.
3. Aba Application.
4. Conferir Manifest.
5. Verificar se os ícones apontam para:

```txt
/brand/bee/icons/icon-192x192.png
/brand/bee/icons/icon-512x512.png
/brand/bee/icons/icon-maskable-512x512.png
```

6. Abrir diretamente no navegador:

```txt
https://SEU_DOMINIO/brand/bee/icons/favicon-32x32.png?v=bee-1
https://SEU_DOMINIO/brand/bee/icons/icon-512x512.png
```

## Cache busting

O `index.html` já usa `?v=bee-1` nos favicons para reduzir cache do navegador.

Se o favicon antigo persistir:

1. Limpar cache do navegador.
2. Limpar dados do site.
3. No Android, desinstalar o APK ou limpar dados do app.
4. Reabrir após novo deploy.

## Observação

O favicon é agressivamente cacheado por navegadores e WebViews. Pode demorar a atualizar se o app/site já foi aberto anteriormente. O teste mais confiável é abrir diretamente o PNG pelo caminho público e conferir o Manifest no DevTools.
