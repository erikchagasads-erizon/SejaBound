# Auditoria de Segurança — Bound Marketing Portal

**Data:** 2026-09-04
**Escopo:** service role key, RLS, RLS bypass, secrets em código, auth flow, route handlers
**Status:** 2 críticos corrigidos · 1 crítico exige ação manual · 4 melhorias aplicadas

---

## 🔴 CRÍTICO — Requer ação manual URGENTE

### C-1: Service role key real exposta em `.env.local`

A service role key do projeto Supabase `qjcbozupwayhlrmkmwph` está
versionada em `.env/local` no projeto:

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...WlioGzWd9fuCMj3aU1gK4eYSA-k8Kka9uJp6MrLhmbA
```

**Esta chave tem poder total sobre o banco** (bypassa TODAS as RLS policies,
acesso a todos os buckets, leitura/escrita em todas as linhas). Qualquer
pessoa com acesso a este arquivo pode ler/modificar todos os dados
de todos os clientes.

**Ação obrigatória:**

1. **Rotacione a chave AGORA** no painel do Supabase:
   `https://app.supabase.com/project/qjcbozupwayhlrmkmwph/settings/api`
   → clique em **"Roll"** em `service_role` → copie a nova chave.
2. **Atualize `.env.local`** com a nova chave.
3. **Atualize `.env.example`** se for compartilhar com novos devs (já é seguro,
   contém placeholder).
4. **Verifique histórico git**: se este projeto foi commitado em algum
   repositório (mesmo deletado), a chave antiga pode estar em cache do GitHub.
   Nesse caso, **rotacione novamente** após a primeira rotação.

> ℹ️  O `.gitignore` da raiz lista `.env*` (linha 34), portanto a chave
> **não é rastreada por este repositório**. Mas o arquivo em disco
> continua acessível a qualquer processo que leia o filesystem.

---

## 🔴 CRÍTICO — Já corrigido nesta sessão

### C-2: Bypass de auth em `/api/notifications/*` quando secret ausente

**Arquivos:** `src/app/api/notifications/briefing/route.ts`, `src/app/api/notifications/delivery/route.ts`

**Antes:**
```ts
if (secret && authHeader !== `Bearer ${secret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

Se `NOTIFICATION_WEBHOOK_SECRET` fosse `undefined`, a checagem virava
`if (undefined && ...)` → `if (false)` → **endpoint público**, permitindo
que qualquer pessoa com a URL disparasse emails a admins ou soubesse
configurações internas (admin emails, briefings, etc.).

**Depois:**
- Secret **obrigatório** — se ausente, retorna 503 (`Server misconfigured`).
- Comparação **constant-time** via `crypto.timingSafeEqual` para evitar
  timing attacks.
- Logs de erro explícitos quando mal configurado.

### C-3: Webhook fetch interno sem Authorization header

**Arquivos:** `src/app/actions/deliveries.ts`, `src/app/actions/briefings.ts`

**Antes:** O `fetch()` server-to-server para `/api/notifications/*` não
incluía o header `Authorization`. Combinado com C-2, se o secret
fosse configurado, **todas as notificações falhariam** (401) — bug
funcional grave.

**Depois:** Header `Authorization: Bearer <secret>` enviado em todos os
fetches. Se o secret estiver ausente, o fetch é pulado com `console.warn`
em vez de falhar silenciosamente.

---

## 🟠 ALTO — Corrigido

### H-1: `createAdminClient()` recriado a cada log de email

**Arquivo:** `src/lib/email/client.ts`

`logEmailNotification()` chamava `createAdminClient()` em cada invocação.
Cada chamada abre nova conexão + valida env. Em pico de envios,
isso degrada o pool de conexões do Supabase.

**Depois:** Singleton lazy — cliente admin é criado uma vez e reusado.

### H-2: Falta de documentação do `NOTIFICATION_WEBHOOK_SECRET`

**Arquivo:** `.env.example`

A variável não estava documentada, e devs não sabiam que era obrigatória.

**Depois:** Bloco explicativo adicionado com comando de geração
(`openssl rand -hex 32`).

---

## 🟡 MÉDIO — RLS review

A auditoria de RLS policies em `supabase/migrations/001_initial_schema.sql`
**não encontrou furos óbvios**. As policies seguem o padrão correto:

| Tabela             | admin | collaborator | client | self |
|--------------------|:-----:|:------------:|:------:|:----:|
| profiles           |  ALL  |   —          |  —     | R/U  |
| clients            |  ALL  |   R (assigned) | R (own) | — |
| client_users       |  ALL  |   —          |  —     | R    |
| collaborator_clients| ALL  |  —           |  —     | R    |
| kanban_columns     |  ALL  |   R          |  R     | —    |
| tasks              |  ALL  |   C/R/U/D (assigned) | R (own) | — |
| task_activity      |  ALL  |   R/I (assigned) | R (own) | — |
| deliveries         |  ALL  |   C/R/U/D (assigned) | R/U (own) | — |
| delivery_files     |  ALL  |   C/R/U/D (assigned) | R (own) | — |
| briefings          |  ALL  |   R (assigned) | C/R/U/D (own) | — |
| reports            |  ALL  |   R (assigned) | R (own) | — |
| email_notifications|  ALL  |   —          |  —     | R    |

Helpers `get_my_role()` e `is_admin()` estão com `SECURITY DEFINER STABLE`
(padrão correto).

**Pontos a observar (não corrigidos):**
- `client_users` permite que admin insira qualquer (client_id, profile_id).
  OK, é a operação de admin.
- `collaborator_clients` segue o mesmo padrão. OK.
- **Nenhuma policy impede que o próprio admin remova seu próprio role.**
  Em caso de admin único, isso pode bloquear todos. Mitigação: manter
  sempre ≥2 admins.

---

## 🟢 BAIXO — Notas

- `client_logos` e `avatars` buckets são públicos para leitura (intencional).
- `client_users: self read` permite só SELECT, não UPDATE — usuário não
  pode trocar de cliente (correto).
- `delivery-files` permite upload por qualquer `collaborator` (não checa
  `collaborator_clients` no INSERT) — confiar em RLS da tabela filha
  `deliveries` é suficiente. ✅

---

## ✅ Checklist pós-correção

- [x] `.env.example` documenta `NOTIFICATION_WEBHOOK_SECRET` (obrigatório)
- [x] `/api/notifications/*` exigem secret constant-time
- [x] Server actions de notificação enviam `Authorization: Bearer`
- [x] Singleton de admin client em `lib/email/client.ts`
- [ ] **Rotação da service role key** (ação manual)
- [ ] **Configurar `NOTIFICATION_WEBHOOK_SECRET`** em produção
      (Vercel/env do host)
- [ ] Audit final pós-deploy (verificar logs por 24h)
