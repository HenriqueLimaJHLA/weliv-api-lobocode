# 🗄️ Arquitetura do Banco de Dados - TemplateLobocode

Visão geral da arquitetura do banco de dados do sistema TemplateLobocode.

---

## 📊 Visão Geral

O banco de dados do TemplateLobocode utiliza **PostgreSQL** como SGBD e **Prisma ORM** como camada de acesso aos dados. O sistema é **multi-tenant**, permitindo isolamento de dados por empresa/prestador de serviço.

---

## 🏗️ Modelos Principais

### **Autenticação e Usuários**

#### `User`
- Usuários do sistema (pessoas físicas)
- Roles: `USER`, `SERVICE_PROVIDER`, `ADMIN`
- Relacionamento com `Company` (multi-tenant)

#### `Company`
- Empresas/prestadores de serviço
- Multi-tenancy: cada empresa tem seus próprios dados
- Relacionamento com `ServiceProvider` (KYC)

#### `ServiceProvider`
- Dados específicos de prestadores de serviço
- KYC (Know Your Customer) com status de aprovação
- Relacionamento com `Company`

---

### **Gestão de Pets**

#### `Pet`
- Informações dos pets
- Relacionamento com `User` (dono)
- Espécie, raça, idade, peso, etc.

#### `PetFriendRequest`
- Solicitações de amizade entre pets
- Status: `PENDING`, `ACCEPTED`, `REJECTED`

#### `PetFriendship`
- Amizades estabelecidas entre pets

#### `WeightRecord`
- Histórico de peso dos pets
- Para acompanhamento de saúde

#### `VaccineExam`
- Vacinas e exames dos pets
- Histórico médico

#### `Reminder`
- Lembretes (vacinas, medicações, banho, etc.)
- Status: `PENDING`, `COMPLETED`, `CANCELLED`

---

### **Rede Social**

#### `SocialPost`
- Posts sociais dos usuários
- Tipos: `NORMAL`, `ADOPTION`, `LOST`, `SPONSORED`
- Relacionamento com `User` e `Pet`

#### `PostComment`
- Comentários em posts
- Relacionamento com `SocialPost` e `User`

#### `PostLike`
- Curtidas em posts
- Relacionamento com `SocialPost` e `User`

#### `Follow`
- Seguir/deixar de seguir usuários
- Relacionamento entre `User` (seguidor e seguido)

---

### **Serviços**

#### `ServiceProvider`
- Prestadores de serviço (veterinária, pet shop, etc.)
- Categorias, localização, avaliações

#### `Service`
- Serviços oferecidos pelos prestadores
- Preços, duração, disponibilidade

#### `Review`
- Avaliações de prestadores de serviço
- Nota (1-5 estrelas) e comentários

#### `Favorite`
- Prestadores favoritos dos usuários

---

### **Sistema**

#### `Notification`
- Notificações do sistema
- Tipos diversos (posts, comentários, lembretes, etc.)
- WebSocket para tempo real

#### `File`
- Arquivos uploadados (imagens, documentos)
- Integração com MinIO
- Tipos: `PROFILE_IMAGE`, `PET_IMAGE`, `POST_IMAGE`, etc.

---

## 🔗 Relacionamentos Principais

### **Multi-Tenancy**
```
Company → User (companyId)
Company → ServiceProvider
Company → Pet (via User)
```

### **Hierarquia de Usuários**
```
User → Company (multi-tenant)
User → ServiceProvider (se role = SERVICE_PROVIDER)
User → Pet (owner)
User → SocialPost (author)
```

### **Rede Social**
```
User → Follow → User (seguidor/seguido)
User → SocialPost → PostComment → User
User → SocialPost → PostLike
```

### **Pets**
```
User → Pet → PetFriendship → Pet
Pet → WeightRecord
Pet → VaccineExam
Pet → Reminder
```

---

## 🔐 Segurança e Isolamento

### **Multi-Tenancy**
- Todos os dados são filtrados por `companyId`
- Isolamento garantido no nível de aplicação
- `TenantInterceptor` aplica filtros automaticamente

### **Soft Delete**
- Campos `deletedAt` em modelos principais
- Dados não são removidos fisicamente
- Filtros automáticos excluem registros deletados

### **Auditoria**
- Campos `createdAt`, `updatedAt` em todos os modelos
- Campos `createdBy`, `updatedBy` para rastreamento

---

## 📈 Índices e Performance

### **Índices Principais**
- `User.email` (único)
- `Company.cnpj` (único)
- `Pet.ownerId` (busca por dono)
- `SocialPost.authorId` (feed)
- `Follow.followerId` e `Follow.followingId` (seguidores)

---

## 🔄 Migrations

### **Estrutura**
```
prisma/
├── migrations/
│   ├── [timestamp]_[nome]/
│   │   └── migration.sql
│   └── migration_lock.toml
└── schema.prisma
```

### **Comandos**
```bash
# Criar migration
npm run prisma:migrate nome-da-migration

# Aplicar migrations
npm run db:init:dev      # Desenvolvimento
npm run db:init:prod    # Produção
```

Para mais detalhes, consulte [migrations.md](../migrations.md).

---

## 📚 Documentação Adicional

- [Schema Prisma](./schema.prisma) - Schema completo do banco
- [Migrations](../migrations.md) - Guia de migrations
- [Prisma ORM](https://www.prisma.io/docs) - Documentação oficial

---

**Última atualização**: Fevereiro 2025
