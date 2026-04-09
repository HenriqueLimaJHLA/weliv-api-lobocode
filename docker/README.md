# 🐳 Docker - Comandos e Configurações

## 📁 Estrutura Organizada

```
docker/
├── Dockerfile.dev                    # Desenvolvimento
├── Dockerfile.prod                   # Produção
├── docker-compose.yml               # Compose principal
├── docker-compose.dev.yml           # Desenvolvimento
├── docker-compose.prod.yml          # Produção
├── docker-compose.minio.yml         # MinIO
├── docker-compose.backend.yml       # Backend
├── docker-compose.database.yml      # Banco de dados
├── docker-compose.monitoring.yml    # Monitoramento
├── docker-compose.infrastructure.yml # Infraestrutura
├── docker-compose.unified.yml       # Todos os serviços
├── nginx.conf                       # Configuração Nginx
├── prometheus.yml                   # Configuração Prometheus
└── README.md                        # Esta documentação
```

## 🚀 Comandos de Desenvolvimento

### **Iniciar todos os serviços**
```bash
# Da raiz do projeto
docker compose -f docker/docker-compose.yml up -d

# Ou apenas MinIO
docker compose -f docker/docker-compose.minio.yml up -d
```

### **Iniciar serviços específicos**
```bash
# Backend + Banco
docker compose -f docker/docker-compose.yml up backend postgres redis -d

# Apenas MinIO
docker compose -f docker/docker-compose.yml up minio -d

# Backend + MinIO
docker compose -f docker/docker-compose.yml up backend minio -d
```

### **Parar serviços**
```bash
# Parar todos
docker compose -f docker/docker-compose.yml down

# Parar apenas MinIO
docker compose -f docker/docker-compose.yml stop minio
```

## 🏗️ Comandos de Build

### **Build de desenvolvimento**
```bash
# Build da imagem de desenvolvimento
docker build -f docker/Dockerfile.dev -t weliv-backend:dev .

# Build da imagem de produção
docker build -f docker/Dockerfile.prod -t weliv-backend:prod .
```

### **Build com compose**
```bash
# Build e iniciar
docker-compose -f docker/docker-compose.yml up --build -d

# Apenas build
docker-compose -f docker/docker-compose.yml build
```

## 📊 Monitoramento

### **Logs dos serviços**
```bash
# Logs de todos os serviços
docker-compose -f docker/docker-compose.yml logs -f

# Logs do backend
docker-compose -f docker/docker-compose.yml logs -f backend

# Logs do MinIO
docker-compose -f docker/docker-compose.yml logs -f minio
```

### **Status dos containers**
```bash
# Ver containers rodando
docker-compose -f docker/docker-compose.yml ps

# Ver recursos utilizados
docker stats
```

## 🔧 Comandos de Manutenção

### **Limpeza**
```bash
# Parar e remover containers
docker-compose -f docker/docker-compose.yml down

# Parar, remover containers e volumes
docker-compose -f docker/docker-compose.yml down -v

# Remover imagens não utilizadas
docker image prune -f

# Limpeza completa
docker system prune -a
```

### **Backup e Restore**
```bash
# Backup do banco
docker exec weliv-postgres pg_dump -U postgres weliv > backup.sql

# Restore do banco
docker exec -i weliv-postgres psql -U postgres weliv < backup.sql
```

## 🌐 Acessos

### **Serviços disponíveis**
- **Backend API**: http://localhost:30100 (weliv)
- **MinIO API**: http://localhost:19000
- **MinIO Console**: http://localhost:19001 (admin/password123)
- **PostgreSQL**: localhost:15432
- **Redis**: localhost:16379

### **Health Checks**
```bash
# Backend
curl http://localhost:30100/health

# MinIO
curl http://localhost:19000/minio/health/live
```

## 🚀 Deploy em Produção

### **Build para produção**
```bash
# Build da imagem de produção
docker build -f docker/Dockerfile.prod -t weliv-backend:latest .

# Deploy com compose de produção
docker-compose -f docker/docker-compose.prod.yml up -d
```

### **Variáveis de ambiente**
```bash
# Copiar .env.example
cp .env.example .env

# Editar variáveis
nano .env
```

## 📝 Scripts Úteis

### **Script de inicialização rápida**
```bash
#!/bin/bash
# start-dev.sh
echo "🚀 Iniciando ambiente de desenvolvimento..."
docker-compose -f docker/docker-compose.yml up -d
echo "✅ Ambiente iniciado!"
echo "📊 Backend: http://localhost:30100"
echo "📁 MinIO: http://localhost:19001"
```

### **Script de parada**
```bash
#!/bin/bash
# stop-dev.sh
echo "🛑 Parando ambiente..."
docker-compose -f docker/docker-compose.yml down
echo "✅ Ambiente parado!"
```

## 🎯 Boas Práticas

### ✅ **Organização**
- ✅ Todos os arquivos Docker na pasta `docker/`
- ✅ Separação por ambiente (dev/prod)
- ✅ Nomes descritivos para os arquivos
- ✅ Documentação clara

### ✅ **Segurança**
- ✅ Variáveis de ambiente para credenciais
- ✅ Volumes persistentes para dados
- ✅ Health checks configurados
- ✅ Limites de recursos definidos

### ✅ **Performance**
- ✅ Multi-stage builds para produção
- ✅ Cache de dependências
- ✅ Imagens otimizadas
- ✅ Recursos limitados

## 🔍 Troubleshooting

### **Problemas comuns**
```bash
# Porta já em uso
lsof -ti:30100 | xargs kill -9

# Container não inicia
docker-compose -f docker/docker-compose.yml logs [servico]

# Problemas de rede
docker network prune

# Limpar tudo
docker system prune -a --volumes
```

### **Logs detalhados**
```bash
# Ver logs com timestamps
docker-compose -f docker/docker-compose.yml logs -f --timestamps

# Logs dos últimos 100 eventos
docker-compose -f docker/docker-compose.yml logs --tail=100
```
