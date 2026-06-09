# 📋 Padrão CRUD Genérico

## 🎯 Objetivo

Padronizar os nomes dos métodos CRUD em todos os módulos do projeto para melhorar a consistência, reutilização e manutenibilidade do código.

## 📦 Nomes Padronizados

### **Métodos CRUD Básicos**

| Ação | Nome do Método | Descrição |
|------|----------------|-----------|
| **Listar** | `buscarTodos(page?, limit?)` | Lista todos os registros com paginação |
| **Buscar por ID** | `buscarPorId(id)` | Busca um registro específico pelo ID |
| **Criar** | `criar(dto)` | Cria um novo registro |
| **Atualizar** | `atualizar(id, dto)` | Atualiza um registro existente |
| **Desativar** | `desativar(id)` | Soft delete - marca como excluído |
| **Reativar** | `reativar(id)` | Restaura um registro soft deleted |
| **Deletar** | `deletar(id)` | Hard delete - exclusão permanente |

### **Métodos Específicos (Manter como estão)**

Métodos que buscam por campos específicos devem manter seus nomes descritivos:

```typescript
// ✅ Manter nomes específicos
buscarPorEmail(email: string)
buscarPorCPF(cpf: string)
buscarPorCompany(companyId: string)
buscarPorPost(postId: string)
```

## 🏗️ Estrutura de Implementação

### **1. Base Service (Abstrato/Genérico)**

```typescript
@Injectable()
export abstract class BaseEntityService<T> {
  // Métodos CRUD genéricos
  async buscarTodos(page = 1, limit = 20) { /* ... */ }
  async buscarPorId(id: string) { /* ... */ }
  async criar(dto: CreateDto) { /* ... */ }
  async atualizar(id: string, dto: UpdateDto) { /* ... */ }
  async desativar(id: string) { /* ... */ }
  async reativar(id: string) { /* ... */ }
  async deletar(id: string) { /* ... */ }
}
```

### **2. Repository (Genérico)**

```typescript
@Injectable()
export class EntityRepository {
  // Métodos CRUD genéricos
  async buscarMuitos(where, options?) { /* ... */ }
  async buscarPrimeiro(where) { /* ... */ }
  async buscarUnico(where) { /* ... */ }
  async criar(data) { /* ... */ }
  async atualizar(where, data) { /* ... */ }
  async deletar(where) { /* ... */ }
  async contar(where) { /* ... */ }
}
```

### **3. Controller (Genérico)**

```typescript
@Controller('entities')
export class EntityController {
  @Get()
  buscarTodos(@Query('page') page, @Query('limit') limit) { /* ... */ }
  
  @Get(':id')
  buscarPorId(@Param('id') id) { /* ... */ }
  
  @Post()
  criar(@Body() dto) { /* ... */ }
  
  @Patch(':id')
  atualizar(@Param('id') id, @Body() dto) { /* ... */ }
  
  @Delete(':id')
  desativar(@Param('id') id) { /* ... */ }
  
  @Post(':id/restore')
  reativar(@Param('id') id) { /* ... */ }
}
```

## 🔧 Tipos Centralizados

### **Ações CRUD**

```typescript
// src/shared/common/types/crud-actions.type.ts
export type CrudAction = 'read' | 'create' | 'update' | 'delete';
export type ExtendedCrudAction = CrudAction | 'manage' | 'restore';
```

### **Uso nos Serviços**

```typescript
import { CrudAction } from '../../../shared/common/types';

private validarPermissaoParaAction(action: CrudAction) {
  // Implementação
}
```

## 📋 Exemplo de Implementação Completa

### **UserService (Exemplo Real)**

```typescript
@Injectable()
export class UserService extends BaseUserService {
  // Métodos CRUD genéricos herdados
  async buscarTodos(page = 1, limit = 20) { /* ... */ }
  async buscarPorId(id: string) { /* ... */ }
  async criar(dto: CreateUserDto) { /* ... */ }
  async atualizar(id: string, dto: UpdateUserDto) { /* ... */ }
  async desativar(id: string) { /* ... */ }
  async reativar(id: string) { /* ... */ }
  
  // Métodos específicos mantidos
  async buscarPorEmail(email: string) { /* ... */ }
  async buscarPorCompany(companyId: string) { /* ... */ }
  async buscarPorPost(postId: string) { /* ... */ }
}
```

## 🎯 Benefícios

1. **Consistência**: Todos os módulos seguem o mesmo padrão
2. **Reutilização**: Fácil aplicação em novos módulos
3. **Manutenibilidade**: Mudanças centralizadas
4. **Legibilidade**: Nomes claros e intuitivos
5. **Escalabilidade**: Padrão preparado para crescimento

## 📝 Regras de Aplicação

### **✅ O que fazer:**
- Usar nomes genéricos para operações CRUD básicas
- Manter nomes específicos para buscas por campos
- Centralizar tipos de ação CRUD
- Documentar exceções ao padrão

### **❌ O que evitar:**
- Nomes em inglês para métodos públicos
- Nomes muito específicos para operações genéricas
- Duplicação de tipos de ação CRUD
- Mistura de padrões em um mesmo módulo

## 🔄 Processo de Aplicação

1. **Identificar** métodos CRUD no módulo
2. **Renomear** para nomes genéricos
3. **Atualizar** todas as chamadas
4. **Testar** build e funcionalidades
5. **Documentar** exceções específicas

## 📚 Referências

- [Padrão Repository](https://martinfowler.com/eaaCatalog/repository.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [NestJS Best Practices](https://docs.nestjs.com/guides/providers) 