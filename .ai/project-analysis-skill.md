# 🕵️ Project Analysis Skill

**Objetivo:** Analisar o repositório e identificar padrões para alimentar a AI Software Factory.

---

## ⚠️ Regras Fundamentais

- ❌ NÃO criar código
- ❌ NÃO criar documentação definitiva
- ❌ NÃO assumir padrões sem evidências
- ✅ Toda conclusão deve apontar exemplos encontrados no código
- ✅ Documentar no `.ai/audit.md`

---

## 📋 Processo de Análise

### Etapa 1: Mapear Estrutura

Verificar:
- [ ] Stack tecnológica (NestJS, Prisma, etc.)
- [ ] ORM utilizado
- [ ] Bibliotecas principais (CASL, class-validator, Swagger)
- [ ] Estrutura de diretórios
- [ ] Módulos existentes

### Etapa 2: Identificar Padrões

**Arquitetura de Módulos:**

| Camada | Estende | Localização |
|--------|---------|-------------|
| Controller | `UniversalController` | `src/shared/universal/controllers/` |
| Service | `UniversalService` | `src/shared/universal/services/` |
| Repository | `UniversalRepository` | `src/shared/universal/repositories/` |
| DTOs | class-validator | `src/modules/*/dto/` |

### Etapa 3: Identificar Convenções

**Nomenclatura:** (extrair do código existente)
- Entidades: PascalCase
- Arquivos: kebab-case
- Tabelas: snake_case plural

**Estrutura de Módulos:**
```
src/modules/<domain>/
├── user/
└── administrator/
```

### Etapa 4: Selecionar Módulos de Referência

Escolher módulos completos para referência:
1. `src/modules/template/standard/administrator/` - Padrão STANDARD
2. `src/modules/template/complex/administrator/` - Padrão COMPLEX

---

## 📤 Saída

Gerar/atualizar `.ai/audit.md` com:

1. **Estrutura do Projeto** - Stack, diretórios, frameworks
2. **Padrões Arquiteturais** - Controller, Service, Repository, DTOs
3. **Convenções de Código** - Nomenclatura, estrutura, imports
4. **Entidades Registradas** - Mapeamento Prisma ↔ CASL
5. **Exemplos de Referência** - Links para módulos

---

## 🚀 Como Usar

```
Execute: Project Analysis Skill

1. Leia a estrutura de diretórios
2. Analise src/shared/universal/ (motor)
3. Analise src/modules/template/ (templates)
4. Identifique padrões de controller, service, dto
5. Documente em .ai/audit.md
```

**Frequência:** Executar uma vez por projeto ou quando houver mudança na arquitetura.