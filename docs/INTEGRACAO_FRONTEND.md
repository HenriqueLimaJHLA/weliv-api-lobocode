# Integração com o frontend (`weliv-app-lobocode`)

Este documento resume a análise do **app React (Vite + TypeScript)** no monorepo e o seu alinhamento com a **Weliv API**.

## Stack do frontend

- **React** com **react-router** (`createBrowserRouter`)
- **Tailwind** e componentes **shadcn-like** em `src/app/components/ui/`
- **Context API:** `AuthProvider`, `DataProvider` (dados locais/mock para grande parte das telas)

## Estrutura de pastas (frontend)

```
weliv-app-lobocode/src/
├── main.tsx                 # Entry + RouterProvider
├── app/
│   ├── App.tsx
│   ├── routes.tsx           # Definição de todas as rotas
│   ├── config/              # api.ts, seed-logins (dev)
│   ├── contexts/            # AuthContext, DataContext
│   ├── lib/                 # auth-token (decode JWT, map de roles)
│   ├── types/               # User, Appointment, Document, etc. (modelo de UI)
│   ├── pages/               # Login, patient/*, professional/*
│   ├── components/          # Layout, UI, WelivLogo
│   ├── services/            # Ex.: medicalRecordService (lógica de domínio no cliente)
│   ├── data/                # mockData
│   └── utils/
└── admin/                   # Shell administrativo (sidebar, páginas, mocks)
```

## Rotas principais

### Área pública

- `/login` — `LoginPage`; chama `POST {API_BASE_URL}/auth/login` com JSON `{ login, password }`.

### Área paciente / profissional (`Layout`)

Todas sob `/` com `Layout` (navegação inferior no mobile, header desktop):

| Caminho | Componente |
|---------|------------|
| `/patient/dashboard` | `PatientDashboard` |
| `/patient/search` | `SearchProfessionals` |
| `/patient/book/:professionalId` | `BookAppointment` |
| `/patient/appointments` | `PatientAppointments` |
| `/patient/documents` | `PatientDocuments` |
| `/patient/notifications` | `PatientNotifications` |
| `/professional/dashboard` | `ProfessionalDashboard` |
| `/professional/schedule` | `ProfessionalSchedule` |
| `/professional/financial` | `ProfessionalFinancial` |
| `/professional/patients` | `ProfessionalPatients` |
| `/professional/medical-records` | `ProfessionalMedicalRecords` |
| `/professional/settings` | `ProfessionalSettings` |

O `Layout` escolhe itens de navegação consoante `user.role === 'professional'` ou paciente (caso contrário).

### Área administrativa

- Prefixo `/admin/*` com `AdminRouteGuard` + `AdminAppShell`
- **Guard:** exige `isAuthenticated` e `user.role === 'admin'` (mapeamento: `SYSTEM_ADMIN` e `ADMIN` da API → `admin` no cliente)
- Páginas: dashboard, operação, financeiro, utilizadores, unidades/serviços, auditoria, definições, etc.
- Grande parte dos dados é **mock** (`admin/mocks/adminData`, `admin/config/navigation`)

## Autenticação no browser

1. **Armazenamento:** `localStorage` — chaves `weliv_access_token`, `weliv_refresh_token`, `currentUser`.
2. **Login:** `fetch` para `/auth/login` sem `credentials: 'include'` (JWT só no JSON).
3. **Utilizador atual:** decodifica o JWT (`buildUserFromAccessToken`) — campos mínimos: `id` ← `sub`, `name`, `email`, `role` mapeado, `phone`/`cpf` vazios até a API enriquecer o payload.
4. **`switchRole`:** alterna para utilizadores de **mock** (`mockProfessionals`, `mockPatients`, `mockAdmins`) — útil para protótipo; não chama a API.

## Configuração da API

Ficheiro `src/app/config/api.ts`:

```ts
VITE_API_BASE_URL ?? 'http://localhost:30100'
```

Em desenvolvimento, alinhar com `PORT` do Nest (predefinição 30100).

## Modelo de tipos (UI) vs backend

Os tipos em `src/app/types/index.ts` descrevem **agendamentos, prontuários, pagamentos** com detalhes de produto. **O Prisma atual da API não inclui** tabelas `Appointment`, `Client`, etc. Ou seja:

- O frontend está **à frente** do domínio persistido na API em várias áreas.
- A API já cobre **utilizadores, empresa, ficheiros, documentos, notificações** (schema) e **auth + files** (rotas).

## Recomendações de evolução

1. **Refresh token:** implementar no `AuthContext` chamada a `POST /auth/refresh` antes da expiração do access token.
2. **Logout:** opcionalmente chamar `POST /auth/logout` com refresh token antes de limpar `localStorage`.
3. **Admin API:** substituir mocks por endpoints REST quando existirem controladores de domínio (ou instanciar `UniversalController` por entidade).
4. **Alinhar CASL e Prisma** para `PROFESSIONAL` / `PATIENT` e remover referências a sujeitos inexistentes ou adicionar modelos.

## CORS

A API permite `localhost`/`127.0.0.1` com qualquer porta em desenvolvimento, compatível com Vite em `5173`, `5174`, etc.
