# Zuma - Gift Cards Marketplace

Se tornar a maior plataforma de marketplace digital. Permitir pessoas comprarem gift cards e acessar o melhor do entretenimento digital.

---

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Supabase Storage URL
SUPABASE_STORAGE_URL=your_supabase_storage_url
```

> **Important**: Never commit your `.env.local` file or share the `SUPABASE_SERVICE_ROLE_KEY` publicly.

---

## Requisitos

- Node 18+
- npm ou yarn
- Conta e projeto no Supabase (https://app.supabase.io)
- Supabase CLI (opcional) — `npm i -g supabase`

---

## Instalação e Configuração

### 1) Instalar dependências

```bash
npm install
```

### 2) Aplicar schema SQL no Supabase

#### **📋 Database Schema Documentation**

The Zuma application uses a comprehensive PostgreSQL database schema. We provide multiple schema files:

| File | Purpose | When to Use |
|------|---------|-------------|
| **`supabase/MASTER_SCHEMA.sql`** | ✅ **Production-ready master schema** | Use this for new deployments |
| `supabase/SCHEMA_DOCUMENTATION.md` | Complete documentation | Read this first to understand the structure |
| `supabase/schema.sql` | Legacy schema | Deprecated - use MASTER_SCHEMA.sql |

**Key Features:**
- ✅ 25 tables covering all application needs
- ✅ Automated stock synchronization
- ✅ Customer statistics auto-update
- ✅ Performance indexes
- ✅ All QA fixes implemented

#### **Recommended Setup (Fresh Database):**

**A) Com Supabase CLI (recomendado):**

```bash
supabase link --project-ref your-project-ref
supabase db reset  # This will apply MASTER_SCHEMA.sql automatically
```

Arquivo: `supabase/schema.sql`

**A) Com Supabase CLI (recomendado):**

```bash
supabase login
supabase db connect  # abre psql
\i supabase/schema.sql
```

**B) Com psql e connection string:**

```bash
psql <CONNECTION_STRING> -f supabase/schema.sql
```

### 3) Aplicar Migrações

Execute as migrações na ordem:

```bash
psql <CONNECTION_STRING> -f supabase/migrations/20240101000001_add_digital_inventory.sql
psql <CONNECTION_STRING> -f supabase/migrations/20240102000000_add_analytics_indexes.sql
psql <CONNECTION_STRING> -f supabase/migrations/20240103000000_add_customer_fields.sql
```

### 4) Criar bucket de storage

Nome recomendado: `public-assets` (público)

**Com CLI:**

```bash
supabase storage create-bucket public-assets --public
```

### 5) Configurar variáveis de ambiente

Copie o exemplo acima e preencha com suas credenciais do Supabase.

### 6) Rodar em desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:3000

---

## Estrutura do Projeto

```
zuma/
├── app/               # Next.js App Router
│   ├── admin/        # Admin dashboard pages
│   ├── api/          # API routes
│   └── ...           # Public pages (home, checkout, etc)
├── components/       # React components
│   ├── admin/       # Admin-specific components
│   └── ...          # Shared components
├── lib/             # Utilities and configurations
│   ├── supabase/   # Supabase client setup
│   └── config.ts   # App configuration
├── supabase/        # Database schema and migrations
│   ├── schema.sql
│   └── migrations/
└── styles/          # Global styles
```

---

## API Endpoints

### Public API

- `POST /api/orders` - Create a new order
- `POST /api/analytics` - Track analytics events
- `GET /api/categories` - Get all categories
- `GET /api/brands` - Get all brands
- `GET /api/offers` - Get available offers
- `GET /api/site-content` - Get site configuration

### Admin API

Protected by authentication middleware. Requires admin role.

- `GET/POST/PATCH/DELETE /api/admin/categories` - Manage categories
- `GET/POST/PATCH/DELETE /api/admin/brands` - Manage brands
- `GET/POST/PATCH/DELETE /api/admin/offers` - Manage offers
- `GET/POST /api/admin/orders` - Manage orders
- `POST /api/admin/orders/[id]/status` - Update order status
- `GET /api/admin/analytics` - Get analytics data
- `GET/POST/PATCH/DELETE /api/admin/customers` - Manage customers
- And more...

---

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

---

## Testing

Run the backend checks:

```bash
npm run check
```

Useful individual commands:

```bash
npm run typecheck
npm run test:unit
```

Architecture notes live in `docs/BACKEND_ARCHITECTURE.md`.

---

## Security Notes

1. **Admin Access**: Only users with `admin` role in Supabase auth metadata can access admin routes
2. **Service Role Key**: Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
3. **Row Level Security**: Ensure RLS is enabled on all Supabase tables
4. **Environment Variables**: Keep `.env.local` out of version control

---

## Features

- ✅ Gift card marketplace
- ✅ Multi-region support
- ✅ Category and brand management
- ✅ Order management system
- ✅ Customer relationship tracking
- ✅ Analytics and reporting
- ✅ WhatsApp integration for order communication
- ✅ Digital code inventory management
- ✅ Admin dashboard with real-time stats

---

## Support

For issues or questions, please create an issue in the repository.
