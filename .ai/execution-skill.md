# ⚡ Execution Skill v2.0 - LOBO CODE AI SOFTWARE FACTORY

**Protocolo de execução obrigatório para todas as tarefas de desenvolvimento.**

---

## 🎯 Quando Usar

Use este skill para **todas** as tarefas de desenvolvimento:
- Bug fixes
- Novas features
- Refatoração
- Correção de documentação
- Geração de código

**Não use** para:
- Pesquisa pura (sem ação)
- Perguntas sobre o projeto

---

## 🚨 REGRA DE OURO #0 (NÃO PULAR)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   NUNCA criar código do zero.                                             ║
║   SEMPRE copiar estrutura do template.                                    ║
║   SUBSTITUIR apenas lógica de negócio.                                   ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**Se não seguir esta regra** → o código não seguirá os padrões do projeto.

---

## 🔄 Ciclo de Execução (6 Fases)

```
┌────────────┐   ┌───────────┐   ┌────────┐   ┌──────────┐   ┌────────┐   ┌─────────┐
│ BRIEFING   │ → │   RECON   │ → │  PLAN  │ → │ EXECUTE  │ → │ VERIFY │ → │ DEBRIEF │
└────────────┘   └───────────┘   └────────┘   └──────────┘   └────────┘   └─────────┘
```

---

## FASE 1: BRIEFING (Entender)

**Objetivo:** Garantir que entendemos EXATAMENTE o que precisa ser feito.

Antes de qualquer coisa, responder:
1. **O que precisa ser feito?** (descrição clara)
2. **Como sabemos que está pronto?** (critérios de sucesso)
3. **O que NÃO pode quebrar?** (restrições)
4. **Qual o tamanho?** (ver Auto-Sizing abaixo)
5. **Qual template usar?** (MINIMAL / STANDARD / COMPLEX)

Se algo estiver indefinido:
```
❓ PRECISO CLARIFICAR ANTES DE CONTINUAR:
- [pergunta 1]
- [pergunta 2]
```

---

## FASE 2: RECON (Investigar) ⚠️ CRÍTICO

**Objetivo:** Identificar template de referência e copiar estrutura.

### ⚠️ ANTES DE CONTINUAR, RESPONDA:

```
CHECKLIST DE RECON
□ Qual domínio? [ex: products, tasks, bookings]
□ Qual camada? [user / administrator]
□ Qual template? [minimal / standard / complex]
□ Template existe? [verificar src/modules/template/]
□ Entidade existe no Prisma? [verificar prisma/schema/]
□ Entidade registrada em entities.config.ts? [verificar]
```

### Passo 1: Identificar Template

| Cenário | Template |
|---------|----------|
| CRUD simples | `minimal/` |
| Com hooks + custom endpoints | `standard/` |
| Com sub-serviços + lógica complexa | `complex/` |

### Passo 2: COPIAR ESTRUTURA (OBRIGATÓRIO)

```bash
# EXEMPLO: Gerar módulo "products" na camada "administrator" com template "standard"

# 1. COPIAR estrutura do template
cp -R src/modules/template/standard/administrator \
      src/modules/products/administrator

# 2. Renomear arquivos
mv administrator-example.module.ts administrator-product.module.ts
mv administrator-example.controller.ts administrator-product.controller.ts
mv administrator-example.service.ts administrator-product.service.ts
mv dto/create-example.dto.ts dto/create-product.dto.ts
mv dto/update-example.dto.ts dto/update-product.dto.ts

# 3. Substituir placeholders (ver COMO-USAR.md para ordem)
# AdministratorExample → AdministratorProduct
# Example → Product
# example → product
# admin/examples → admin/products
```

### Passo 3: Verificar Pattern Similar

```bash
# Se não existir template ou for diferente, verificar módulo similar
ls src/modules/template/standard/administrator/
```

**Output esperado:**
```
RECON COMPLETO
Template identificado: standard/administrator
Estrutura copiada para: src/modules/products/administrator/
Placeholder a substituir: Example → Product
```

---

## FASE 3: PLAN (Planejar)

**Objetivo:** Criar plano de execução antes de escrever código.

### Formato obrigatório:

