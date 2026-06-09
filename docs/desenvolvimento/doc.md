# Documentação AI Engineering — Template NestJS LOBOCODE

> **Status:** levantamento e planejamento  
> **Escopo desta fase:** documentação e decisões — **sem produção de código**  
> **Repo piloto:** `template-nestjs-api-lobocode`  
> **Plano operacional detalhado:** [`plano.md`](./plano.md)

---

## Objetivo

Estruturar o repositório template para **desenvolvimento assistido por IA** em maturidade **L3 (Gerente)**, com trilha para L4, seguindo o roadmap operacional LOBOCODE.

Este documento consolida **o quê** fazer, **onde** cada artefato vive e **em que ordem** executar. A matriz completa de migração (origem → destino), gaps e checklist por etapa está em [`plano.md`](./plano.md).

---

## Referências externas

| Documento | Local | Papel |
|-----------|-------|--------|
| Roadmap AI Engineering — implementação | Portal · `interno/engenharia/guia-roadmap-ai-engineering.html` | Plano em 17 etapas, templates e prompts |
| Adoção de IA — engenharia e harness | Portal · `interno/engenharia/guia-adocao-ia-engineering.html` | Referência conceitual (L0–L4, harness, skills) |
| Engenharia moderna (PRD/TDD/SPEC) | Portal · `interno/engenharia/guia-engenharia-moderna.html` | Processo spec-driven |
| Playbook módulos NestJS Universal | Portal · `relatorio-modulos` | Fonte para rules/skills de CRUD |
| Plano detalhado (este repo) | `docs/desenvolvimento/plano.md` | Matriz de migração e fases |

---

## Divisão de responsabilidade

| Camada | Onde vive | Papel |
|--------|-----------|--------|
| **Repo template** | `template-nestjs-api-lobocode` | Regras, harness, skills, specs, arquitetura técnica |
| **Portal interno** | `portal/interno/` | Política org, maturidade L0–L4, métricas, onboarding guild |
| **Portal geral** | `portal/relatorio-modulos` | Playbook Universal CRUD (espelhar o essencial no repo na Etapa 5) |

**Meta MVP (piloto L3):** etapas **1–6** do roadmap + **harness (3)** + **segurança mínima (15)**. Demais etapas são evolução.

---

## Situação atual do template

### O que já existe

- `docs/CODING_STANDARDS.md`, `NAMING_CONVENTIONS.md`, `ARQUITETURA.md`, `TEMPLATE_BASELINE.md`, `CORE_PLUGIN_MATRIX.md`
- `.cursor/rules/nestjs-rules.mdc` (~790 linhas, regra monolítica)
- READMEs em módulos compartilhados (`auth`, `casl`, `filters`, `messages`, `files`)
- Gerador de módulos: `src/modules/template/COMO-USAR.md`, `GERADOR DE MÓDULOS PADRÃO LOBOCODE.md`
- Scripts npm: `lint`, `build`, `test`, `db:init:dev`, `prisma:*`
- Coleção HTTP: `request/*.http`

### O que não existe (estrutura alvo do roadmap)

- `AGENTS.md` na raiz
- `docs/rules/`, `docs/specs/`, `docs/architecture/`, `docs/business/`, `docs/prompts/`
- `.agents/skills/`, `.agents/templates/`
- `ai/specs/`, `ai/tasks/`, `ai/workflows/`
- `scripts/ai/`
- CI (`.github/workflows/`)
- Script unificado `npm run check`

### Bloqueadores conhecidos (antes de confiar no agente)

| Gap | Impacto |
|-----|---------|
| Zero arquivos `.spec.ts` | Harness de testes inexistente |
| Sem `npm run check` / CI | Agente sem sensores de autocorreção |
| `nestjs-rules.mdc` monolítico | Context window inflada; duplicação futura |
| Link quebrado `prisma/ARQUITETURA.md` em `docs/README.md` | Agente segue referência inválida |
| `users/` e `shared/universal/` sem README | Exploração excessiva de diretórios |
| Playbook módulos só no portal | Skill `nest-module-universal` incompleta no repo |

