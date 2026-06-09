# Template Baseline (Backend Lobocode)

Este documento registra o baseline técnico atual do backend antes da limpeza de domínio.

## Escopo do baseline

- Stack principal estabilizada em NestJS 11.x
- Dependências críticas instalando sem `--force` e sem `--legacy-peer-deps`
- Banco local validado com Docker (`PostgreSQL` + `Redis`)

## Versões NestJS validadas

- `@nestjs/core`: `11.1.19`
- `@nestjs/common`: `11.1.19`
- `@nestjs/platform-express`: `11.1.19`
- `@nestjs/websockets`: `11.1.19`
- `@nestjs/testing`: `11.1.19`
- `@nestjs/cli`: `11.0.19`
- `@nestjs/config`: `4.0.4`
- `@nestjs/jwt`: `11.0.2`
- `@nestjs/schedule`: `6.1.1`

## Validação mínima do baseline

Executar no diretório do projeto:

```bash
npm install
npm run build
```

Para ambiente local com banco:

```bash
./scripts/start-database.sh
npx prisma db push
npm run prisma:seed
```

## Observações de ambiente

- Não exportar `DATABASE_URL` manualmente no shell com parse parcial da `.env`.
- Priorizar leitura direta do `.env` pelo Prisma/Nest.
- Se necessário reset de ambiente Docker, remover/recriar volumes e rede do projeto.

## Próxima etapa (fora deste baseline)

- Limpeza gradual do domínio para transformar o repositório em template genérico.
