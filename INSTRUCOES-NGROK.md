# Como Expor sua API Local para Receber Requisições Externas

## Opção 1: ngrok (Recomendado)

### Instalação
1. Baixe em: https://ngrok.com/download
2. Extraia o arquivo e coloque em uma pasta de fácil acesso

### Uso
1. **Inicie sua API local:**
   ```bash
   npm start
   ```

2. **Em outro terminal, execute o ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copie a URL gerada** (exemplo: `https://abc123.ngrok.io`)

4. **No n8n, use a URL do ngrok:**
   ```
   https://abc123.ngrok.io/webhook/roteiros
   ```

### Exemplo de saída do ngrok:
```
Session Status    online
Forwarding        https://1a2b-3c4d.ngrok.io -> http://localhost:3000
```

Use a URL `https://1a2b-3c4d.ngrok.io/webhook/roteiros` no n8n.

---

## Opção 2: localtunnel (Alternativa gratuita sem cadastro)

### Instalação
```bash
npm install -g localtunnel
```

### Uso
1. Inicie sua API:
   ```bash
   npm start
   ```

2. Em outro terminal:
   ```bash
   lt --port 3000
   ```

3. Copie a URL gerada (ex: `https://quiet-turkey-12.loca.lt`)

4. No n8n, use:
   ```
   https://quiet-turkey-12.loca.lt/webhook/roteiros
   ```

---

## Opção 3: Publicar em um servidor (Produção)

### Plataformas gratuitas que aceitam Node.js:
- **Render** (https://render.com) - Recomendado
- **Railway** (https://railway.app)
- **Fly.io** (https://fly.io)

Para produção, recomendo migrar de memória para um banco de dados.

---

## ⚠️ Importante
- **ngrok grátis:** URL muda toda vez que reiniciar
- **ngrok pago:** URL fixa personalizada
- Para produção, use servidor cloud permanente