---

## Estrutura alvo do repositório

Árvore definida pelo roadmap — a ser criada na **Fase 1** (pastas + placeholders; conteúdo na Fase 2+):

```txt
repo/
├── AGENTS.md                 # Ponto de entrada do agente
├── docs/
│   ├── rules/                # Regras por domínio (@docs/rules/*.md)
│   ├── specs/                # Specs aprovadas
│   ├── architecture/         # ADRs, diagramas, folder-structure
│   ├── business/             # Glossário, personas (por projeto)
│   └── prompts/              # Prompts corporativos versionados
├── .agents/
│   ├── skills/               # Skills lazy-loaded
│   └── templates/            # SPEC, TASK, SKILL, ADR, etc.
├── ai/
│   ├── specs/                # Working copy — spec em execução
│   ├── tasks/                # TASK.md decompostas
│   └── workflows/            # Fluxos agenticos (YAML)
└── scripts/ai/               # Worktree, automações (Etapa 9)
```

---

## Decisões pendentes (Fase 0)

Registrar antes de criar arquivos:

| # | Decisão | Recomendação |
|---|---------|--------------|
| 0.1 | `make check` vs npm | `"check": "npm run lint && npm run build && npm test"` no `package.json`; Makefile opcional |
| 0.2 | `.cursor/rules/nestjs-rules.mdc` | Manter como atalho Cursor; **fonte da verdade** → `docs/rules/` + `AGENTS.md` |
| 0.3 | Política de uso IA | Portal interno — **não** no template (`docs/ai/` org) |
| 0.4 | Testes | Bloqueador: exigir ≥1 smoke test antes de declarar harness pronto (Etapa 3) |
| 0.5 | Espelhar `relatorio-modulos` | Confirmar se conteúdo essencial entra em `docs/rules/universal-crud.md` |
| 0.6 | Domínio legado Prisma | Limpeza de schema em paralelo — fora do escopo inicial de docs AI |

---

## Fases de implementação (resumo)

Detalhamento passo a passo, matriz origem → destino e critérios de done: [`plano.md`](./plano.md).

| Fase | Nome | Entregável principal |
|------|------|----------------------|
| **0** | Decisões | Checklist 0.1–0.6 fechado com o time |
| **1** | Bootstrap | Árvore de pastas + `.gitkeep` / READMEs mínimos |
| **2** | Migração | Conteúdo de docs legados → `docs/rules/`, `docs/architecture/`, prompts, templates |
| **3** | Roadmap etapas 1–6 | Fundamentos → spec-driven no repo piloto |
| **4** | Fora do repo | Política IA, maturidade, métricas no portal |
| **5** | Gaps | Itens bloqueadores resolvidos antes de L3 |

### Ordem de execução recomendada

```txt
0. Decisões (check npm, política portal)
   ↓
1. Árvore + .agents/templates (conteúdo do roadmap)
   ↓
2. AGENTS.md mínimo + folder-structure.md
   ↓
3. npm run check + smoke test + CI        ← desbloqueia harness
   ↓
4. docs/rules/ (≥5 arquivos)
   ↓
5. docs/prompts/ (11 arquivos)
   ↓
6. Skills P0: nest-module-universal, prisma-migrate, qa-unit-jest
   ↓
7. Spec-driven: templates + exemplo companies
   ↓
8. READMEs: users, universal
   ↓
9. Worktree + workflows YAML
   ↓
10. QA / review / MCP (evolução)
   ↓
11. Portal: política, métricas, onboarding
```

**Estimativa MVP (etapas 1–6):** 4–7 semanas com 1 squad piloto.

---

## Mapa rápido: migração de conteúdo

### Regras (`docs/rules/`)

