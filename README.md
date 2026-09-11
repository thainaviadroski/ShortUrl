# Plano de Implementação: Encurtador de Links e Gerador de QR Codes

## 1. Visão Geral da Arquitetura

Sistema interno focado em marketing e publicidade para geração de links curtos, QR Codes dinâmicos e captura de métricas detalhadas.

* **Frontend & Backend:** Next.js (App Router)
* **Banco de Dados (Escrita e Analytics):** PostgreSQL
* **Cache e Redirecionamento Rápido:** Redis
* **ORM:** Drizzle ORM
* **Infraestrutura Local:** Docker Compose

---

## 2. Modelagem de Dados

### Entidade: `ShortLink` (Tabela de Links)

Armazena a relação entre o link encurtado, o destino e as regras de negócio.

* **`id`**: Integer / UUID (Chave Primária).
* **`linkOriginal`**: String (URL de destino).
* **`linkShort`**: String (O código gerado, de 4 a 10 caracteres. **Deve possuir índice `UNIQUE**`).
* **`maxTimeValid`**: DateTime (Opcional - data de expiração da campanha).
* **`description`**: String (Identificação para o marketing, ex: "Outdoor Centro").
* **`created`**: DateTime (Padrão: `now()`).
* **`createdBy`**: String (Usuário criador).
* **`isActive`**: Boolean (Padrão: `true`. Permite desligar o link manualmente).
* **`qrCodeUrl`**: String (Opcional. Caminho do arquivo da imagem gerada).

### Entidade: `LinkDetails` (Tabela de Métricas)

Armazena os eventos de clique para geração de relatórios de campanha.

* **`id`**: BigInt (Chave Primária).
* **`shortLinkId`**: Integer / UUID (Chave Estrangeira -> `ShortLink.id`).
* **`device`**: String (Ex: Mobile, Desktop).
* **`browser`**: String (Ex: Chrome, Safari).
* **`origin`**: String (Referrer - de onde o usuário veio).
* **`timestamp`**: DateTime (Data/hora do clique, Padrão: `now()`).
* **`country`**: String (País derivado do IP).
* **`city`**: String (Cidade derivada do IP).

---

## 3. Estratégia de Geração de Links (4 a 10 caracteres)

A aplicação utilizará uma abordagem híbrida, permitindo flexibilidade para a equipe de publicidade.

* **Opção 1: Link Personalizado (Vanity URL)**
* O usuário escolhe o nome (ex: `promocao`).
* **Regras:** Validação via Regex (sem espaços ou caracteres especiais), limite de 4 a 10 caracteres.
* **Normalização:** Salvar e buscar sempre em letras minúsculas (`toLowerCase()`) para evitar erros de digitação por parte do cliente final.


* **Opção 2: Geração Aleatória (Fallback)**
* Se o usuário não preencher o link personalizado, o sistema gera um código aleatório.
* **Ferramenta:** Biblioteca `nanoid` com alfabeto customizado (removendo caracteres ambíguos como `0`, `O`, `1`, `l`).


* **Tratamento de Colisões (Race Conditions):** O backend deve capturar o erro de restrição única (`UNIQUE constraint violation`) do banco de dados. Se for link personalizado, avisa o usuário. Se for NanoID, o backend gera um novo código automaticamente e tenta salvar novamente.
* **Blacklist de Rotas:** Bloquear a criação de links que conflitem com a aplicação (ex: `admin`, `api`, `login`, `_next`).

---

## 4. Fases de Implementação

### Fase 1: Setup e Infraestrutura

1. Inicializar o projeto com `npx create-next-app@latest` configurando o App Router e TypeScript.
2. Criar o arquivo `docker-compose.yml` contendo os serviços do PostgreSQL e Redis.
3. Instalar o ORM escolhido, configurar a string de conexão e testar a comunicação entre a aplicação Next.js e os containers Docker.

### Fase 2: Banco de Dados e ORM

1. Criar o *schema* do ORM com as entidades `ShortLink` e `LinkDetails`.
2. Garantir a criação da constraint `UNIQUE` na coluna `linkShort`.
3. Rodar as *migrations* para gerar as tabelas no PostgreSQL.

