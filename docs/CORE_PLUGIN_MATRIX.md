# Core vs Plugin Matrix

Este documento define o que fica ativo por padrão no template base e o que deve ser tratado como plugin opcional.

## Core (default)

Módulos e áreas que devem permanecer no bootstrap padrão:

- `src/shared/prisma`
- `src/shared/auth`
- `src/shared/common/logger`
- `src/shared/common/messages`
- `src/shared/casl`
- `src/shared/universal`
- `src/shared/tenant`
- `src/shared/files`
- `src/modules/users`
- `src/modules/companies`

## Plugin (opcional)

Módulos que não entram no `AppModule` base e devem ser habilitados por contexto de projeto:

- `src/shared/asaas`
- `src/shared/geocoding`
- `src/modules/infrastructure/notifications`
- `src/modules/pets`
- `src/modules/vaccine-exams`
- `src/modules/compliance/reminders`
- `src/modules/weight-records`
- `src/modules/shared-tutors`
- `src/modules/social/social-posts`
- `src/modules/social/post-comments`
- `src/modules/social/post-likes`
- `src/modules/social/follows`
- `src/modules/pet-friend-requests`
- `src/modules/pet-friendships`
- `src/modules/marketplace/service-providers`
- `src/modules/marketplace/services`
- `src/modules/marketplace/reviews`
- `src/modules/marketplace/favorites`
- `src/modules/agenda-comercial/bookings`
- `src/modules/agenda-comercial/payments`
- `src/modules/agenda-comercial/payouts`
- `src/modules/agenda-comercial/coupons`
- `src/modules/agenda-comercial/availabilities`
- `src/modules/agenda-comercial/availability-exceptions`
- `src/modules/agenda-comercial/opening-hours`
- `src/modules/agenda-comercial/provider-settings`
- `src/modules/compliance/kyc-documents`
- `src/modules/infrastructure/dashboard`
- `src/modules/infrastructure/webhooks`
- `src/modules/infrastructure/webhook-logs`
- `src/modules/infrastructure/tickets`
- `src/modules/infrastructure/ticket-replies`
- `src/modules/infrastructure/incidents`
- `src/modules/infrastructure/incident-updates`

### Ativação no AppModule

`NotificationModule` deve permanecer no `AppModule` nos projetos que usam os módulos com notificações (fluxo esperado do template). Geocoding e Asaas podem ser removidos do `AppModule` se o produto não usar.

## Configuração centralizada

A pasta `src/shared/config` é a fonte padrão para configurações mutáveis por projeto.

- `entities.core.config.ts`: mapeamento mínimo do core.
- `entities.config.ts`: composição de `core + plugin` para compatibilidade.
- `casl-role-permissions.core.config.ts`: permissões padrão do core.
- `casl-role-permissions.config.ts`: permissões de módulos plugin.
- `messages.core.config.ts`: mensagens mínimas de referência.
- `messages.config.ts`: ponto único de exportação para consumo no projeto.

## Regra de evolução

1. Nova feature entra primeiro como plugin.
2. Só vira core se for reutilizável em contextos amplos.
3. Core não pode depender de providers de plugin.
4. Mudanças no core devem preservar compatibilidade dos plugins existentes.
