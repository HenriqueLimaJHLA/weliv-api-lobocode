# 🎯 LOBO CODE AI SOFTWARE FACTORY v3.0

**Fábrica de Software com IA** - Do Escopo ao Código em Dois Estágios

---

## 🔄 Fluxo em Dois Estágios

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                 ║
║  🎯 "scope:generate" ║
║       ↓ ║
║  ┌─────────────────────────────────────────────────────────────────────┐   ║
║  │  ESTÁGIO 1: ESCOPO (DOCUMENTO)                                        │   ║
║  │                                                                      │   ║
║  │  1. Identificação do domínio                                         │ ║
║  │  2. Entidade e campos                                                 │   ║
║  │  3. Relacionamentos                                                  │   ║
║  │  4. Regras de negócio │   ║
║  │  5. Fluxo de status                                                  │   ║
║  │  6. Funcionalidades                                                  │   ║
║  │  7. Módulos relacionados (a criar vs existentes)                     │   ║
║  │                                                                      │   ║
║  │ 📝 Gera: [domain]-escopo.md + [domain]-modulos-relacionados.md     │ ║
║  └─────────────────────────────────────────────────────────────────────┘   ║
║       ↓                                                                     ║
║  👀 REVISÃO E APROVAÇÃO DO ESCOPO                                          ║
║       ↓                                                                     ║
║  ┌─────────────────────────────────────────────────────────────────────┐   ║
║  │  ESTÁGIO 2: GERADOR (CÓDIGO)                                         │   ║
║  │                                                                      │   ║
║  │  1. Gerar módulos na ordem correta │   ║
║  │  2. Executar migrations                                              │   ║
║  │  3. Registrar em entities.config.ts                                 │   ║
║  │  4. Configurar CASL                                                 │   ║
║  │  5. Testar endpoints                                                │   ║
║  │                                                                      │   ║
║  │  💾 Gera: Schema + DTOs + Service + Controller + Module              │   ║
║  └─────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎮 Como Usar

### Opção 1: Diálogo Completo (Recomendado)

```
Você: "scope:generate"

AI: "Olá! Vamos criar um novo módulo.
     
     1. Qual é o nome do domínio?
2. O que este módulo vai gerenciar?"

Você: "Preciso de um sistema de agendamento de consultas médicas"

AI: "Ótimo! Para estruturar bem, preciso entender algumas coisas:

     **PARTICIPANTES:**
     - Quem é o paciente? (usuário existente ou criar Patient?)
     - Quem é o médico? (usuário existente ou criar Doctor?)
     - Tem especialidade? (sim/não)

     **CONSULTA:**
     - Precisa de duração fixa? (30min, 1h?)
     - Quais status? (SCHEDULED, CONFIRMED, etc.)
     - Precisa controlar pagamento?

     **REGRAS:**
     - Pode cancelar? Com antecedência mínima?
     - Notificar paciente/médico?
     - Horário do médico importa?"

[Conversa continua até ter todas as informações]
[AI gera os documentos de escopo]
[Você revisa e aprova]
[AI gera o código]
```

### Opção 2: Descrição Direta

```
Você: "Gere escopo para Appointments com:
       - patientId, doctorId, specialtyId (relacionamentos)
       - date, duration, status (enum)
       - rules: data futura, horário disponível
       - features: CRUD, confirm, cancel, stats
       - modules: patients, doctors, specialties"

AI: [Gera escopo completo + módulos relacionados]
```

### Opção 3: Template Pronto

```
Você: "scope:use booking"

AI: [Gera escopo usando template de agendamento]
```

---

## 📁 Estrutura de Arquivos

```
specs/
├── escopos/                           # Documentos de escopo
│   ├── [domain]-escopo.md            # Escopo principal
│   └── [domain]-modulos-relacionados.md # Módulos a criar
│
└── [domain].yaml                      # Spec para gerador (futuro)
```

### Documento de Escopo: `[domain]-escopo.md`

