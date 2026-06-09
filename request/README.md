# Coleções HTTP (template base)

Arquivos `.http` para a extensão **REST Client** (VS Code / Cursor), alinhados aos controllers deste repositório.

## Swagger (OpenAPI)

Com o servidor em execução: **http://localhost:3000/docs** (desenvolvimento). Em produção o UI fica desligado salvo `SWAGGER_ENABLED=true` (veja `src/config/setup-swagger.ts`).

## Uso

1. Instale a extensão **REST Client** (Huachao).
2. Abra um `.http` e clique em **Send Request** acima de cada bloco.
3. Variáveis:
   - Em cada arquivo: `@baseUrl`, `@accessToken` (preencha após login).
   - Opcional: selecione o ambiente **local** na barra da extensão para usar `http-client.env.json` (`{{baseUrl}}`, `{{adminLogin}}`, etc.).

## Arquivos

| Arquivo | Controller / rotas |
|--------|---------------------|
| `app.http` | `AppController`: `/`, `/health`, `POST /test` |
| `auth.http` | `AuthController`: `/auth/*` |
| `companies.http` | `CompaniesController` + CRUD Universal em `/companies` |
| `users.http` | `UsersController` + CRUD Universal em `/users` |
| `files.http` | `FilesController`: `/files/*` |
| `dashboard.http` | `DashboardController`: `/dashboard/stats` |
| `notifications.http` | `NotificationController`: `/notifications/*` |

## Credenciais de desenvolvimento

Use o seed ou usuário admin do seu `.env` / banco. O exemplo antigo do template usava `admin@templatelobocode.com` — ajuste conforme o seed real do projeto.

## Upload de arquivo

O `POST /files/upload` é `multipart/form-data`. O REST Client aceita multipart; se preferir, use `curl` ou o cliente HTTP do seu frontend para testes com arquivos grandes.
