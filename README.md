# zuma
Se tornar a maior plataforma de marketplace digital. Permitir pessoas comprarem gift cards e acessar o melhor do entretenimento digital.

---

## Etapa 1 — Infra & Base (Rápido)

Abaixo estão os passos mínimos para colocar o projeto em funcionamento localmente e conectar ao Supabase.

### Requisitos
- Node 18+
- npm ou yarn
- Conta e projeto no Supabase (https://app.supabase.io)
- Supabase CLI (opcional) — `npm i -g supabase`

### 1) Instalar dependências

npm install

### 2) Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- (opcional) SUPABASE_STORAGE_URL

> **Importante**: não compartilhe `SUPABASE_SERVICE_ROLE_KEY` publicamente.

### 3) Rodar em desenvolvimento

npm run dev

### 4) Aplicar schema SQL no Supabase

Arquivo: `supabase/schema.sql`

A) Com Supabase CLI (recomendado):
1. `supabase login`
2. `supabase db connect` (abre psql)
3. Execute: `\i supabase/schema.sql`

B) Com psql e connection string:
`psql <CONNECTION_STRING> -f supabase/schema.sql`

### 5) Criar bucket de storage
Nome recomendado: `public-assets` (público)

Com CLI:

supabase storage create-bucket public-assets --public

### 6) Testar upload (Admin)
Acesse `/admin/upload` no dev e faça upload de imagens para `public-assets`.

---

## API (Etapa 2 — Orders & Handoff)

Endpoints server-side:

POST /api/orders
- Body JSON (ex):
  {
    "customer_name": "Fulano",
    "customer_email": "fulano@email.com",
    "customer_whatsapp": "+258XXXXXXXXX",
    "payment_method_id": "<uuid>",
    "items": [{"offer_id": "<uuid>", "qty": 1, "unit_price": 10.00, "currency": "MZN"}],
    "currency": "MZN",
    "session_id": "optional-session-id"
  }

- Cria `orders` + `order_items` atomically via RPC `create_order`.
- Retorna: { "orderNumber": "ZM-000001" }

POST /api/orders/[orderNumber]/handoff
- Marca o pedido `status = on_hold`, `handoff_clicked_at = now()` e grava evento `whatsapp_clicked`.
- Retorno: { "ok": true }

---

Se quiser, eu implemento o frontend do checkout que chama `/api/orders` e redireciona para `/order/{orderNumber}/success`.

Se quiser, eu posso continuar e implementar as rotas core (brand pages, checkout) e as APIs (orders/handoff). Diga qual passo quer que eu faça a seguir.
