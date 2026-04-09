# Portas do projeto weliv

Portas em **bloco alto** (15xxx–19xxx, 30xxx, 42xxx) para **não conflitar** com vários projetos na mesma máquina.

| Serviço        | Porta no host (weliv) | Porta padrão (ex.: outros projetos) |
|----------------|---------------------------|--------------------------------------|
| Backend API    | **30100**                 | 3000                                 |
| Frontend       | **42100**                 | 4200                                 |
| PostgreSQL     | **15432**                 | 5432                                 |
| Redis          | **16379**                 | 6379                                 |
| MinIO API      | **19000**                 | 9000                                 |
| MinIO Console  | **19001**                 | 9001                                 |
| Grafana        | **30101**                 | 3001                                 |
| Prometheus     | **19090**                 | 9090                                 |
| Nginx HTTP     | **18080**                 | 80                                   |
| Nginx HTTPS    | **18443**                 | 443                                   |

## Acesso rápido

- Backend: http://localhost:30100  
- Health: http://localhost:30100/health  
- Frontend (se exposto): http://localhost:42100  
- MinIO Console: http://localhost:19001  
- Grafana: http://localhost:30101  
- Prometheus: http://localhost:19090  

Dentro da rede Docker, os containers continuam se comunicando pelas portas internas (ex.: `db:5432`, `backend:3000`).
