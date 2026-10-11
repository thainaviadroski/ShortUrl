# Deploy na Railway (plano Free)

Guia passo a passo para publicar o Short URL na Railway usando apenas os recursos do plano Free e o domínio gratuito `*.up.railway.app`.

## Visão geral

O projeto roda em **3 serviços** dentro de um único projeto da Railway, conversando pela rede privada (`*.railway.internal`, sem custo de egress):

| Serviço | Origem | Volume | Função |
|---|---|---|---|
| `ShortUrl` (app) | Repositório GitHub, build pelo `Dockerfile` | — | Next.js (standalone) + migrations no start |
| `Postgres` | Template de banco da Railway | ✅ (o único do projeto) | Usuários, links e cliques |
| `Redis` | Imagem Docker `redis:7-alpine` | ❌ | Cache de links/cliques e bloqueio de login |

```
Internet ──https──▶ ShortUrl (porta 3000)
                      ├──▶ postgres.railway.internal:5432
                      └──▶ redis.railway.internal:6379
```

> **Por que o Redis não usa o template da Railway?** O plano Free permite **1 volume por projeto**, e ele fica com o Postgres. O template de Redis cria um volume próprio. Como o Redis aqui só guarda cache e contadores temporários, ele pode rodar sem persistência.

### O que o código já resolve

- **Build standalone** (`output: 'standalone'` em `next.config.ts`): a imagem final fica pequena.
- **Migrations automáticas**: o `CMD` do `Dockerfile` roda `node migrate.mjs` antes de subir o servidor. Se a migration falhar, o container não sobe, e o deploy anterior continua no ar.
- **URL pública**: `src/lib/base-url.ts` usa `BASE_URL` e, se ela não existir, `RAILWAY_PUBLIC_DOMAIN`. Os links curtos e os QR codes saem com o domínio certo sem configuração extra.
- **Rede privada IPv6**: `src/lib/redis.ts` usa `family: 0`, necessário para resolver `redis.railway.internal`.
- **QR codes**: são gerados sob demanda, sem gravar arquivos no disco, que é apagado a cada deploy.
- **GeoIP**: a base do `geoip-lite` é incluída no build. Na Railway, país e cidade vêm do IP no `x-forwarded-for`.

---

## Pré-requisitos

- Conta na Railway (plano Free) com o GitHub conectado.
- Repositório `thainaviadroski/ShortUrl` com a branch `main` atualizada.
- **Node.js** local, para gerar o segredo e o hash da senha do primeiro usuário.
- **Docker** local (opcional), para usar o `psql` do container `short-url-postgres` contra o banco da Railway.

---

## Passo 1: Criar o projeto e o serviço da app

1. Na Railway: **New Project → Deploy from GitHub repo → `thainaviadroski/ShortUrl`**.
2. Branch: `main`. A Railway detecta o `Dockerfile` na raiz e usa esse arquivo no build.
3. O primeiro deploy vai **falhar**, porque ainda não existem `DATABASE_URL` e as outras variáveis. Isso é esperado e se resolve nos próximos passos.

## Passo 2: Adicionar o Postgres

1. No projeto: **+ New → Database → Add PostgreSQL**.
2. Mantenha o nome do serviço como **`Postgres`**. As referências `${{Postgres.*}}` dependem desse nome.
3. Esse serviço cria o único volume do projeto e expõe, entre outras, as variáveis `DATABASE_URL` (rede privada) e `DATABASE_PUBLIC_URL` (acesso externo pelo proxy TCP).

## Passo 3: Adicionar o Redis (sem volume)

1. **+ New → Docker Image → `redis:7-alpine`**.
2. Renomeie o serviço para **`Redis`**.
3. Em **Variables**, crie:

   | Variável | Valor |
   |---|---|
   | `REDIS_PASSWORD` | `${{secret(32)}}` |

4. Em **Settings → Deploy → Custom Start Command**:

   ```sh
   /bin/sh -c "exec redis-server --requirepass $REDIS_PASSWORD --save '' --appendonly no"
   ```

5. **Não** adicione volume e **não** gere domínio público. O Redis só é acessado pela rede privada.

## Passo 4: Variáveis do serviço `ShortUrl`

Em **ShortUrl → Variables**, crie:

