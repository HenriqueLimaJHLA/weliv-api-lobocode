# 📋 ESCOPO: Users (Usuários do Sistema)

**Versão:** 1.0  
**Data:** 2026-06-08  
**Status:** RASCUNHO

---

## 1. IDENTIFICAÇÃO

| Campo | Valor |
|-------|-------|
| Domínio | `users` |
| Entidade | `User` |
| Descrição | Usuários do sistema. Cada usuário pertence a uma empresa (company). O role determina as permissões de acesso. |
| Módulo pai | `companies` |
| Dependências | `companies` (existente) |

---

## 2. ENTIDADE PRINCIPAL

### 2.1 Campos

| Campo | Tipo | Obrigatório | Padrão | Descrição | Validações |
|-------|------|-------------|--------|-----------|------------|
| id | uuid | sim | auto | ID único | - |
| name | string | sim | - | Nome completo | minLength: 2, maxLength: 100 |
| email | email | sim | - | Email (login) | único, válido |
| password | string | sim | - | Senha | hash (não exposto) |
| role | enum | sim | USER | Papel | USER, ADMIN, SYSTEM_ADMIN |
| status | enum | sim | ACTIVE | Status | ACTIVE, INACTIVE, SUSPENDED |
| profilePicture | string | não | - | URL da foto | - |
| phone | phone | não | - | Telefone | - |
| cpf | string | não | - | CPF | único, máscara |
| birthDate | date | não | - | Data de nascimento | - |
| gender | string | não | - | Gênero | - |
| nationality | string | não | - | Nacionalidade | - |
| address | string | não | - | Endereço | - |
| addressNumber | string | não | - | Número | - |
| addressComplement | string | não | - | Complemento | - |
| neighborhood | string | não | - | Bairro | - |
| city | string | não | - | Cidade | - |
| state | string | não | - | UF | - |
| zipCode | string | não | - | CEP | - |
| country | string | não | Brasil | País | - |
| jobTitle | string | não | - | Cargo | - |
| department | string | não | - | Departamento | - |
| preferences | json | não | - | Preferências do usuário | - |
| notificationSettings | json | não | - | Configurações de notificação | - |
| language | string | não | pt-BR | Idioma | - |
| timezone | string | não | America/Sao_Paulo | Timezone | - |
| emailVerified | boolean | sim | false | Email verificado | - |
| phoneVerified | boolean | sim | false | Telefone verificado | - |
| twoFactorEnabled | boolean | sim | false | 2FA habilitado | - |
| twoFactorSecret | string | não | - | Segredo 2FA | - |
| lastLoginAt | datetime | não | - | Último login | - |
| loginAttempts | int | sim | 0 | Tentativas de login | - |
| lockedUntil | datetime | não | - | Bloqueado até | - |
| companyId | uuid | não | - | Empresa | null = super admin |
| createdAt | datetime | sim | auto | Criação | - |
| updatedAt | datetime | sim | auto | Atualização | - |
| deletedAt | datetime | não | - | Exclusão | soft delete |

### 2.2 Enum(s)

```typescript
// Papel do Usuário
enum Roles {
  USER = 'USER',           // Usuário comum
  ADMIN = 'ADMIN',        // Administrador da empresa
  SYSTEM_ADMIN = 'SYSTEM_ADMIN' // Super admin (acesso total)
}

// Status do Usuário
enum UserStatus {
  ACTIVE = 'ACTIVE',      // Ativo
  INACTIVE = 'INACTIVE',  // Inativo
  SUSPENDED = 'SUSPENDED' // Suspenso temporariamente
}
```

### 2.3 Relacionamentos

| Entidade | Tipo | Obrigatório | onDelete | Descrição |
|----------|------|-------------|----------|-----------|
| Company | many-to-one | não | SetNull | Empresa (null = super admin) |

---

## 3. REGRAS DE NEGÓCIO

### 3.1 Validações

| # | Regra | Descrição | Prioridade |
|---|-------|-----------|------------|
| V1 | Email único | Email deve ser único no sistema | ALTA |
| V2 | Email válido | Deve ser um email válido | ALTA |
| V3 | CPF único | Se informado, CPF deve ser único | MÉDIA |
| V4 | CPF válido | Se informado, deve ser um CPF válido | MÉDIA |
| V5 | Nome obrigatório | Nome é obrigatório | ALTA |
| V6 | Telefone formato | Se informado, deve ter formato válido | MÉDIA |

