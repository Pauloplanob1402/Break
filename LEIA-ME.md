# BREAK PWA — Guia de Deploy e Publicação

## 1. Estrutura do projeto

```
break-pwa/
├── index.html           ← App principal (tudo em um arquivo)
├── sw.js                ← Service Worker (cache + notificações)
├── manifest.json        ← Configuração PWA
├── breaks.json          ← Banco de dados dos breaks
├── vercel.json          ← Headers Vercel (CRÍTICO para sw.js funcionar)
├── netlify.toml         ← Headers Netlify
├── .well-known/
│   └── assetlinks.json  ← Para TWA/Bubblewrap (preencher depois)
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## 2. Subir no GitHub

1. Crie um repositório público no GitHub
2. Faça upload de TODOS os arquivos (incluindo `.well-known/assetlinks.json`)
3. Commit na branch `main`

---

## 3. Deploy na Vercel

1. Acesse vercel.com → "Add New Project"
2. Importe o repositório do GitHub
3. **Framework Preset**: selecione **"Other"** (não Next.js)
4. **Root Directory**: deixe vazio (raiz do projeto)
5. Clique em Deploy
6. O `vercel.json` já configura os headers necessários automaticamente

---

## 4. Configurar AdSense

No `index.html`, substitua as duas ocorrências de:
```
ca-pub-XXXXXXXXXXXXXXXX
```
pelo seu Publisher ID real do Google AdSense.

Também substitua o slot `0000000000` pelo ID do seu anúncio.

---

## 5. Empacotar com Bubblewrap (APK/AAB para Play Store)

### Pré-requisitos
```bash
npm install -g @bubblewrap/cli
```
Java JDK 8+ instalado.

### Passos

```bash
# 1. Inicializa o projeto
bubblewrap init --manifest https://SEU-DOMINIO.vercel.app/manifest.json

# O Bubblewrap vai perguntar:
#   - Package name: com.seuapp.break
#   - App name: BREAK
#   - Signing key: crie um novo keystore

# 2. Gera o APK (para teste)
bubblewrap build

# O APK estará em: app-debug.apk (ou app-release-signed.apk)
```

### Depois de gerar o keystore:

1. Pegue o SHA-256 do seu keystore:
   ```bash
   keytool -list -v -keystore android.keystore -alias android
   ```
2. Cole o SHA-256 no arquivo `.well-known/assetlinks.json`
3. Faça commit e deploy novamente na Vercel
4. Isso faz a barra de URL desaparecer no Android (TWA completo)

---

## 6. Teste do APK

```bash
# Instalar no Android via ADB
adb install app-debug.apk
```

Ou transfira o `.apk` para o celular e instale manualmente
(ativar "Fontes desconhecidas" nas configurações).

---

## 7. Publicar na Play Store (AAB)

```bash
# Gera o AAB (formato exigido pela Play Store)
bubblewrap build --skipPwaValidation
```

O arquivo `app-release-signed.aab` estará pronto para upload no
Google Play Console → "Criar app" → "Lançamento de produção".

---

## 8. Premium — Integração de Pagamento

Para a Play Store, o pagamento ideal é via **Google Play Billing**
(Digital Goods API). O código já tem o comentário com o fluxo completo
na função `handleBuyPremium()` no `index.html`.

Alternativa mais simples (sem Play Billing):
- Use **Hotmart**, **Stripe** ou **Mercado Pago**
- Redirecione o usuário para o link de pagamento
- Após pagamento confirmado, ative o premium via código de ativação

---

## Checklist final antes de publicar

- [ ] Publisher ID do AdSense preenchido no `index.html`
- [ ] Package name definido no Bubblewrap
- [ ] SHA-256 do keystore no `assetlinks.json`
- [ ] Deploy feito na Vercel
- [ ] APK testado no celular
- [ ] Notificações testadas (abre o app, clica em "Ativar")
