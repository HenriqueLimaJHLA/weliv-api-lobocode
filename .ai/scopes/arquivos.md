# 📋 Especificação: Arquivos (Files)

## Entidade
- **Domínio:** files
- **Tabela Prisma:** `File`
- **Camada:** administrator

---

## Regras de Negócio

### Upload
- [ ] Apenas administradores podem fazer upload
- [ ] Tipos permitidos: imagens (jpg, png, gif, webp), documentos (pdf)
- [ ] Tamanho máximo: 10MB
- [ ] Armazenamento em MinIO/S3
- [ ] Gerar URL pública após upload

### Listagem
- [ ] Listar com paginação (20 por página)
- [ ] Filtrar por tipo
- [ ] Filtrar por uploader
- [ ] Busca por nome

### Exclusão
- [ ] Soft delete (marcando deletedAt)
- [ ] Excluir arquivo do MinIO ao deletar
- [ ] Apenas uploader ou admin pode excluir

---

## Campos (Prisma)

```prisma
model File {
  id String   @id @default(uuid())
  originalName  String
  storedName    String
  mimeType      String
  size          Int
  url           String
  type          FileType @default(OTHER)
  
  uploadedById  String
  uploadedBy     User     @relation(...)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
}

enum FileType {
  PROFILE_IMAGE
  SERVICE_IMAGE
  DOCUMENT
  OTHER
}
```

---

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/admin/files/upload` | Upload de arquivo |
| GET | `/admin/files` | Listar arquivos |
| GET | `/admin/files/:id` | Detalhes |
| DELETE | `/admin/files/:id` | Soft delete |
| POST | `/admin/files/:id/restore` | Restaurar |

---

## Validações

- Nome original: max 255 caracteres
- Tipo: enum válido
- Tamanho: <=10MB
- MimeType: permitir apenas tipos seguros

---

## Relacionamentos

- `File.uploadedBy` → `User`
- Usado por: Companies, Services, Users (profile picture)

---

## Status
- [x] Criado
- [ ] Implementado
- [ ] Testado
