# 🎯 COMO PEDIR PARA A IA CONSTRUIR UM MÓDULO

Este guia mostra como você (desenvolvedor humano) deve se comunicar com a IA para construir módulos no projeto.

---

## RESUMO RÁPIDO

```
1. Defina o escopo → 2. Faça a pergunta → 3. A IA constrói
```

---

## PASSO 1: DEFINIR O ESCOPO

Antes de chamar a IA, tenha clareza sobre o que quer:

### Template de Escopo (copie e preencha):

```yaml
Módulo: <nome>
Domínio: <ex: products, files, bookings>

Campos:
  - name: string (obrigatório)
  - email: string (único)
  - status: enum [DRAFT, ACTIVE, INACTIVE]

Recursos:
  - CRUD completo
  - Busca por código
  - Estatísticas

Camada:
  - administrator (gerenciar)
  - user (visualizar)
```

### Exemplos de Escopo:

**Simples:**
```
Quero criar um módulo de arquivos (files) para upload de imagens.
Campos: nome, tipo, tamanho, url.
Recursos: upload, delete, listar.
Camada: administrator.
```

**Completo:**
```
Módulo: Agendamentos (bookings)
Domínio: booking

Campos:
  - customerId: uuid (relacionamento)
  - serviceId: uuid (relacionamento)
  - date: datetime
  - status: enum [PENDING, CONFIRMED, CANCELLED]

Recursos:
  - CRUD completo
  - Busca por cliente
  - Estatísticas mensais
  - Notificação por email

Camada: administrator + user
```

---

## PASSO 2: FAZER A PERGUNTA

### Frase mágica (copie e adapte):

```
@.ai/SCOPE-MODULE-GUIDE.md

Construa o módulo seguindo o guia.
Escopo:
<cole seu escopo aqui>
```

### Exemplo completo:

```
@.ai/SCOPE-MODULE-GUIDE.md

Construa o módulo de arquivos (files) seguindo o guia.

Escopo:
- Domínio: files
- Entidade: File
- Camada: administrator

Campos:
  - originalName: string
  - type: enum [PROFILE_IMAGE, SERVICE_IMAGE, DOCUMENT, OTHER]
  - size: integer
  - mimeType: string
  - url: string
  - description: text (opcional)

Recursos:
  - Upload para MinIO
  - Delete (MinIO + banco)
  - Listar com paginação
  - Estatísticas por tipo
```

---

## PASSO 3: O QUE ACONTECE DEPOIS

A IA vai seguir estes passos:

```
1. Copiar template do src/modules/template/
2. Substituir placeholders
3. Atualizar Prisma schema
4. Registrar em entities.config.ts
5. Registrar em casl-role-permissions.config.ts
6. Importar em app.module.ts
7. Compilar e verificar
```

### Sua função depois:

- [ ] Verificar se compila: `npm run start:dev`
- [ ] Testar no Swagger: `http://localhost:3000/docs`
- [ ] Se der erro, colar o erro e pedir para corrigir

---

## COMANDOS ÚTEIS

### Para criar módulo do zero:
```
@.ai/SCOPE-MODULE-GUIDE.md
Crie o módulo <nome> seguindo o guia.
Escopo: <descrição>
```

### Para refatorar módulo existente:
```
@.ai/SCOPE-MODULE-GUIDE.md
Refatore o módulo <nome> para seguir o padrão Universal.
Problemas:
- <liste os problemas>
```

### Para adicionar feature:
```
@.ai/SCOPE-MODULE-GUIDE.md
Adicione ao módulo <nome>:
Feature: <descrição>
```

---

## REFERÊNCIAS

| Arquivo | Para que serve |
|---------|----------------|
| `.ai/execution-skill.md` | Regras que a IA segue |
| `.ai/conventions.md` | Convenções de código |
| `src/modules/template/COMO-USAR.md` | Como a IA copia templates |

---

**Versão:** 1.0  
**LOBO CODE AI SOFTWARE FACTORY**