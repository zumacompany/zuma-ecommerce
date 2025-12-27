# Verificações — Etapa 1 (Infra & Base)

Checklist para verificar que tudo está funcionando localmente com Supabase conectado.

1) Variáveis de ambiente
- Copiar `.env.example` → `.env.local` e preencher as chaves do seu projeto Supabase.

2) Instalar e executar
- `npm install`
- `npm run dev`
- Abrir http://localhost:3000 — ver a home com o título

3) Conectar ao Supabase
- Verificar `console.warn` no navegador/terminal caso as variáveis não estejam configuradas

4) Aplicar o SQL
- Usando Supabase CLI: `supabase db connect` e `\i supabase/schema.sql`
- Verificar no Console Supabase que as tabelas foram criadas

5) Criar bucket de storage
- `supabase storage create-bucket public-assets --public`
- Fazer upload manual via painel (opção rápida) para testar permissões

6) Testar upload via app
- Acesse `/admin/upload`
- (Opcional) Enviar link de login por email (requer SMTP configurado no Supabase)
- Fazer upload de uma imagem e verificar se aparece na lista
- Clicar no link do arquivo e confirmar que abre a imagem pública

7) Verificar policies (básico)
- No painel Supabase, confira Row Level Security habilitada e as policies criadas

8) Próximos passos
- Implementar API de orders (`/api/orders`) e handoff (`/api/orders/[id]/handoff`)
- Criar páginas de catálogo e checkout

Se quiser, eu posso prosseguir e implementar a API `/api/orders` com a RPC `generate_order_number()` e o fluxo de checkout.
