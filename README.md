# Bound Marketing — Portal da Agência

Portal de gestão de projetos, aprovações e briefings da **Bound Marketing**.
Três áreas distintas: **Admin** (agência), **Collaborator** (equipe) e **Client** (clientes finais).

Stack 100% **free**: Next.js 16 + Supabase (free tier) + Resend (3k emails/mês).

---

## 🚀 Quick Start (5 min)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas chaves:

- **Supabase**: crie um projeto em [supabase.com](https://supabase.com) → Settings → API
- **Resend**: crie uma conta em [resend.com](https://resend.com) → API Keys

### 3. Rodar migrations no Supabase

No **SQL Editor** do Supabase, execute em ordem:

1. `supabase/migrations/001_initial_schema.sql` — schema, RLS, triggers, storage buckets
2. `supabase/migrations/002_seed.sql` — bootstrap (cria colunas Kanban se houver admin)

### 4. Criar o primeiro admin

1. Rode `npm run dev` e acesse [http://localhost:3000/pt/signup](http://localhost:3000/pt/signup)
2. Crie a conta com o email que será o admin
3. No **Supabase SQL Editor**, promova o usuário:
   ```sql
   UPDATE profiles SET role = 'admin', full_name = 'Seu Nome' WHERE id = 'UUID-DO-USUARIO';
   ```
   (pegue o UUID em Authentication → Users)
4. (Opcional) Rode o `002_seed.sql` de novo para criar colunas Kanban e dados de exemplo

### 5. Configurar auth callback

No Supabase: **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/api/auth/callback` + URL de produção

### 6. Pronto!

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e faça login.

---

## 📁 Estrutura

```
src/
├── app/
│   ├── [locale]/            # Rotas internacionalizadas (PT/EN)
│   │   ├── admin/           # Painel da agência
│   │   ├── collaborator/    # Painel da equipe
│   │   ├── client/          # Painel do cliente
│   │   ├── login/           # Login
│   │   └── signup/          # Cadastro
│   ├── actions/             # Server Actions (mutations)
│   └── api/                 # API Routes (webhooks, callbacks)
├── components/
│   ├── admin/               # UI admin
│   ├── collaborator/        # UI colaborador
│   ├── client/              # UI cliente
│   ├── layout/              # Sidebar, Navbar
│   └── ui/                  # Componentes base (Button, Modal, etc)
├── lib/
│   ├── supabase/            # Clientes Supabase (browser/server)
│   └── email/               # Templates de email
├── contexts/                # React Contexts (auth)
├── i18n/                    # Configuração next-intl
└── messages/                # Traduções PT/EN

supabase/
├── migrations/              # SQL (schema + seed)
└── functions/               # Edge Functions
```

---

## 🌍 Deploy (Vercel - Free Tier)

1. Suba o código pro GitHub
2. Importe em [vercel.com](https://vercel.com)
3. Configure as variáveis de ambiente (mesmas do `.env.local`)
4. Atualize o `NEXT_PUBLIC_APP_URL` e a Site URL do Supabase para o domínio de produção
5. Configure o domínio customizado no Resend (opcional, mas recomendado)

---

## 🛠️ Scripts

```bash
npm run dev    # Servidor de desenvolvimento
npm run build  # Build de produção
npm run start  # Rodar build
npm run lint   # ESLint
```

---

## 📧 Configurar Email (Resend)

### Modo MVP (sem domínio próprio)
Use o email padrão do Resend:
```env
RESEND_FROM_EMAIL=onboarding@resend.dev
```

### Modo Produção (com domínio)
1. Adicione seu domínio em [resend.com/domains](https://resend.com/domains)
2. Configure os registros DNS (SPF, DKIM, DMARC)
3. Atualize `.env.local`:
   ```env
   RESEND_FROM_EMAIL=noreply@boundmarketing.com.br
   ```

---

## 🔐 Segurança

- **Service role key** NUNCA deve aparecer em código client-side. Use apenas em Server Actions.
- **RLS** está ativo em todas as tabelas — usuários só veem o que devem.
- **Auth callback** é o único endpoint público de auth — mantenha em `src/app/api/auth/callback/`.

---

## 📝 Licença

Privado. © Bound Marketing.
