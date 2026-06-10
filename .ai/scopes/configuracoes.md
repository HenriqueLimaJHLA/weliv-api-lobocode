# 📋 Especificação: Configurações (Settings)

## Entidade
- **Domínio:** settings
- **Tabela Prisma:** `Setting`
- **Camada:** administrator

---

## Regras de Negócio

### Cadastro
- [ ] Chave única por empresa
- [ ] Valor pode ser string, number ou JSON
- [ ] Descrição opcional

### Tipos
- [ ] PUBLIC: visível para todos
- [ ] PRIVATE: apenas admin

### Gerenciamento
- [ ] ADMIN gerencia configurações da empresa
- [ ] Pode criar, editar, deletar configurações

---

## Campos (Prisma)

```prisma
model Setting {
  id          String  @id @default(uuid())
  key         String
  value       String
  description String?
  type SettingType @default(STRING)
  isPublic   Boolean @default(false)
  
  companyId  String?
  company Company? @relation(...)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  deletedAt  DateTime?
  
  @@unique([key, companyId])
}

enum SettingType {
  STRING
  NUMBER
  BOOLEAN
  JSON
}
```

---

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/admin/settings` | Criar |
| GET | `/admin/settings` | Listar |
| GET | `/admin/settings/:id` | Detalhes |
| PATCH | `/admin/settings/:id` | Atualizar |
| DELETE | `/admin/settings/:id` | Deletar |
| GET | `/admin/settings/public` | Listar públicas |
| GET | `/admin/settings/all` | Listar todas |

---

## Validações

- Key: max 100 caracteres, sem espaços
- Value: max 1000 caracteres
- Unique: key + companyId

---

## Relacionamentos

- `Setting.company` → `Company?`

---

## Status
- [x] Criado
- [x] Implementado
- [ ] Testado
