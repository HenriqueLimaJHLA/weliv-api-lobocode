# 📚 Documentation Generator Skill

**Objetivo:** Gerar documentação oficial a partir do `audit.md` para guiar a criação de novos módulos.

---

## 📥 Entrada

- `.ai/audit.md` - Resultado da análise do projeto

## 📤 Saída

```
.ai/
├── architecture.md      # Visão geral da arquitetura
├── conventions.md       # Convenções de código
├── module-generator.md  # Como gerar módulos
├── database-generator.md # Como gerar banco
├── security-patterns.md # Padrões de segurança
└── api-patterns.md      # Padrões de API
```

---

## ⚠️ Regras Fundamentais

- ❌ NÃO inventar padrões
- ❌ NÃO criar convenções inexistentes
- ✅ Priorizar consistência com o código encontrado
- ✅ Documentar apenas o padrão predominante
- ✅ Criar documentação acionável (com exemplos de código)

---

## 📋 Processo de Geração

### Passo 1: Ler audit.md

Extrair:
- Stack tecnológica
- Estrutura de diretórios
- Padrões arquiteturais (Controller, Service, Repository)
- Convenções de código

### Passo 2: Gerar architecture.md

**Conteúdo:**
- Visão geral da arquitetura
- Diagrama do fluxo de requisição
- Stack tecnológica
- Componentes principais

### Passo 3: Gerar conventions.md

**Conteúdo:**
- Nomenclatura (entidades, arquivos, tabelas)
- Estrutura de diretórios
- Padrão de imports
- Comments e documentação

### Passo 4: Gerar module-generator.md

**Conteúdo:**
- Como estender UniversalController
- Como estender UniversalService
- Estrutura de DTOs
- Hooks disponíveis
- Exemplo completo de geração

### Passo 5: Gerar database-generator.md

**Conteúdo:**
- Estrutura de schema Prisma
- Campos obrigatórios
- Relacionamentos
- Índices

### Passo 6: Gerar security-patterns.md

**Conteúdo:**
- Autenticação (JWT)
- Autorização (CASL)
- Multi-tenancy
- Validação

---

## 🎯 Resultado Esperado

Após a execução, novos módulos poderão ser gerados **sem necessidade de reanalisar o projeto**, apenas consultando:

```
1. .ai/audit.md          → O que existe
2. .ai/conventions.md     → Como nomear
3. .ai/module-generator.md → Como gerar
4. .ai/database-generator.md → Como gerar banco
```

---

## 🚀 Como Usar

```
Execute: Documentation Generator Skill

1. Leia .ai/audit.md
2. Gere .ai/architecture.md
3. Gere .ai/conventions.md
4. Gere .ai/module-generator.md
5. Gere .ai/database-generator.md
6. Gere .ai/security-patterns.md
7. Gere .ai/api-patterns.md
```

**Frequência:** Após executar Project Analysis Skill. Atualizar apenas se architecture mudar.