| Destino | Fonte principal | Ação |
|---------|-----------------|------|
| `code-standards.md` | `CODING_STANDARDS.md` + MDC | Extrair e condensar |
| `naming-conventions.md` | `NAMING_CONVENTIONS.md` | Mover/adaptar |
| `modules-nestjs.md` | MDC + `crud-generic-pattern.md` | Criar |
| `prisma.md` | `ARQUITETURA.md` + schema Prisma | Criar |
| `http-api.md` | `request/README.md` + MDC | Criar |
| `tests.md` | MDC § testes | Criar do zero |
| `security.md` | auth + casl READMEs + MDC | Consolidar |
| `anti-patterns.md` | MDC § Anti-Patterns | Extrair |
| `universal-crud.md` | `COMO-USAR.md` + portal relatorio-modulos | Criar |

### Arquitetura (`docs/architecture/`)

| Destino | Fonte principal | Ação |
|---------|-----------------|------|
| `ARCHITECTURE.md` | README + CORE_PLUGIN_MATRIX + TEMPLATE_BASELINE | Sintetizar |
| `folder-structure.md` | README § estrutura + MDC | Criar |
| `database.md` | `docs/ARQUITETURA.md` (conteúdo DB) | Mover/renomear |
| `adr-001-modular-monolith.md` | CORE_PLUGIN_MATRIX | Criar ADR |
| `adr-002-universal-first.md` | MDC Universal-first | Criar ADR |

### Skills prioritárias (`.agents/skills/`)

| Skill | Prioridade | Depende de |
|-------|------------|------------|
| `nest-module-universal` | P0 | Rules + COMO-USAR |
| `prisma-migrate` | P0 | migrations.md, scripts npm |
| `qa-unit-jest` | P0 | Etapa 3 (harness) |
| `dev-setup` | P1 | README, docker |
| `qa-e2e` | P2 | jest-e2e configurado |
| `openapi-sync` | P2 | Swagger no Nest |

---

## O que **não** entra no template

| Artefato (roadmap) | Destino correto |
|--------------------|-----------------|
| Política de uso de IA | Portal `interno/` |
| Maturidade L0–L4 | `guia-adocao-ia-engineering.html` |
| Dashboard de maturidade | Planilha / Notion |
| Métricas de produtividade | Ferramentas externas (Etapa 16) |
| Guild AI Engineering | Processo people |
| `docs/business/*` concreto | Por projeto/cliente — só templates no repo |

---

## Critérios de conclusão do MVP documental

Antes de considerar o piloto em **L3**:

- [ ] Estrutura inicial commitada conforme árvore acima
- [ ] `AGENTS.md` referencia `@docs/rules/*` e comandos npm oficiais
- [ ] ≥5 arquivos em `docs/rules/` validados pelo time
- [ ] ≥3 skills P0 documentadas em `.agents/skills/`
- [ ] 11 prompts em `docs/prompts/` (ajustados: `npm run check`, não `make check`)
- [ ] Templates em `.agents/templates/` (incl. ADR)
- [ ] `docs/architecture/folder-structure.md` publicado
- [ ] Política de uso IA publicada no portal (Etapa 1)
- [ ] Harness: `npm run check` verde + CI (Etapa 3 — **código**, fase posterior)
- [ ] 2 features piloto spec-driven (Etapa 6 — **execução**, fase posterior)

---

## Próximo passo imediato

1. Fechar **Fase 0** (decisões 0.1–0.6) com stakeholders.
2. Iniciar **Fase 1** — apenas estrutura de pastas e READMEs placeholder (sem migrar conteúdo legado ainda).
3. Paralelamente no portal: política de uso IA + baseline L0–L4 (Etapa 1 org).

Para matriz completa, gaps por etapa do roadmap (1–17) e checklist detalhado, consulte [`plano.md`](./plano.md).

---

**Última atualização:** maio/2026 · Documento vivo — revisar após cada fase concluída.
