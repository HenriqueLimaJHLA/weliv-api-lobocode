# 🐺 LOBOCODE AI SOFTWARE FACTORY

**Fábrica de Software com IA** - Template NestJS para criação rápida de módulos usando inteligência artificial.

---

## 🎯 O que é?

Este é um template de backend que permite construir módulos de forma **80% mais rápida** usando IA.

```
Você define a regra de negócio → IA entende → IA gera código → IA gera banco
```

### Motor Universal

Todos os módulos seguem o padrão **Universal**:
- `UniversalService` - Lógica de negócio
- `UniversalController` - Rotas REST
- `UniversalModule` - Injeção de dependências

Não recrie a roda. Estenda o motor.

---

## 🚀 Quick Start

### 1. Clone e instale

```bash
git clone https://github.com/ClaiverAlmeida/LOBOCODE-AI-SOFTWARE-FACTORY.git
cd LOBOCODE-AI-SOFTWARE-FACTORY
npm install
```

### 2. Configure ambiente

```bash
cp .env.example .env
```

### 3. Suba infraestrutura

```bash
./scripts/start-database.sh
```

### 4. Sincronize banco

```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### 5. Inicie

```bash
npm run start:dev
```

**API:** `http://localhost:3000`  
**Swagger:** `http://localhost:3000/docs`

---

## 🏗️ Como Construir um Módulo

### Passo 1: Defina o Escopo

```yaml
Módulo: products
Domínio: product
Campos:
  - name: string (obrigatório)
  - price: decimal
  - sku: string (único)
Camada: administrator
```

### Passo 2: Peça para a IA

```
@.ai/SCOPE-MODULE-GUIDE.md

Construa o módulo de produtos seguindo o guia.

Escopo:
- Domínio: product
- Camada: administrator
- Campos: name, price, sku
```

### Passo 3: A IA faz o resto

1. Copia template
2. Substitui placeholders
3. Atualiza Prisma
4. Registra configurações
5. Compila

### Passo 4: Teste

```bash
npm run start:dev
# Teste no Swagger
```

---

## 📁 Estrutura do Projeto

```
src/
├── modules/
│   ├── template/           # Templates para copiar
│   │   ├── minimal/ # CRUD simples
│   │   ├── standard/      # Com hooks + custom
│   │   └── complex/       # Lógica complexa
│   ├── users/             # Usuários
│   ├── companies/         # Empresas
│   └── notifications/     # Notificações
├── shared/
│   ├── universal/         # 🧠 Motor do sistema
│   ├── files/              # Upload MinIO
│   ├── auth/               # Autenticação
│   └── config/             # Configurações
└── app.module.ts
```

### Templates

| Template | Use quando |
|----------|-------------|
| `minimal/` | CRUD simples |
| `standard/` | Com validações e hooks |
| `complex/` | Lógica complexa + sub-serviços |

---

## 🧠 Motor Universal

O motor Universal reduz código boilerplate:

```typescript
// ANTES (módulos tradicionais)
@Service()
class ProductService {
  constructor(
    private prisma: PrismaService,
    private auth: AuthService,
    // ...10+ dependências
  ) {}
  
  async create(dto: CreateProductDto) {
    // ... 50+ linhas de código
  }
}

// DEPOIS (com Universal)
@Service()
class AdministratorProductService extends UniversalService<
  CreateProductDto,
  UpdateProductDto
> {
  protected async antesDeCriar(data: CreateProductDto) {
    // Hooks para lógica custom
  }
}
```

**Benefícios:**
- ~70% menos código
- Padronização
- Multi-tenancy automático
- CASL permissions automático

---

## 🛠️ Stack

| Tecnologia | Uso |
|------------|-----|
| NestJS 11 | Framework |
| TypeScript | Linguagem |
| Prisma | ORM |
| PostgreSQL | Banco |
| Redis | Cache |
| MinIO | Storage |
| JWT + CASL | Auth + Permissions |
| WebSocket | Tempo real |
| Docker | Deploy |

---

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| `.ai/SCOPE-MODULE-GUIDE.md` | Como pedir para IA construir |
| `.ai/execution-skill.md` | Protocolo de execução da IA |
| `.ai/conventions.md` | Convenções de código |
| `src/modules/template/COMO-USAR.md` | Como usar templates |
| `CLAUDE.md` | Regras para IA |

---

## ⚡ Comandos

```bash
# Desenvolvimento
npm run start:dev
npm run start:debug

# Build
npm run build

# Prisma
npx prisma generate # Gerar tipos
npx prisma db push     # Sync banco
npx prisma migrate # Migrar
npm run prisma:seed    # Popular dados
npm run prisma:studio  # Visualizar banco

# Testes
npm run test
npm run test:cov
```

---

## 🎓 Para Desenvolvedores

### Antes de criar módulo

1. Leia `.ai/SCOPE-MODULE-GUIDE.md`
2. Escolha o template adequado
3. Defina o escopo com campos e recursos

### Regras

1. **Sempre copie template** - Não crie do zero
2. **Siga convenções** - Verifique `.ai/conventions.md`
3. **Multi-tenancy** - Toda entidade tem `companyId`
4. **CASL** - Configure permissões

---

## 📄 Licença

Projeto privado da LoboCode.

---

**LOBO CODE AI SOFTWARE FACTORY**  
*Construa mais rápido. Erre menos.*