| Variável | Valor | Observação |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Rede privada |
| `REDIS_URL` | `redis://default:${{Redis.REDIS_PASSWORD}}@${{Redis.RAILWAY_PRIVATE_DOMAIN}}:6379` | Rede privada |
| `AUTH_SECRET` | *(gere com o comando abaixo)* | Assina as sessões (JWT) |
| `PORT` | `3000` | Fixa a porta que o domínio vai usar |
| `NODE_OPTIONS` | `--max-old-space-size=384` | Mantém o Node abaixo do limite de 0,5 GB de RAM |

Para gerar o `AUTH_SECRET` (funciona no PowerShell e no Git Bash):

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### ⚠️ Variáveis que **não** devem ser definidas na Railway

| Variável | Motivo |
|---|---|
| `NEXTAUTH_URL` / `AUTH_URL` | O next-auth troca a URL da requisição por esse valor. Um valor sem `https://` derruba **todas** as rotas com `500 Invalid URL`, e `localhost` faz o login redirecionar para a sua máquina. O `trustHost: true` em `src/auth.ts` já resolve a URL sozinho. |
| `BASE_URL` | Desnecessária com o domínio gratuito, porque o código usa `RAILWAY_PUBLIC_DOMAIN`. Se for definida, **precisa** incluir `https://`. |
| `POSTGRES_*`, `PGADMIN_*` | Só são usadas pelo `docker-compose.yml` local. |

> Não copie o `.env` local para a Railway. Ele contém valores de desenvolvimento e senhas locais.

## Passo 5: Configurações do serviço `ShortUrl`

Em **ShortUrl → Settings**:

- [ ] **Networking → Generate Domain**, porta **3000**. Isso gera algo como `shorturl-production-xxxx.up.railway.app`.
- [ ] **Deploy → Healthcheck Path**: `/login`. É uma página pública que responde `200`. Não use `/api`, que redireciona (`307`) para o login.
- [ ] **Deploy → Restart Policy**: `On Failure`.
- [ ] **Serverless**: **desligado**. As conexões abertas com Postgres e Redis impedem a app de dormir, e quando ela dorme o primeiro acesso pode receber `502`.
- [ ] **Região**: a mesma nos 3 serviços.

Depois de gerar o domínio, clique em **Deploy** (ou faça um redeploy) para que `RAILWAY_PUBLIC_DOMAIN` passe a existir no container.

## Passo 6: Primeiro deploy e logs esperados

Em **ShortUrl → Deployments → View logs**, a sequência deve ser:

```
Applying migrations to postgres.railway.internal:5432/railway
Database migrations applied.
▲ Next.js ...
✓ Ready in ...
```

- Se aparecer `localhost` no lugar de `postgres.railway.internal`, o `DATABASE_URL` não está referenciando o Postgres. Volte ao Passo 4.
- As migrations em `drizzle/` criam todas as tabelas, incluindo a coluna `created_by` (dono do link).

## Passo 7: Criar o primeiro usuário

A tela de login não tem cadastro, e `POST /api/user` exige estar logado. O primeiro usuário entra direto no banco.

**7.1 Gerar o hash da senha** (mesmo formato de `src/lib/password.ts`, `salt:hash` com scrypt):

```sh
node -e "const c=require('crypto');const s=c.randomBytes(16).toString('hex');console.log(s+':'+c.scryptSync(process.argv[1],s,64).toString('hex'))" 'SuaSenhaForte@123'
```

**7.2 Inserir o usuário.** Copie o `DATABASE_PUBLIC_URL` em **Postgres → Variables** e use o `psql` do container local (rode no PowerShell; no Git Bash, o `-it` precisa de `winpty` na frente):

```sh
docker exec -it short-url-postgres psql "<DATABASE_PUBLIC_URL>"
```

```sql
INSERT INTO users (name, email, password_hash)
VALUES ('Admin', 'seu-email@exemplo.com', '<hash gerado no 7.1>');
```

Se preferir não usar o terminal, a aba **Data** do serviço Postgres na Railway permite adicionar a linha na tabela `users` pela interface. Preencha `name`, `email` e `password_hash`.

**7.3 Demais usuários.** Depois de logado, crie outros usuários pela API (`POST /api/user`, documentada em `/api-doc`).

> 🚫 **Nunca rode `npm run db:seed` apontando para o banco da Railway.** O seed **apaga todas as tabelas**, e a proteção dele só olha o `NODE_ENV` da sua máquina. Também não use `db:push` nem `db:migrate` contra produção: as migrations já rodam no start do container.