### Fase 3: Painel Administrativo (Criação)

1. Construir as rotas protegidas no Next.js (ex: `/admin/links/new`).
2. Criar o formulário de entrada com campos para URL Original, Descrição, Validade e Link Personalizado (opcional).
3. **Processamento no Servidor (Server Actions/API Routes):**
* Validar os dados e gerar o código via NanoID (caso o personalizado esteja vazio).
* Salvar os dados no PostgreSQL.
* Gerar o QR Code com a biblioteca `qrcode` (Node.js), salvar o arquivo (storage local ou S3) e atualizar o campo `qrCodeUrl` no banco.
* Fazer o *Preload* no Redis: Salvar a chave `link:[linkShort]` com os dados necessários de validação (URL original, status ativo, expiração).



### Fase 4: Motor de Redirecionamento (Leitura)

1. Criar a rota dinâmica de captura (ex: `app/[code]/route.ts`).
2. Receber o `code`, aplicar `toLowerCase()` se houver lógica de normalização, e buscar no Redis (`GET link:[code]`).
* Se ocorrer *Cache Miss* (não achou no Redis), buscar no Postgres e popular o Redis novamente.


3. Validar as regras de negócio: verificar a coluna `isActive` e comparar `maxTimeValid` com a data atual.
4. Se inválido, retornar HTTP 404 ou redirecionar para fallback. Se válido, responder imediatamente com HTTP 302 para a `linkOriginal`.

### Fase 5: Analytics Assíncrono (Gravação)

1. Imediatamente antes ou após o comando de redirecionamento na Fase 4 (sem bloquear a resposta usando mecanismos como `waitUntil` do Next.js), coletar os headers: `User-Agent`, `Referer` e o IP (`x-forwarded-for`).
2. Processar os dados brutos: usar `ua-parser-js` para extrair Browser/Device e uma base GeoIP para extrair País/Cidade.
3. Inserir o registro final na tabela `LinkDetails` no PostgreSQL.

### Fase 6: Dashboards de Relatórios

1. Criar a interface visual para o marketing dentro do painel administrativo.
2. Construir consultas SQL complexas/agrupamentos via ORM (ex: contar cliques totais, agrupar por dispositivo, agrupar por campanha/descrição).
3. Exibir os dados de performance de cada link curto e seu respectivo QR Code.

---

## 5. Infraestrutura Local (Docker Compose)

O arquivo `docker-compose.yml` sobe todos os serviços necessários para desenvolver a aplicação localmente:

* **`app`**: build da aplicação Next.js (`Dockerfile` multi-stage), porta `3000`. Depende do `postgres` e do `redis` estarem saudáveis (`healthcheck`).
* **`postgres`**: banco de dados principal (`postgres:16-alpine`), porta `5432`, com volume persistente `postgres-data`. Credenciais e nome do banco configuráveis via `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).
* **`pgadmin`**: UI de administração do Postgres, disponível em `http://localhost:8081`.
* **`redis`**: cache/store para o motor de redirecionamento (`redis:7-alpine`), porta `6379`, com volume persistente `redis-data`.
* **`redis-commander`**: UI de administração do Redis, disponível em `http://localhost:8082`.

Todos os serviços compartilham a rede `short-url-net`, e a `DATABASE_URL`/`REDIS_URL` da aplicação são montadas automaticamente a partir das variáveis do Postgres/Redis — não é necessário repeti-las manualmente.

### Como rodar

```bash
# copiar variáveis de ambiente
cp .env.example .env

# subir todos os serviços (build da app + postgres + redis + UIs de admin)
docker compose up -d --build

# rodar as migrations do ORM dentro do container da app (Drizzle)
docker compose exec app npx drizzle-kit migrate

# acompanhar logs
docker compose logs -f app

# derrubar os serviços (mantendo os volumes/dados)
docker compose down
```

> Observação: o `Dockerfile` gera um build "standalone" do Next.js — garanta `output: 'standalone'` no `next.config.js` ao inicializar o projeto (Fase 1) para que a imagem final funcione corretamente.