### 3.2 Restrições

| # | Regra | Descrição | Tratamento |
|---|-------|-----------|------------|
| R1 | SYSTEM_ADMIN sem empresa | SYSTEM_ADMIN não pode ter companyId | Validação |
| R2 | Login após lock | Não pode fazer login se lockedUntil > now() | Bloquear |
| R3 | Máximo tentativas | Após 5 tentativas, bloquear por 15min | Lock automático |
| R4 | ADMIN pertence a empresa | ADMIN deve ter companyId | Validação |
| R5 | Não excluir último admin | Não pode excluir último ADMIN da empresa | Bloquear |

### 3.3 Automatizações

| # | Regra | Ação | Quando |
|---|-------|------|--------|
| A1 | Lock após tentativas | Definir lockedUntil = now() + 15min | Após 5 tentativas |
| A2 | Reset tentativas | Resetar loginAttempts para 0 | Login bem-sucedido |
| A3 | lastLoginAt | Atualizar para now() | Login bem-sucedido |
| A4 | Perfil completo | Marcar emailVerified | Após verificar email |

### 3.4 Campos Calculados

| Campo | Cálculo | Exemplo |
|-------|---------|---------|
| isLocked | lockedUntil && lockedUntil > now() | true |
| isSuperAdmin | role === SYSTEM_ADMIN | true |
| fullName | name | - |

---

## 4. FLUXO DE STATUS

```
           ┌──────────┐
           │  ACTIVE  │ ← inicial
           └────┬─────┘
                │
       ┌────────┴────────┐
       │                 │
       ▼                 ▼
┌──────────┐      ┌──────────┐
│ INACTIVE │      │SUSPENDED │
└──────────┘      └──────────┘
       │                 │
       └────────┬────────┘
                │
                ▼
           ┌──────────┐
           │  ACTIVE  │ (reativação)
           └──────────┘
```

### Transições Permitidas

| De | Para | Condição | Ação Automática |
|----|------|---------|-----------------|
| ACTIVE | INACTIVE | Admin desativa | - |
| ACTIVE | SUSPENDED | Comportamento suspeito | - |
| INACTIVE | ACTIVE | Admin reativa | - |
| SUSPENDED | ACTIVE | Admin reativa | - |

---

## 5. FUNCIONALIDADES

### 5.1 CRUD

| Operação | SYSTEM_ADMIN | ADMIN | USER | Descrição |
|---------|-------------|-------|------|-----------|
| Criar | ✅ (global) | ✅ (empresa) | ❌ | Criar usuário |
| Ler | ✅ (todos) | ✅ (empresa) | ✅ (próprio) | Ver usuário |
| Atualizar | ✅ (todos) | ✅ (empresa/próprio) | ✅ (próprio) | Alterar dados |
| Excluir | ✅ (todos) | ✅ (empresa) | ❌ | Soft delete |
| Reativar | ✅ (todos) | ✅ (empresa) | ❌ | Restore |

### 5.2 Endpoints Customizados

| Endpoint | Método | Descrição | Roles |
|----------|--------|-----------|-------|
| `/by-email` | GET | Busca por email | ADMIN |
| `/by-role` | GET | Lista por role | ADMIN |
| `/by-status` | GET | Lista por status | ADMIN |
| `/stats` | GET | Estatísticas | ADMIN |
| `/me` | GET | Meus dados | USER, ADMIN |
| `/me/profile` | PATCH | Atualizar meu perfil | USER, ADMIN |
| `/me/password` | POST | Alterar minha senha | USER, ADMIN |
| `/:id/activate` | POST | Ativar usuário | ADMIN |
| `/:id/deactivate` | POST | Desativar usuário | ADMIN |
| `/:id/suspend` | POST | Suspender usuário | ADMIN |
| `/:id/unlock` | POST | Desbloquear usuário | ADMIN |
| `/:id/reset-password` | POST | Resetar senha | ADMIN |
| `/:id/change-role` | POST | Alterar role | SYSTEM_ADMIN |

### 5.3 Autenticação

| Endpoint | Método | Descrição | Auth |
|----------|--------|-----------|------|
| `/login` | POST | Login | Não |
| `/logout` | POST | Logout | Sim |
| `/refresh` | POST | Refresh token | Não |
| `/forgot-password` | POST | Esqueci senha | Não |
| `/reset-password` | POST | Resetar senha | Não |
| `/verify-email` | POST | Verificar email | Não |
| `/resend-verification` | POST | Reenviar verificação | Não |