## Passo 8: Validação

Acesse `https://<seu-dominio>.up.railway.app` e confira:

- [ ] O login funciona e o redirecionamento continua no domínio `up.railway.app`.
- [ ] Criar um link em **Links → New link** e ele aparece na lista.
- [ ] Abrir `https://<dominio>/<codigo>` em uma aba anônima redireciona para o destino.
- [ ] `/qrcodes/<codigo>.png` mostra um QR que aponta para o domínio da Railway.
- [ ] O clique aparece no detalhe do link e em **Analytics**, com país e cidade.
- [ ] Um segundo usuário **não** vê os links do primeiro (cada usuário só vê os links que criou).
- [ ] Depois de 5 senhas erradas, o login do e-mail fica bloqueado por até 15 minutos, mesmo com a senha certa (isso confirma que o Redis está conectado).
- [ ] `/api-doc` lista os endpoints.

---

## Operação no dia a dia

### Deploy contínuo

Cada push na `main` gera um novo deploy automaticamente. Se o novo container falhar (migration ou healthcheck), a Railway mantém o deploy anterior no ar.

### Mudanças no banco

1. Altere o schema em `src/db/schema/`.
2. Rode `npm run db:generate` localmente.
3. Revise o SQL gerado em `drizzle/`. Se adicionar uma coluna `NOT NULL` em tabela com dados, preencha os valores antes do `SET NOT NULL` (veja `drizzle/0002_link_owner.sql`).
4. Faça commit da pasta `drizzle/` (SQL + `meta/`). A migration roda no próximo start.

### Rollback

**Deployments → deploy anterior → Redeploy.** As migrations **não** são desfeitas. Mantenha as mudanças de schema compatíveis com a versão anterior do código.

### Backup manual

```sh
docker exec short-url-postgres pg_dump "<DATABASE_PUBLIC_URL>" > backup.sql
```

### Logs

**ShortUrl → Deployments → View logs** mostra os logs de build, das migrations e da app. Postgres e Redis têm a mesma aba nos próprios serviços.

---

## Solução de problemas

| Sintoma | Causa provável | Correção |
|---|---|---|
| Todas as páginas respondem `500` com `TypeError: Invalid URL` | `NEXTAUTH_URL`/`AUTH_URL` (ou `BASE_URL`) sem `https://` | Remova `NEXTAUTH_URL`/`AUTH_URL`. Em `BASE_URL`, use `https://...` ou remova. |
| Login redireciona para `localhost` | `NEXTAUTH_URL=http://localhost:3000` copiado do `.env` | Remova a variável |
| Erro `MissingSecret` no log | `AUTH_SECRET` ausente | Crie a variável (Passo 4) |
| `Applying migrations to localhost` ou `ECONNREFUSED 127.0.0.1:5432` | `DATABASE_URL` ausente ou errado | Use `${{Postgres.DATABASE_URL}}` |
| `ENOTFOUND redis.railway.internal` / `NOAUTH` / `WRONGPASS` | Serviço não se chama `Redis`, ou senha diferente | Confira o nome do serviço e o `REDIS_URL` |
| Migration falha com `column "created_by" ... contains null values` | Já existem links, mas nenhum usuário (a migration atribui os links ao usuário de menor id) | Crie um usuário (Passo 7) e faça redeploy |
| Links curtos e QR codes com `localhost` | Domínio gerado sem redeploy | Faça redeploy do `ShortUrl` |
| Healthcheck falha | Porta diferente de 3000, ou path errado | `PORT=3000`, domínio na porta 3000, healthcheck em `/login` |
| Container reinicia sozinho (OOM) | Memória acima de 0,5 GB | Confira `NODE_OPTIONS=--max-old-space-size=384` |
| Login sempre falha mesmo com a senha certa | Hash inserido com quebra de linha ou espaços | Gere de novo (7.1) e faça `UPDATE users SET password_hash = '...' WHERE email = '...'` |

---

## Ambiente local (`.env`)

Para rodar localmente, o `.env` deve apontar para a sua máquina, não para a Railway:

```env
DATABASE_URL=postgresql://<usuario>:<senha>@localhost:5432/<banco>
REDIS_URL=redis://localhost:6379
AUTH_SECRET=<um segredo local qualquer>
# Deixe NEXTAUTH_URL e BASE_URL de fora, ou use http://localhost:3000
```
