# Traefik (gateway da VPS)

Configuração **separada** do app — não misture com o `.env` da API na raiz.

| Arquivo | Uso |
|---------|-----|
| `.env.gateway.example` | Copiar para `.env.gateway` → `./scripts/deploy.sh vps-gateway`. **Uma vez por VPS.** |
| `.env.traefik-file-provider.example` | Alternativa com `traefik.yml` estático; copiar para `.env.traefik-file-provider`. Não use dois Traefik na mesma porta 80/443. |
| `docker-compose.vps-gateway.yml` | Traefik HTTP-01 (Docker provider) |
| `docker-compose.traefik-file-provider.yml` | Traefik com config em arquivo |
| `traefik-file-provider/traefik.yml` | Config estática (só modo file-provider) |

Arquivos `.env.gateway` e `.env.traefik-file-provider` (sem `.example`) não são versionados.

No `.env` da API (raiz), **`TRAEFIK_NETWORK`** e **`TRAEFIK_CERT_RESOLVER`** devem coincidir com o gateway.

Fluxo típico: `traefik/.env.gateway` → `./scripts/deploy.sh vps-gateway` → `./scripts/deploy.sh database` → `./scripts/deploy.sh vps-app`.
