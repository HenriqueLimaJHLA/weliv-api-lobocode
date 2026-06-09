# 📚 Documentação - TemplateLobocode Engine

Bem-vindo à central de documentação do projeto TemplateLobocode Engine! Esta documentação fornece guias completos para desenvolvimento, manutenção e evolução do sistema.

---

## 🏗️ Arquitetura e Padrões

### **Padrões de Desenvolvimento**
- [📝 Padrões de Codificação](./CODING_STANDARDS.md) - Convenções gerais de código TypeScript/NestJS
- [🔤 Convenções de Nomenclatura](./NAMING_CONVENTIONS.md) - Padrões específicos de nomenclatura do projeto
- [🔄 Padrão CRUD Genérico](./padroes/crud-generic-pattern.md) - Padronização de métodos CRUD reutilizáveis

### **Estrutura do Projeto**
- [🗂️ Estrutura de Módulos](../README.md#-estrutura-do-projeto) - Organização dos módulos
- [📊 Arquitetura do Banco de Dados](../prisma/ARQUITETURA.md) - Schema e relacionamentos

---

## 🔐 Autenticação e Segurança

### **Sistema de Autenticação**
- [🔑 Módulo Auth](../src/shared/auth/README.md) - Autenticação JWT e autorização
- [🛡️ Sistema CASL](../src/shared/casl/README.md) - Controle de acesso baseado em roles
- [✅ Validadores Customizados](../src/shared/validators/README.md) - Validações reutilizáveis

### **Tratamento de Erros**
- [🚨 Sistema de Filtros](../src/shared/common/filters/README.md) - Filtros de exceção customizados
- [💬 Sistema de Mensagens](../src/shared/common/messages/README.md) - Mensagens centralizadas

---

## 📦 Módulos Principais

### **Gestão de Usuários**
- [👥 Módulo Users](../src/modules/users/services/README.md) - CRUD de usuários e gestão de roles

### **Gestão de Arquivos**
- [📁 Módulo Files](../src/shared/files/README.md) - Upload e gestão de arquivos (MinIO)

### **Notificações**
- [🔔 Módulo Notifications](../src/modules/notifications/README.md) - Sistema de notificações em tempo real
- [📋 Estrutura de Notificações](../src/modules/notifications/STRUCTURE.md) - Arquitetura do módulo

---

## 🚀 Infraestrutura e Deploy

### **Docker**
- [🐳 Docker](../docker/README.md) - Configuração, comandos e boas práticas

### **Deploy VPS**
- [🌐 VPS Multi-projeto](./VPS_MULTI_PROJECT.md) - Gateway compartilhado com Traefik e deploy por projeto

---

## 🗄️ Banco de Dados

### **Prisma ORM**
- [📊 Arquitetura do Banco](../prisma/ARQUITETURA.md) - Schema, relacionamentos e estratégias
- [🔄 Migrations](../migrations.md) - Guia de migrations e versionamento

### **Comandos Úteis**
```bash
# Gerar cliente Prisma
npm run prisma:generate

# Criar migration
npm run prisma:migrate nome-da-migration

# Abrir Prisma Studio
npm run prisma:studio

# Resetar banco
npm run db:reset
```

---

## 🧪 Desenvolvimento

### **Setup Inicial**
1. Instalar dependências: `npm install`
2. Configurar `.env` baseado em `.env.example`
3. Iniciar banco: `./scripts/deploy.sh database`
4. Executar migrations: `npm run db:init:dev`
5. Popular banco: `npm run prisma:seed`
6. Iniciar servidor: `npm run start:dev`

### **Comandos de Desenvolvimento**
```bash
# Desenvolvimento
npm run start:dev          # Servidor com hot reload
npm run start:debug         # Servidor com debug

# Banco de dados
npm run db:init:dev        # Inicializar banco (dev)
npm run prisma:seed        # Popular banco

# Qualidade de código
npm run lint               # Verificar código
npm run format             # Formatar código
npm run test               # Executar testes
npm run test:cov           # Testes com cobertura
```

---

## 📊 Monitoramento e Logs

### **Health Checks**
- Endpoint: `GET /health`
- Verifica conectividade com banco de dados e serviços externos

### **Logs**
- Logs estruturados com Winston
- Níveis: `error`, `warn`, `info`, `debug`
- Formato JSON para fácil parsing

### **Métricas**
- Prometheus (se configurado): `GET /metrics`
- Métricas customizadas de performance

---

## 🔍 Troubleshooting

### **Problemas Comuns**

#### **Erro de conexão com banco**
```bash
# Verificar se o banco está rodando
docker ps | grep postgres

# Verificar logs
docker logs template_lobocode-db
```

#### **Erro de migração**
```bash
# Resetar banco e aplicar migrations novamente
npm run db:reset
npm run db:init:dev
```

#### **Erro de autenticação**
- Verificar variáveis de ambiente: `JWT_SECRET`, `JWT_EXPIRES_IN`
- Verificar se o token está sendo enviado corretamente
- Consultar [documentação de autenticação](../src/shared/auth/README.md)

---

## 📖 Guias por Tarefa

### **Adicionar Novo Módulo**
1. Criar estrutura seguindo padrão existente
2. Implementar Repository, Service, Controller
3. Adicionar validações e filtros de erro
4. Documentar no README do módulo

### **Adicionar Novo Endpoint**
1. Criar DTOs de entrada/saída
2. Implementar método no Service
3. Adicionar rota no Controller
4. Adicionar validações e guards necessários
5. Documentar no Swagger

### **Configurar Novo Ambiente**
1. Copiar `.env.example` para `.env.[ambiente]`
2. Configurar variáveis específicas
3. Ajustar variáveis de ambiente e domínio (`APP_HOST`) conforme o ambiente

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação específica do módulo
2. Verifique os logs: `docker logs [container-name]`
3. Consulte os guias de troubleshooting

---

## 📅 Atualizações

- **Fevereiro 2025**: Limpeza e organização da documentação
- **Janeiro 2025**: Refatoração do sistema de autenticação
- **Dezembro 2024**: Implementação do sistema de arquivos

---

**💡 Dica**: Mantenha esta documentação sempre atualizada conforme o sistema evolui!
