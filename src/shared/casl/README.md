# 🔐 Módulo CASL Centralizado - Avançado

Este módulo centraliza todas as validações de permissão usando CASL, com recursos avançados para auditoria, contexto dinâmico e validação automática.

## 📁 Estrutura

```
src/shared/casl/
├── casl.module.ts                    # Módulo principal (Global)
├── casl.service.ts                   # Service genérico para validações
├── casl-ability/
│   └── casl-ability.service.ts       # Configuração das regras CASL
├── decorators/
│   └── casl.decorator.ts             # Decorators para validação automática
├── interceptors/
│   └── casl.interceptor.ts           # Interceptor automático
├── services/
│   ├── permission-context.service.ts # Validação contextual dinâmica
│   └── permission-audit.service.ts   # Auditoria e métricas
└── README.md                         # Esta documentação
```

## 🚀 Como Usar

### 1. **Validação Manual (Básica)**

```typescript
import { CaslService } from 'src/shared/casl/casl.service';

@Injectable()
export class SeuService {
  constructor(private caslService: CaslService) {}

  async criarPost(dto: CreatePostDto) {
    // ✅ Validação básica
    this.caslService.validarAction('create', 'Post');
    
    // Lógica de criação...
  }
}
```

### 2. **Validação Automática com Decorators**

```typescript
import { CaslCreate, CaslUpdate, CaslRead } from 'src/shared/casl/decorators/casl.decorator';
import { UseInterceptors } from '@nestjs/common';
import { CaslInterceptor } from 'src/shared/casl/interceptors/casl.interceptor';

@Controller('posts')
@UseInterceptors(CaslInterceptor)
export class PostController {
  
  @Post()
  @CaslCreate('Post')
  async criar(@Body() dto: CreatePostDto) {
    // ✅ Validação automática - não precisa chamar manualmente
    return this.postService.criar(dto);
  }

  @Patch(':id')
  @CaslUpdate('Post')
  async atualizar(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    // ✅ Validação automática
    return this.postService.atualizar(id, dto);
  }

  @Get()
  @CaslRead('Post')
  async listar() {
    // ✅ Validação automática
    return this.postService.buscarTodos();
  }
}
```

### 3. **Validação Contextual Dinâmica**

```typescript
import { PermissionContextService } from 'src/shared/casl/services/permission-context.service';

@Injectable()
export class PatrolService {
  constructor(private permissionContext: PermissionContextService) {}

  async iniciarRonda(user: User, postId: string) {
    // ✅ Criar contexto de permissão
    const context = this.permissionContext.criarContexto(user, {
      postId,
      isOnShift: true,
    });

    // ✅ Validação contextual
    const podeIniciar = this.permissionContext.validarPermissaoRonda(
      context,
      'create'
    );

    if (!podeIniciar) {
      throw new ForbiddenException('Não pode iniciar ronda');
    }

    // Lógica de início da ronda...
  }

  async registrarCheckpoint(user: User, roundId: string) {
    const context = this.permissionContext.criarContexto(user, {
      roundId,
      isOnShift: true,
      isOnPatrol: true,
    });

    // ✅ Validação específica para checkpoint
    const podeRegistrar = this.permissionContext.validarPermissaoContextual(
      context,
      {
        action: 'create',
        subject: 'PatrolPoint',
        shiftRestrictions: {
          requiresActiveShift: true,
          requiresActivePatrol: true,
        },
      }
    );

    // Lógica de registro...
  }
}
```

### 4. **Auditoria de Permissões**

```typescript
import { PermissionAuditService } from 'src/shared/casl/services/permission-audit.service';

@Injectable()
export class SecurityService {
  constructor(private auditService: PermissionAuditService) {}

  async acessarRecurso(user: User, action: string, subject: string) {
    // ✅ Validação com auditoria
    const podeAcessar = this.auditService.validarComAuditoria(
      user,
      action as any,
      subject,
      {
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        additionalContext: { endpoint: '/api/secure' },
      }
    );

    return podeAcessar;
  }

  async obterMetricas() {
    // ✅ Métricas de segurança
    const metricas = this.auditService.obterMetricas();
    
    console.log(`Taxa de sucesso: ${metricas.successRate}%`);
    console.log(`Ações mais negadas:`, metricas.mostDeniedActions);
    
    return metricas;
  }

  async exportarLogs() {
    // ✅ Exportar logs para análise
    const logsCSV = this.auditService.exportarLogs('csv');
    const logsJSON = this.auditService.exportarLogs('json');
    
    return { csv: logsCSV, json: logsJSON };
  }
}
```

## 🎯 Funcionalidades Avançadas

### **🔧 Decorators Disponíveis**