```
═══════════════════════════════════════════════════════════════
PLANO DE EXECUÇÃO
═══════════════════════════════════════════════════════════════

Tarefa: [nome da tarefa]
Tamanho: [MICRO|PEQUENO|MÉDIO|GRANDE|COMPLEXO]
Template: [minimal|standard|complex]
Camada: [user|administrator]

Passos:
1. [ação específica] → verify: [como confirmar que funcionou]
2. [ação específica] → verify: [como confirmar que funcionou]

Decisões de Design:
  • [decisão] → razão: [por que escolheu assim]
```

---

## FASE 4: EXECUTE (Executar) ⚠️ CRÍTICO

**Objetivo:** Implementar o plano seguindo estrutura do template.

### ⚠️ REGRAS DE EXECUÇÃO:

**O que COPIAR do template:**
- ✅ Estrutura de arquivos
- ✅ Imports
- ✅ Decorators
- ✅ Nomenclatura
- ✅ Padrão de Service (estende UniversalService)
- ✅ Padrão de Controller (estende UniversalController)
- ✅ Padrão de Module (imports UniversalModule, NotificationModule)

**O que SUBSTITUIR:**
- 🔄 Nome da entidade (Example → Product)
- 🔄 Lógica de negócio específica
- 🔄 DTOs com campos específicos
- 🔄 setEntityConfig() com relacionamentos específicos

**O que NUNCA fazer:**
- ❌ Criar arquivos do zero (sem base no template)
- ❌ Usar imports diferentes do template
- ❌ Usar decorators diferentes do template
- ❌ Ignorar setEntityConfig()

### Checklist de Código:

```
ANTES de salvar qualquer arquivo, verificar:

□ Copiei estrutura do template? (não criei do zero)
□ Controller estende UniversalController?
□ Service estende UniversalService?
□ Module importa UniversalModule?
□ Service tem setEntityConfig()?
□ Service tem createEntityConfig()?
□ DTOs têm validações (class-validator)?
□ DTOs têm ApiProperty do Swagger?
□ Hooks implementados (antesDeCriar, etc.)?
```

---

## FASE 5: VERIFY (Verificar)

**Objetivo:** Confirmar que o plano foi cumprido.

### Verificações obrigatórias:

1. **Critérios do plano cumpridos?**
2. **Estrutura segue template?**
3. **Não quebrou nada existente?**

```bash
# Verificar estrutura
ls src/modules/[domain]/[camada]/

# Verificar imports
grep "extends UniversalService" src/modules/[domain]/[camada]/*.service.ts
grep "extends UniversalController" src/modules/[domain]/[camada]/*.controller.ts
```

---

## FASE 6: DEBRIEF (Aprender)

**Objetivo:** Capturar conhecimento para as próximas sessões.

### Quando é OBRIGATÓRIO:
- ✅ Nova pattern descoberta
- ✅ Armadilha encontrada
- ✅ Convenção não documentada

### Formato do Debrief:

```
═══════════════════════════════════════════════════════════════
DEBRIEF
═══════════════════════════════════════════════════════════════

Tarefa: [nome]
Resultado: [SUCESSO|PARCIAL|FALHA]

Descobertas:
* [descoberta] → salvar em: .ai/notebook/[arquivo].md
```

---

## 📏 Auto-Sizing (Classificação de Tarefa)

| Tamanho | Processo |
|---------|----------|
| **MICRO** | Briefing → Execute → Verify |
| **PEQUENO** | Briefing → Recon → Execute → Verify |
| **MÉDIO** | Full 6 fases |
| **GRANDE** | Full 6 fases + mais atenção ao Recon |
| **COMPLEXO** | Discuss → Spec → Full ciclo |

---

## ⚡ Regras de Ouro

1. **REGRA DE OURO #0:** NUNCA criar código do zero. SEMPRE copiar template.
2. **NUNCA pule fases** — Especialmente RECON (copy template).
3. **SE não souber, PERGUNTE** — Nunca assuma.
4. **SEMPRE faça debrief** — Se houver descoberta.
5. **SIGA conventions.md** — Consistência é produtividade.

---

## 🔗 Referências

| Tarefa | Referência |
|--------|-----------|
| Como copiar template | `src/modules/template/COMO-USAR.md` |
| Templates de código | `.ai/module-generator.md` |
| Convenções | `.ai/conventions.md` |
| Conhecimento acumulado | `.ai/notebook/` |

---

**Versão:** 2.0  
**LOBO CODE AI SOFTWARE FACTORY**