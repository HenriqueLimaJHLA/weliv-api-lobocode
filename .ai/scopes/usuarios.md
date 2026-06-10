# 📋 Especificação: Usuários (Users)

## Entidade
- **Domínio:** users
- **Tabela Prisma:** `User`
- **Camadas:** administrator, user

---

## Regras de Negócio

### Cadastro
- [ ] Email único e válido
- [ ] CPF opcional mas único se fornecido
- [ ] Nome obrigatório (2-100 caracteres)
- [ ] Telefone opcional (formato brasileiro)
- [ ] Senha hashada com bcrypt

### Autenticação
- [ ] Login por email
- [ ] JWT com expiração configurável
- [ ] Refresh token para renovação
- [ ] Bloqueio após 5 tentativas falhas

### Perfis/Roles
- [ ] SYSTEM_ADMIN: acesso total ao sistema
- [ ] ADMIN: gerencia empresa
- [ ] USER: usuário comum do app

### Status
- [ ] ACTIVE: pode fazer login
- [ ] INACTIVE: login bloqueado
- [ ] SUSPENDED: temporariamente suspenso

---

## Campos (Prisma)

```prisma
model User {
  id String    @id @default(uuid())
  email String    @unique
  name String
  cpf           String?   @unique
  phone         String?
  password String
  role          UserRole @default(USER)
  status UserStatus @default(ACTIVE)
  birthDate     DateTime?
  gender        String?
  profilePicture String?
  language      String    @default("pt-BR")
  timezone      String    @default("America/Sao_Paulo")
  
  companyId     String?
  company       Company?  @relation(...)
  
  lockedUntil   DateTime?
  loginAttempts Int @default(0)
  
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret  String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
}

enum UserRole {
  SYSTEM_ADMIN
  ADMIN
  USER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

---

## Endpoints

| Método | Endpoint | Camada | Descrição |
|--------|----------|--------|-----------|
| POST | `/auth/login` | - | Login |
| POST | `/auth/register` | - | Registro |
| POST | `/auth/refresh` | - | Renovar token |
| GET | `/admin/users` | admin | Listar |
| GET | `/admin/users/:id` | admin | Detalhes |
| POST | `/admin/users/:id/activate` | admin | Ativar |
| POST | `/admin/users/:id/deactivate` | admin | Desativar |
| POST | `/admin/users/:id/suspend` | admin | Suspender |
| PATCH | `/admin/users/:id/role` | admin | Alterar role |
| GET | `/user/me` | user | Meu perfil |
| PATCH | `/user/me` | user | Atualizar perfil |

---

## Validações

- Email: formato válido, lowercase
- CPF: 11 dígitos (se fornecido)
- Telefone: (XX) XXXXX-XXXX
- Nome: 2-100 caracteres
- Senha: mínimo 8 caracteres

---

## Relacionamentos

- `User.company` → `Company?`
- Usado por: Files, Notifications, Settings

---

## Status
- [x] Criado
- [x] Implementado
- [ ] Testado