| Decorator | Descrição | Exemplo |
|-----------|-----------|---------|
| `@CaslAction(action, subject)` | Validação básica | `@CaslAction('create', 'User')` |
| `@CaslCreate(subject)` | Criação | `@CaslCreate('Post')` |
| `@CaslRead(subject)` | Leitura | `@CaslRead('Report')` |
| `@CaslUpdate(subject)` | Atualização | `@CaslUpdate('User')` |
| `@CaslDelete(subject)` | Exclusão | `@CaslDelete('Document')` |
| `@CaslFields(subject, fields)` | Campos específicos | `@CaslFields('User', ['name', 'email'])` |
| `@CaslRole(action, subject, roles)` | Roles específicos | `@CaslRole('create', 'User', ['ADMIN'])` |

### **📊 Validação Contextual**

O `PermissionContextService` permite validações baseadas em:

- **Turno ativo**: Usuário deve estar em turno
- **Ronda ativa**: Usuário deve estar em ronda
- **Horário**: Restrições por período do dia
- **Posto específico**: Validação por posto
- **Empresa**: Isolamento multi-tenant

### **🔍 Auditoria e Métricas**

O `PermissionAuditService` oferece:

- **Logs detalhados**: Todas as tentativas de acesso
- **Métricas em tempo real**: Taxa de sucesso, ações mais negadas
- **Filtros avançados**: Por usuário, role, empresa, período
- **Exportação**: CSV e JSON para análise
- **Limpeza automática**: Logs antigos removidos

## 🚀 Benefícios para Expansão

### **✅ Preparado para Fase 2 (Core do Negócio)**
- Validação de turnos e rondas
- Controle de acesso por posto
- Auditoria de operações críticas

### **✅ Preparado para Fase 3 (Comunicação)**
- Validação de botão de pânico
- Controle de notificações
- Auditoria de emergências

### **✅ Preparado para Fase 4 (Relatórios)**
- Métricas de segurança
- Logs para compliance
- Análise de padrões de acesso

### **✅ Preparado para Fase 5 (Multi-tenant)**
- Isolamento por empresa
- Métricas por tenant
- Auditoria granular

## 🔧 Configuração Avançada

### **Interceptor Global**

```typescript
// main.ts
import { CaslInterceptor } from 'src/shared/casl/interceptors/casl.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Aplicar interceptor globalmente
  app.useGlobalInterceptors(new CaslInterceptor(
    app.get(Reflector),
    app.get(CaslService)
  ));
  
  await app.listen(3000);
}
```

### **Validação Customizada**

```typescript
// Service customizado
@Injectable()
export class CustomPermissionService {
  constructor(
    private caslService: CaslService,
    private contextService: PermissionContextService,
    private auditService: PermissionAuditService,
  ) {}

  async validarOperacaoCritica(user: User, operacao: string) {
    const context = this.contextService.criarContexto(user);
    
    // Validação contextual
    const podeExecutar = this.contextService.validarPermissaoContextual(
      context,
      {
        action: 'create',
        subject: 'CriticalOperation',
        timeRestrictions: {
          startHour: 8,
          endHour: 18,
        },
        shiftRestrictions: {
          requiresActiveShift: true,
        },
      }
    );

    // Auditoria
    this.auditService.registrarTentativa(
      user,
      'create',
      'CriticalOperation',
      podeExecutar,
      { additionalContext: { operacao } }
    );

    return podeExecutar;
  }
}
```

## 📈 Monitoramento e Alertas

### **Métricas Importantes**

```typescript
// Dashboard de segurança
const metricas = await auditService.obterMetricas();

// Alertas automáticos
if (metricas.successRate < 95) {
  // Enviar alerta para administradores
  await notificationService.enviarAlerta('Taxa de sucesso baixa');
}

if (metricas.mostDeniedActions.length > 0) {
  // Analisar ações mais negadas
  console.log('Ações negadas:', metricas.mostDeniedActions);
}
```

### **Logs para Compliance**

```typescript
// Relatório de compliance
const logs = await auditService.obterLogs({
  inicio: new Date('2025-01-01'),
  fim: new Date('2025-12-31'),
  companyId: 'company-123',
});

const relatorio = {
  totalAcessos: logs.length,
  acessosNegados: logs.filter(l => !l.success).length,
  usuariosAtivos: new Set(logs.map(l => l.userId)).size,
  periodo: '2025',
};
```

## 🎯 Próximos Passos

1. **Implementar validações específicas** para cada módulo
2. **Configurar alertas automáticos** baseados em métricas
3. **Criar dashboards** de segurança
4. **Integrar com sistemas externos** de monitoramento
5. **Implementar cache** para otimizar performance

---

**💡 Dica**: Use os decorators para validação automática sempre que possível. Use validação contextual para operações críticas. Monitore as métricas regularmente para identificar padrões de segurança. 