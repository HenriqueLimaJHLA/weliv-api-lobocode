# 📓 LOBO CODE Intelligence Notebook

## Propósito
Acumular inteligência do projeto ao longo do tempo. Cada sessão adiciona conhecimento que beneficia as próximas.

## Estrutura
```
.ai/notebook/
├── INDEX.md           ← Este arquivo (índice)
├── patterns.md        ← Patterns descobertos no código
├── gotchas.md         ← Armadilhas e como evitá-las
└── [tema]-notes.md    ← Notas sobredomínio específico
```

## Formato de Entrada

### Para patterns.md:
```markdown
## [Nome do Pattern]

**Contexto:** Quando usar este pattern
**Solução:** O que fazer
**Exemplo:**
```typescript
// código de exemplo
```

**Referência:** `src/modules/.../file.ts:linha`
```

### Para gotchas.md:
```markdown
## [Nome da Armadilha]

**Problema:** O que pode dar errado
**Consequência:** Impacto se acontecer
**Solução:** Como evitar/sanar
**Referência:** `src/.../file.ts:linha`
```

### Para notas temáticas:
```markdown
# [Tópico]

**Criado em:** YYYY-MM-DD
**Última atualização:** YYYY-MM-DD

## Context
[contexto de quando/por que foi criado]

## Conteúdo
[conhecimento acumulado]
```

## Índice de Conhecimento

| Data | Tipo | Tópico | Arquivo |
|------|------|--------|---------|
| - | - | - | - |

## Guidelines

1. **Adicionar APENAS conhecimento confirmado** (não hipóteses)
2. **Incluir referência** ao arquivo/código original
3. **Atualizar este INDEX** quando adicionar novos arquivos
4. **Revisar mensalmente** para limpar desatualizado
5. **Uma entrada por seção** — não misturar tópicos

## Como Usar

1. **Durante tarefa:** Verificar se já existe conhecimento relevante
   ```
   cat .ai/notebook/INDEX.md
   grep -r "termo" .ai/notebook/
   ```

2. **Após tarefa:** Se descobriu algo novo, documentar
   ```
   1. Identificar tipo (pattern, gotcha, nota)
   2. Criar/atualizar arquivo apropriado
   3. Atualizar INDEX.md
   ```

3. **Ao iniciar sessão:** Consultar notebook primeiro
   ```
   Briefing → Verificar .ai/notebook/ → Continuar tarefa
   ```

---

**Versão:** 1.0  
**LOBO CODE AI SOFTWARE FACTORY**