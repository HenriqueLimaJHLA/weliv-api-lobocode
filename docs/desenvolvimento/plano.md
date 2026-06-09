# Plano detalhado — AI Engineering (template)

> **Documento de referência formatado:** [`doc.md`](./doc.md)  
> **Status:** levantamento — sem implementação de código nesta fase.

---

## Visão geral
Camada	Onde vive	Papel
Repo template
template-nestjs-api-lobocode
Regras, harness, skills, specs, arquitetura técnica
Portal interno
portal/interno/
Política org, maturidade L0–L4, métricas, onboarding guild
Portal geral
portal/relatorio-modulos
Playbook Universal CRUD (fonte para rules/skills)
Meta MVP (L3 no piloto): etapas 1–6 + 3 + 15 mínimo — resto é evolução.

Fase 0 — Decisões antes de criar arquivos
#	Decisão	Recomendação para o template
0.1
make check vs npm
Adicionar script "check": "npm run lint && npm run build && npm test" no package.json (build já faz typecheck). Opcional: Makefile que delega para npm.
0.2
.cursor/rules/nestjs-rules.mdc
Manter como atalho Cursor, mas fonte da verdade passa a ser docs/rules/*.md + AGENTS.md. MDC vira índice fino ou link.
0.3
docs/ai/ vs ai/
Roadmap etapa 1 cita docs/ai/policy-uso-ia.md — política org → portal. No repo: só ai/ (working set) + link no AGENTS.md.
0.4
Testes
Bloqueador: hoje 0 arquivos .spec.ts, pasta test/ vazia. Etapa 3 exige harness com testes reais antes de confiar no agente.
Fase 1 — Criar árvore vazia (bootstrap)
Ordem sugerida — só pastas + .gitkeep, sem conteúdo ainda:

repo/
├── AGENTS.md                          ← criar
├── docs/
│   ├── rules/                         ← criar
│   ├── specs/                         ← criar (+ README “specs aprovadas”)
│   ├── architecture/                  ← criar
│   ├── business/                      ← criar (placeholder template)
│   └── prompts/                       ← criar
├── .agents/
│   ├── skills/                        ← criar
│   └── templates/                     ← copiar do roadmap § templates-oficiais
├── ai/
│   ├── specs/                         ← criar
│   ├── tasks/                         ← criar
│   └── workflows/                     ← criar
└── scripts/ai/                        ← criar (etapa 9)
Critério de done: estrutura commitada; docs/README.md atualizado apontando para a nova árvore.

Fase 2 — Matriz origem → destino (migração)
2.1 Regras (docs/rules/)
Arquivo destino	Fonte no template / portal	Ação
docs/rules/code-standards.md
docs/CODING_STANDARDS.md + .cursor/rules/nestjs-rules.mdc (§ TypeScript, funções, SOLID)
Extrair e condensar (~150–250 linhas; MDC tem ~790 linhas — não copiar tudo)
docs/rules/naming-conventions.md
docs/NAMING_CONVENTIONS.md
Mover/adaptar (ou manter symlink lógico: rules referencia o arquivo legado até deprecar)
docs/rules/modules-nestjs.md
nestjs-rules.mdc (§ módulos, Universal-first, CRUD) + docs/padroes/crud-generic-pattern.md
Criar — regra mais crítica para agente
docs/rules/prisma.md
docs/ARQUITETURA.md + comentários em prisma/schema/*.prisma
Criar — FKs escalares, multi-tenant, migrations
docs/rules/http-api.md
request/README.md + padrões de controller no MDC
Criar — paths REST, DTOs, Swagger, request/*.http
docs/rules/tests.md
MDC § testes + não existe doc de testes
Criar do zero — Jest, e2e, cobertura mínima, AAA
docs/rules/security.md
MDC § auth + src/shared/auth/README.md + casl/README.md
Consolidar — JWT, guards, tenant, secrets
docs/rules/anti-patterns.md
MDC § Anti-Patterns
Extrair — Prisma no controller, métodos em inglês errados, etc.
docs/rules/universal-crud.md
src/modules/template/COMO-USAR.md + GERADOR DE MÓDULOS… + portal relatorio-modulos
Criar — MINIMAL/STANDARD/COMPLEX, checklist cópia
Arquivos legados após migração: manter docs/CODING_STANDARDS.md etc. com banner “deprecated → docs/rules/” por 1–2 sprints, depois remover.

2.2 Arquitetura (docs/architecture/)
Arquivo destino	Fonte	Ação
docs/architecture/ARCHITECTURE.md
README.md (estrutura) + docs/CORE_PLUGIN_MATRIX.md + docs/TEMPLATE_BASELINE.md
Sintetizar visão modular, plugins, stack
docs/architecture/folder-structure.md
README.md § estrutura + MDC § organização
Criar — mapa para agente (reduz tool calls, etapa 2)
docs/architecture/database.md
docs/ARQUITETURA.md (hoje é só DB)
Renomear/mover conteúdo atual
docs/architecture/adr-001-modular-monolith.md
Inferir de CORE_PLUGIN_MATRIX + schema modular
Criar ADR
docs/architecture/adr-002-universal-first.md
MDC Universal-first
Criar ADR
Corrigir link quebrado: docs/README.md aponta prisma/ARQUITETURA.md — arquivo não existe; corrigir para docs/architecture/database.md.

2.3 Prompts (docs/prompts/)
Copiar os 11 prompts do roadmap (§ biblioteca-prompts) como arquivos separados:

Arquivo	ID no roadmap
PROMPT-requisitos.md
#prompt-requisitos
PROMPT-arquitetura.md
#prompt-arquitetura
PROMPT-design-tecnico.md
#prompt-design
PROMPT-decomposicao-tasks.md
#prompt-decomposicao
PROMPT-implementacao.md
#prompt-implementacao
PROMPT-refatoracao.md
#prompt-refatoracao
PROMPT-code-review.md
#prompt-review
PROMPT-testes.md
#prompt-testes
PROMPT-debug.md
#prompt-debug
PROMPT-incidente.md
#prompt-incidente
PROMPT-documentacao.md
#prompt-docs
Ajuste LOBOCODE: trocar make check por npm run check nos prompts; referenciar @docs/rules/modules-nestjs.md.

2.4 Templates (.agents/templates/)
Copiar do roadmap § templates-oficiais:

AGENTS.template.md (não commitar como AGENTS.md na raiz — usar template + instanciar)
RULES.template.md
SPEC.template.md
TASK.template.md
ARCHITECTURE.template.md
SKILL.template.md
ADR.template.md (roadmap etapa 11 pede; não está na seção templates — adicionar)
2.5 Skills (.agents/skills/)
Skill	Fontes	Prioridade
nest-module-universal/
COMO-USAR.md, GERADOR…, relatorio-modulos
P0
prisma-migrate/
migrations.md, scripts npm db:init:dev, prisma:migrate
P0
dev-setup/
README.md, docker/README.md, scripts/start-database.sh
P1
qa-unit-jest/
criar do zero (sem testes hoje)
P0 — depende de etapa 3
qa-e2e/
test/jest-e2e.json (referenciado, pasta vazia)
P2
openapi-sync/
Swagger no Nest (verificar se @nestjs/swagger configurado)
P2
2.6 READMEs de módulo (context engineering, etapa 2)
Módulo	Situação	Ação
users/
Sem README (link em docs/README.md quebrado)
Criar README mínimo
companies/
Tem ARCHITECTURE.md + SPEC.md
Mover spec → docs/specs/ ou ai/specs/ como exemplo
template/
COMO-USAR.md excelente
Manter; skill aponta para ele
shared/universal/
Sem README
Criar — API do UniversalService
shared/auth, casl, filters, messages
README ok
Referenciar no AGENTS.md
2.7 Business (docs/business/)
Arquivo	Conteúdo
README.md
“Preencher por projeto — copiar deste template”
glossario.template.md
Placeholder
personas.template.md
Placeholder
Não migrar domínio pet/marketplace do schema Prisma para business doc do template genérico — isso é legado de limpeza de domínio.

Fase 3 — Passo a passo por etapa do roadmap
Etapa 1 — Fundamentos (Semana 1)
Passo	Onde	Ação
1.1
Portal
Publicar/usar guia-adocao-ia-engineering.html + política de uso IA
1.2
Portal
Questionário L0–L4 por dev (planilha/dashboard — fora do repo)
1.3
Repo
Fase 1: criar árvore
1.4
Repo
AGENTS.md mínimo (comandos npm, @rules, fluxo SPEC→TASK)
1.5
Repo
Apontar repo piloto = template-nestjs-api-lobocode (roadmap já cita)
Done: estrutura + AGENTS.md + política no portal.

Etapa 2 — Context Engineering (Semana 1–2)
Passo	Ação
2.1
Criar docs/architecture/folder-structure.md
2.2
Popular docs/prompts/ (11 arquivos)
2.3
Matriz contexto × tarefa (1 página em docs/prompts/README.md ou portal)
2.4
Corrigir READMEs quebrados (users, universal)
2.5
Documentar request/*.http em docs/rules/http-api.md
Done: agente encontra contexto sem explorar 7+ diretórios.

Etapa 3 — Harness (Semana 2–3) ⚠️ crítico
Passo	Ação
3.1
Adicionar "check", "typecheck": "tsc --noEmit" no package.json
3.2
Criar docs/rules/tests.md
3.3
Escrever ≥1 teste smoke (ex.: app.controller.spec.ts) para npm test não ser vazio
3.4
Criar .github/workflows/ci.yml — lint + build + test
3.5
Documentar loop no AGENTS.md: edit → npm run check → fix
3.6
Espelhar CI local = remoto
Done: npm run check verde; CI configurado.

Etapa 4 — Rules Architecture (Semana 3–4)
Passo	Ação
4.1
Workshop: validar rules com time
4.2
Executar matriz § 2.1 (≥5 arquivos em docs/rules/)
4.3
AGENTS.md referencia todos com @docs/rules/...
4.4
Enxugar .cursor/rules/nestjs-rules.mdc → “ver docs/rules + alwaysApply mínimo”
4.5
Teste cego: “dado AGENTS.md, criar módulo X”
Done: ≥5 rule files; review com −25% comentários de estilo (meta roadmap).

Etapa 5 — Skills (Semana 4–5)
Passo	Ação
5.1
Skill nest-module-universal (P0)
5.2
Skill prisma-migrate (P0)
5.3
Skill qa-unit-jest (P0)
5.4
Política segurança skills (sem secrets, sem curl arbitrário)
5.5
Testar gatilho: “criar módulo payments MINIMAL user”
Done: ≥3 skills; tempo “novo módulo CRUD” medido.

Etapa 6 — Spec-Driven (Semana 5–7)
Passo	Ação
6.1
Templates em .agents/templates/
6.2
Exemplo: migrar companies/SPEC.md → docs/specs/SPEC-001-companies.md
6.3
Checklist gate: SPEC approved → TASKs → implement → QA
6.4
Cross-ref portal guia-engenharia-moderna.html (PRD/TDD/SPEC/ADR)
6.5
2 features piloto 100% spec-driven
Done: nenhuma feature >1 task sem SPEC aprovado.

Etapas 7–9 — Workflows + Worktree (Semana 7–10)
Passo	Ação
7.1
ai/workflows/bugfix.yaml e qa-regression.yaml (esboço roadmap)
7.2
scripts/ai/worktree-create.sh + worktree-remove.sh
7.3
Branch convention ai/task-042-01 documentada no AGENTS.md
7.4
Task looper — decidir script bash vs CI job (MVP: manual)
Etapas 10–12 — QA, docs, review (Semana 8–10)
Passo	Ação
10.1
Cobertura mínima por módulo em docs/rules/tests.md
10.2
Prompt PROMPT-testes.md com npm run test
11.1
Template ADR + prompt documentação
11.2
PR checklist (.github/pull_request_template.md)
12.1
Prompt code review + integração bot (GitHub/Cursor)
Etapas 13–17 — Cloud, MCP, gov, métricas, escala (Semana 10+)
Etapa	Repo	Portal/org
13 Cloud Agents
AGENTS.md + env setup versionado
Política dados cloud
14 MCP
.cursor/mcp.json.example (sem secrets)
Lista integrações aprovadas
15 Segurança
docs/rules/security.md, gitleaks CI, .cursorignore reforçado
Política dados IA
16 Métricas
—
Dashboard Linear/CI
17 Escala
Template “golden path” completo
Onboarding 2 dias + guild
Fase 4 — O que não entra no template (portal/org)
Artefato roadmap	Destino correto
docs/ai/policy-uso-ia.md
Portal interno/ (ou doc jurídico)
docs/ai/maturidade-l0-l4.md
guia-adocao-ia-engineering.html
Dashboard maturidade
Planilha/Notion
Métricas produtividade
Etapa 16 — ferramentas externas
Guild AI Engineering
Processo people, não repo
Fase 5 — Gaps críticos hoje (bloqueiam L3)
Gap	Impacto	Resolver em
Zero testes implementados
Harness falso; agente não autocorrige
Etapa 3
Sem npm run check / CI
Sensores inexistentes
Etapa 3
nestjs-rules.mdc monolítico (~790 linhas)
Estoura contexto; duplica rules
Etapa 4
Links quebrados em docs/README.md
Agente lê doc errada
Etapa 2
users sem README
Context stuffing
Etapa 2
universal sem README
Agente não entende CRUD genérico
Etapa 2 + 5
Domínio legado no Prisma/schema
Confunde template genérico
Limpeza paralela (fora AI docs)
Playbook módulos só no portal
Skill incompleta sem relatorio-modulos
Etapa 5 — espelhar essencial no repo
Ordem de execução recomendada (sequência única)
0. Decisões (check npm, política portal)
   ↓
1. Árvore de pastas + .agents/templates (copiar do roadmap)
   ↓
2. AGENTS.md mínimo + folder-structure.md
   ↓
3. npm run check + 1 teste smoke + CI          ← desbloqueia harness
   ↓
4. Migrar docs/rules (5 arquivos mínimo)
   ↓
5. docs/prompts (11 arquivos)
   ↓
6. Skills: nest-module-universal + prisma-migrate
   ↓
7. Spec-driven: templates + exemplo companies
   ↓
8. READMEs faltantes (users, universal)
   ↓
9. Worktree scripts + workflows YAML
   ↓
10. QA/review/CI avançado + MCP example
   ↓
11. Portal: política + métricas + onboarding
Estimativa MVP (etapas 1–6): ~4–7 semanas com 1 squad piloto, alinhado ao roadmap.

