# 📋 Especificação: Empresas (Companies)

## Entidade
- **Domínio:** companies
- **Tabela Prisma:** `Company`
- **Camadas:** administrator, user

---

## Regras de Negócio

### Cadastro
- [ ] CNPJ único e válido
- [ ] Razão social obrigatória
- [ ] E-mail de contato único
- [ ] Telefone opcional
- [ ] Endereço completo opcional

### Gestão
- [ ] Apenas SYSTEM_ADMIN pode criar/empresas
- [ ] ADMIN da empresa pode editar dados
- [ ] Usuários podem estar vinculados a empresas

### Geocoding
- [ ] Buscar coordenadas ao criar/atualizar endereço
- [ ] Armazenar latitude/longitude
- [ ] Backfill automático de empresas pendentes

---

## Campos (Prisma)

```prisma
model Company {
  id            String    @id @default(uuid())
  name          String
  tradeName     String?
  cnpj          String?   @unique
  contactEmail  String?
  contactPhone String?
  website       String?
  address       String?
  addressNumber String?
  addressComplement String?
  neighborhood  String?
  city          String?
  state         String?
  zipCode       String?
  latitude      Float?
  longitude     Float?
  
  users User[]
  settings      Setting[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
}
```

---

## Endpoints

| Método | Endpoint | Camada | Descrição |
|--------|----------|--------|-----------|
| POST | `/admin/companies` | admin | Criar empresa |
| GET | `/admin/companies` | admin | Listar |
| GET | `/admin/companies/:id` | admin | Detalhes |
| PATCH | `/admin/companies/:id` | admin | Atualizar |
| DELETE | `/admin/companies/:id` | admin | Soft delete |
| GET | `/user/companies` | user | Listar empresas |

---

## Validações

- CNPJ: formato válido (14 dígitos)
- Email: formato válido
- Telefone: formato brasileiro
- CEP: formato XXXXX-XXX

---

## Relacionamentos

- `Company.users` → `User[]`
- `Company.settings` → `Setting[]`

---

## Status
- [x] Criado
- [ ] Implementado
- [ ] Testado