### 5.4 Notificações

| Evento | Destinatário | Canal | Template |
|--------|-------------|-------|----------|
| criação | Usuário | Email | `user_created` |
| redefinição senha | Usuário | Email | `user_password_reset` |
| lock | Usuário | Email | `user_account_locked` |
| desbloqueio | Usuário | Email | `user_account_unlocked` |

---

## 6. MÓDULOS RELACIONADOS

### 6.1 Módulos Existentes

| Módulo | Status | Uso |
|--------|--------|-----|
| `companies` | ✅ Existente | Multi-tenancy |

### 6.2 Módulos que Dependem

| Módulo | Prioridade | Descrição | Dependência |
|--------|------------|-----------|-------------|
| `patients` | ALTA | Pacientes (estende User) | `users` |
| `doctors` | ALTA | Médicos (estende User) | `users` |
| `professionals` | MÉDIA | Profissionais (estende User) | `users` |

### 6.3 Diagrama de Dependências

```
               ┌─────────────┐
               │  COMPANIES   │ ← existente
               └──────┬──────┘
                      │
                      ▼
               ┌─────────────┐
               │    USERS     │ ← este escopo
               └──────┬──────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────────┐
  │ PATIENTS │ │ DOCTORS  │ │PROFESSIONALS │
  │ (futuro) │ │ (futuro) │ │   (futuro)   │
  └──────────┘ └──────────┘ └──────────────┘
```

---

## 7. INTERFACES (UI)

### 7.1 Lista de Usuários (Admin)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USUÁRIOS                            [+ Novo Usuário]  [Filtros ▼]           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Filtros ─────────────────────────────────────────────────────────────┐  │
│  │ Status: [Todos ▼]  Role: [Todos ▼]  [Buscar nome/email...]  [Limpar]   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ │ Nome            │ Email            │ Role  │ Status  │ Ações         ││
│  ├─────────────────────────────────────────────────────────────────────────┤│
│  │ │ João Silva      │ joao@empresa.com │ Admin │ 🟢 Ativ │ 👁️ 📝 🔒 ❌ ││
│  │ │ Maria Santos    │ maria@empresa.com│ User  │ 🟢 Ativ │ 👁️ 📝 🔒 ❌ ││
│  │ │ Pedro Costa     │ pedro@empresa.com│ User  │ 🔴 Susp │ 👁️ 📝 🔓 ❌ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Legenda: 🟢 Ativo  🔴 Suspenso  ⚫ Inativo  🔒 Bloqueado                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Formulário de Usuário

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NOVO USUÁRIO                                                      [× Fechar]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─ Dados Pessoais ───────────────────────────────────────────────────────┐  │
│  │ * Nome         [_______________________________________________]       │  │
│  │   CPF          [___.___.___-__]                                        │  │
│  │   Telefone     [(___) ____-____]                                        │  │
│  │   Nascimento   [__/__/____]                                             │  │
│  │   Gênero       [Selecione ▼]                                             │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Acesso ────────────────────────────────────────────────────────────────┐  │
│  │ * Email        [_______________________________________________]       │  │
│  │ * Role         [Admin ▼]                                                │  │
│  │   Senha        [________________________] 🔒 Gerar Senha               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─ Endereço ─────────────────────────────────────────────────────────────┐  │
│  │   CEP          [_____-__] 🔍                                           │  │
│  │   Endereço     [_______________________________________________]       │  │
│  │   Número       [__________]  Complemento [__________________]         │  │
│  │   Bairro       [________________________]                             │  │
│  │   Cidade       [________________________]  UF [__]                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│                        [Cancelar]  [Salvar]                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. PENDÊNCIAS / DÚVIDAS

| # | Pergunta | Status | Resposta |
|---|----------|--------|----------|
| P1 | Precisa de campos extras para profissionais? | ABERTA | - |
| P2 | Integração com LDAP/SSO? | ABERTA | - |
| P3 | Campos de departamento/cargo são necessários? | ABERTA | - |

---

## 9. HISTÓRICO DE ALTERAÇÕES

| Versão | Data | Alteração | Autor |
|--------|------|-----------|-------|
| 1.0 | 2026-06-08 | Criação inicial | Claude (AI) |

---

## 10. APROVAÇÃO

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| Product Owner | | | |
| Tech Lead | | | |
| UX/UI | | | |

---

**FIM DO ESCOPO**