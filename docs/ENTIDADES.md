# Entidades e modelo de dados (Prisma)

Fonte de verdade: `prisma/schema.prisma`. Todas as tabelas abaixo usam `createdAt` / `updatedAt`; a maioria inclui `deletedAt` para soft delete.

## Enum `Roles`

| Valor | Descrição (domínio Weliv) |
|-------|---------------------------|
| `SYSTEM_ADMIN` | Administrador global da plataforma |
| `ADMIN` | Administrador ao nível da empresa (`companyId`) |
| `PATIENT` | Paciente / utilizador final |
| `PROFESSIONAL` | Profissional de saúde ligado a uma empresa |

## Enum `UserStatus`

`ACTIVE`, `INACTIVE`, `PENDING`, `BLOCKED` — predefinição no modelo `User`: `PENDING`.

## Enums de ficheiros e documentos

- **`FileType`:** `PROFILE_IMAGE`, `DOCUMENT`, `REPORT`, `VIDEO`, `AUDIO`, `OTHER`
- **`DocumentRecipientType`:** `HR`, `SUPERVISOR`, `ADMIN`
- **`DocumentStatus`:** `PENDING`, `VIEWED`, `DOWNLOADED`

## Enums de notificações

- **`NotificationGroupType`:** `ROLE`, `SECTOR`, `CUSTOM`
- **`NotificationTargetType`:** `USER`, `ROLE`, `GROUP`, `COMPANY`, `CUSTOM`

---

## Modelo `Company`

Representa o **tenant** (organização).

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | UUID | PK |
| `name` | String | |
| Relações | | `users`, `documents`, `files`, `notifications`, `notificationGroups` |
| `deletedAt` | DateTime? | Soft delete |

---

## Modelo `User`

Utilizador autenticável; `login` e `email` e `cpf` únicos.

| Campo | Tipo | Notas |
|-------|------|--------|
| `role` | `Roles` | Discrimina permissões CASL e UI no frontend |
| `status` | `UserStatus` | Fluxo de ativação |
| `companyId` | String? | Opcional (ex.: paciente sem empresa no seed) |
| Relações | | Documentos enviados, ficheiros, push, grupos de notificação, recipients |

---

## Modelo `File`

Metadados de ficheiro armazenado (integração MinIO na aplicação).

| Campo | Tipo | Notas |
|-------|------|--------|
| `id` | Cuid | PK |
| `fileName`, `url` | String | Ambos com `@unique` no Prisma |
| `type` | `FileType` | |
| `companyId`, `uploadedBy` | Opcional | Ligação ao tenant e ao utilizador |

---

## Modelo `Document`

Documento associado a um `File`, remetente (`userId`) e opcionalmente `companyId`.

| Campo | Tipo | Notas |
|-------|------|--------|
| `recipientType` | `DocumentRecipientType` | |
| `status` | `DocumentStatus` | Predefinição `PENDING` |
| `fileId` | String | 1:1 com `File` |

---

## Modelo `Notification`

Mensagem com `title`, `message`, e referência opcional a entidade (`entityType`, `entityId`).

- Relações: `recipients` (`NotificationRecipient`), `targets` (`NotificationTarget`).

## Modelo `NotificationRecipient`

Ligação utilizador ↔ notificação com `isRead` / `readAt`. Restrição única `(notificationId, userId)`.

## Modelo `NotificationGroup`

Grupo por empresa com `type`, `roleFilter`, `sectorFilter`, membros e alvos.

## Modelo `NotificationGroupMember`

Membro de grupo; único `(groupId, userId)`.

## Modelo `NotificationTarget`

Alvo de envio (`NotificationTargetType`) com campos opcionais `userId`, `roleId` (`Roles`), `groupId`.

## Modelo `PushSubscription`

Dados Web Push (`endpoint` único, `p256dh`, `auth`) por `userId`.

---

## Nota sobre CASL vs schema

O serviço `CaslAbilityService` referencia recursos como `Appointment` e `Client` nas regras de ability, mas **estes modelos não existem no `schema.prisma` atual**. As permissões efetivas sobre esses sujeitos dependem de alinhamento futuro do schema ou de ajuste das regras CASL. Os modelos **presentes** no schema (`User`, `Company`, `File`, `Document`, `Notification`, …) são os únicos persistidos na base de dados neste momento.