Contém:
1. **Identificação** - Domínio, entidade, descrição
2. **Entidade Principal** - Campos, enums, relacionamentos
3. **Regras de Negócio** - Validações, restrições, automatizações
4. **Fluxo de Status** - Diagrama de transições
5. **Funcionalidades** - CRUD, endpoints customizados, notificações
6. **Módulos Relacionados** - Existentes vs a criar
7. **Interfaces (UI)** - Wireframes básicos
8. **Pendências** - Dúvidas a resolver
9. **Aprovação** - Assinaturas

### Documento de Módulos: `[domain]-modulos-relacionados.md`

Contém:
1. **Resumo** - Lista de módulos com status e prioridade
2. **Specs** - YAML de cada módulo a criar
3. **Diagrama** - Dependências entre módulos
4. **Ordem** - Sequência de implementação

---

## 📦 Templates Base

| Template | Descrição | Uso |
|----------|-----------|-----|
| `company` | Multi-tenancy | Sempre (primeiro) |
| `user` | Usuários | Sempre |
| `booking` | Agendamento genérico | Agendamentos, reservas |
| `patient` | Paciente médico | Sistema de saúde |
| `doctor` | Profissional médico | Sistema de saúde |

---

## 🚀 Comandos

```bash
# Iniciar geração de escopo (diálogo)
scope:generate

# Gerar escopo direto
scope:generate --domain appointments

# Listar templates disponíveis
scope:list

# Usar template
scope:use booking

# Revisar escopo
scope:review --domain appointments

# Gerar código a partir do escopo
scope:build --domain appointments

# Gerar todos os módulos relacionados
scope:build:all --domain appointments
```

---

## 📋 Estágios Detalhados

### ESTÁGIO 1: ESCOPO

```
1. IDENTIFICAÇÃO
   domain, entity, descrição

2. ENTIDADE
   campos, tipos, validações
   enums
   relacionamentos

3. REGRAS DE NEGÓCIO
   validações (V1, V2, ...)
   restrições (R1, R2, ...)
   automatizações (A1, A2, ...)
   campos calculados

4. FLUXO DE STATUS
   diagrama de transições
   transições permitidas

5. FUNCIONALIDADES
   CRUD
   endpoints customizados
   notificações

6. MÓDULOS RELACIONADOS
   existentes (✅)
   a criar (🔨)
   ordem de criação

7. UI (opcional)
   wireframes básicos
```

### ESTÁGIO 2: GERADOR

```
1. ORDEM DE CRIAÇÃO
   especialidades primeiro
   depois entidades base
   por último entidade principal

2. PARA CADA MÓDULO
   gerar schema Prisma
   gerar DTOs
   gerar Service
   gerar Controller
   gerar Module
   registrar

3. VALIDAÇÃO
   executar migrations
   testar endpoints
   verificar integrações
```

---

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| `.ai/README.md` | Este arquivo |
| `.ai/scope-generator.md` | Fluxo conversacional completo |
| `.ai/module-generator.md` | Como gerar módulos |
| `.ai/database-generator.md` | Como gerar schemas Prisma |
| `.ai/conventions.md` | Convenções de código |
| `.ai/audit.md` | Padrões do projeto |
| `CLAUDE.md` | Regras para IA |

---

## ✅ Saída do Scope Generator

### Estágio 1: Escopo

```
📄 specs/escopos/
├── appointments-escopo.md              ← Documento principal
└── appointments-modulos-relacionados.md ← Módulos a criar
```

### Estágio 2: Código

```
📂 src/modules/
├── specialties/
├── patients/
├── doctors/
└── appointments/

📂 prisma/schema/
├── specialties.prisma
├── patients.prisma
├── doctors.prisma
└── appointments.prisma

✅ Registration:
- entities.config.ts (atualizado)
- casl-role-permissions.config.ts (atualizado)
- app.module.ts (atualizado)

✅ Migrations:
- npx prisma migrate dev --name "add-specialties"
- npx prisma migrate dev --name "add-patients"
- npx prisma migrate dev --name "add-doctors"
- npx prisma migrate dev --name "add-appointments"
```

---

**Versão:** 3.0  
**LOBO CODE AI SOFTWARE FACTORY**