# 📂 Escopos de Módulos

Este diretório contém as **especificações de regras de negócio** de cada módulo/entidade do sistema.

---

## Estrutura

```
.ai/scopes/
├── README.md           # Este arquivo
├── arquivos.md         # Files (upload, storage)
├── empresas.md         # Companies
├── usuarios.md         # Users
├── configuracoes.md # Settings
└── notificacoes.md     # Notifications
```

---

## Como usar

###1. Antes de criar/modificar módulo
Leia o arquivo de escopo correspondente para entender as regras.

### 2. Ao criar novo módulo
Crie um arquivo `scopes/<nome>.md` seguindo o template:

```markdown
# 📋 Especificação: <Nome do Módulo>

## Entidade
- **Domínio:** <domain>
- **Tabela Prisma:** <Model>
- **Camadas:** administrator, user

---

## Regras de Negócio
- [ ] Regra 1
- [ ] Regra 2

---

## Campos (Prisma)
```prisma
model<Model> {
  id  String @id @default(uuid())
  // ...
}
```

---

## Endpoints
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/admin/...` | Listar |

---

## Status
- [ ] Criado
- [ ] Implementado
- [ ] Testado
```

### 3. Ao pedir para a IA criar módulo
```
@.ai/SCOPE-MODULE-GUIDE.md
@.ai/scopes/<nome>.md

Construa o módulo seguindo o escopo.
```

---

## Manutenção

- [ ] Atualize o status quando implementar
- [ ] Adicione novas regras ao longo do desenvolvimento
- [ ] Documente exceções e casos especiais

---

**Versão:** 1.0  
**LOBO CODE AI SOFTWARE FACTORY**
