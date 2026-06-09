## Problema de schema desatualizado

Quando o código possui campos/modelos novos e o banco ainda não foi sincronizado, erros de coluna inexistente podem ocorrer.

### Situação típica
- Código atualizado
- Banco desatualizado
- Necessidade de sincronizar **sem perder dados**

## Solução segura (preservando dados)

### 1) Fazer backup do banco (obrigatório)
```bash
docker exec <db-container> pg_dump -U <db-user> <db-name> > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2) Verificar status das migrações
```bash
docker exec <app-container> npx prisma migrate status
```

### 3) Aplicar migrações pendentes
```bash
docker exec <app-container> npx prisma migrate deploy
```

### 4) Se não houver migrações pendentes, sincronizar schema atual
```bash
docker exec <app-container> npx prisma db push
```

## Sequência recomendada de execução

### 1. Backup primeiro
```bash
docker exec <db-container> pg_dump -U <db-user> <db-name> > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Verificar migrações
```bash
docker exec <app-container> npx prisma migrate status
```

### 3. Aplicar migrações de forma segura
```bash
# Se houver migrações pendentes
docker exec <app-container> npx prisma migrate deploy

# Se não houver migrações, sincronizar schema
docker exec <app-container> npx prisma db push
```

### 4. Validar resultado
```bash
docker exec <app-container> npx prisma db pull
```

## Por que essa abordagem é segura

- `migrate deploy`: aplica apenas migrações existentes, preservando dados
- `db push`: sincroniza schema sem resetar o banco
- backup prévio: permite rollback manual em caso de incidente
- `migrate reset`: **não usar em ambiente com dados importantes**