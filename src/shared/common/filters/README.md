# Sistema de Filtros de Exceção HTTP

## 📋 **Visão Geral**

Sistema completo de filtros para padronizar respostas de erro HTTP, com detecção automática de erros de autenticação, mensagens centralizadas e arquitetura modular.

## 🏗️ **Arquitetura do Sistema**

### **Estrutura Hierárquica**
```
src/shared/common/filters/
├── base-exception.filter.ts        # Filtro base com funcionalidades comuns
├── http-exception.filter.ts        # Filtro genérico para HttpException
├── auth-error.filter.ts           # Filtro específico para erros de auth
├── validation-error.filter.ts     # Filtro para erros de validação
├── not-found-error.filter.ts      # Filtro para erros 404
├── conflict-error.filter.ts       # Filtro para erros de conflito
├── forbidden-error.filter.ts      # Filtro para erros de acesso negado
├── unauthorized-error.filter.ts   # Filtro para erros não autorizados
├── invalid-credentials-error.filter.ts # Filtro para credenciais inválidas
├── index.ts                        # Exportações
└── README.md                       # Esta documentação
```

### **BaseExceptionFilter - Funcionalidades Centrais**

#### **1. Detecção Automática de Erros de Token**
```typescript
protected detectTokenError(exception: any): { isTokenError: boolean; errorCode: string } {
  if (exception instanceof UnauthorizedException) {
    const message = exception.message;
    
    // Detecção baseada em mensagens do AUTH_MESSAGES
    if (message === AUTH_MESSAGES.ERROR.TOKEN_INVALID) {
      return { isTokenError: true, errorCode: 'TOKEN_INVALID' };
    }
    
    if (message === AUTH_MESSAGES.ERROR.TOKEN_EXPIRED) {
      return { isTokenError: true, errorCode: 'TOKEN_EXPIRED' };
    }
    
    if (message === AUTH_MESSAGES.VALIDATION.TOKEN_REQUIRED) {
      return { isTokenError: true, errorCode: 'TOKEN_REQUIRED' };
    }
    
    if (message === AUTH_MESSAGES.ERROR.USER_NOT_FOUND) {
      return { isTokenError: true, errorCode: 'USER_NOT_FOUND' };
    }
  }
  
  return { isTokenError: false, errorCode: 'UNKNOWN_ERROR' };
}
```

#### **2. Resposta Padronizada**
```typescript
protected sendErrorResponse(
  exception: any,
  host: ArgumentsHost,
  status: HttpStatus,
  errorCode: string,
  message: string,
) {
  // Log interno para debug
  this.logger.error(
    `HTTP ${status} Error: ${exception.message || message}`,
    exception.stack,
    `${request.method} ${request.url}`,
  );

  // Resposta minimalista para cliente
  const errorResponse = {
    error: errorCode,
    message: exception.message || message,
  };

  response.status(status).json(errorResponse);
}
```

## 🔧 **Filtros Específicos**

### **HttpExceptionFilter - Filtro Principal**

Filtro global que trata todas as `HttpException` com detecção automática de erros de token:

```typescript
catch(exception: HttpException, host: ArgumentsHost) {
  const status = exception.getStatus();
  const message = exception.message;

  // Detecção automática de erros de token
  const tokenError = this.detectTokenError(exception);
  if (tokenError.isTokenError) {
    this.sendErrorResponse(
      exception,
      host,
      status,
      tokenError.errorCode,
      message,
    );
    return;
  }

  // Tratamento de outros erros HTTP...
}
```

### **Filtros Específicos por Tipo de Erro**

#### **1. ValidationErrorFilter**
```typescript
@Catch(ValidationError)
export class ValidationErrorFilter extends BaseExceptionFilter {
  catch(exception: ValidationError, host: ArgumentsHost) {
    this.sendErrorResponse(
      exception,
      host,
      HttpStatus.BAD_REQUEST,
      'BAD_REQUEST',
      this.messagesService.getErrorMessage('VALIDATION', 'INVALID_DATA'),
    );
  }
}
```

#### **2. UnauthorizedErrorFilter**
```typescript
@Catch(UnauthorizedError)
export class UnauthorizedErrorFilter extends BaseExceptionFilter {
  catch(exception: UnauthorizedError, host: ArgumentsHost) {
    this.sendErrorResponse(
      exception,
      host,
      HttpStatus.UNAUTHORIZED,
      'UNAUTHORIZED',
      this.messagesService.getErrorMessage('AUTH', 'UNAUTHORIZED'),
    );
  }
}
```

#### **3. InvalidCredentialsErrorFilter**
```typescript
@Catch(InvalidCredentialsError)
export class InvalidCredentialsErrorFilter extends BaseExceptionFilter {
  catch(exception: InvalidCredentialsError, host: ArgumentsHost) {
    this.sendErrorResponse(
      exception,
      host,
      HttpStatus.UNAUTHORIZED,
      'INVALID_CREDENTIALS',
      this.messagesService.getErrorMessage('AUTH', 'INVALID_CREDENTIALS'),
    );
  }
}
```

## 🎯 **Formato de Resposta Padronizado**

### **Resposta Minimalista (Padrão de Mercado)**
```json
{
  "error": "TOKEN_INVALID",
  "message": "Token inválido"
}
```

### **Outros Exemplos**
```json
{
  "error": "FORBIDDEN",
  "message": "Acesso negado"
}
```

```json
{
  "error": "BAD_REQUEST",
  "message": "Dados inválidos"
}
```

```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Credenciais inválidas"
}
```

## 📊 **Códigos de Erro Completos**

| Status | Código | Mensagem | Filtro Responsável |
|--------|--------|----------|-------------------|
| 400 | `BAD_REQUEST` | Dados inválidos | ValidationErrorFilter |
| 401 | `UNAUTHORIZED` | Usuário não autenticado | UnauthorizedErrorFilter |
| 401 | `INVALID_CREDENTIALS` | Credenciais inválidas | InvalidCredentialsErrorFilter |
| 401 | `TOKEN_INVALID` | Token inválido | HttpExceptionFilter (auto-detectado) |
| 401 | `TOKEN_EXPIRED` | Token expirado | HttpExceptionFilter (auto-detectado) |
| 401 | `TOKEN_REQUIRED` | Token é obrigatório | HttpExceptionFilter (auto-detectado) |
| 401 | `USER_NOT_FOUND` | Usuário não encontrado | HttpExceptionFilter (auto-detectado) |
| 403 | `FORBIDDEN` | Acesso negado | ForbiddenErrorFilter |
| 404 | `NOT_FOUND` | Recurso não encontrado | NotFoundErrorFilter |
| 409 | `CONFLICT` | Conflito de dados | ConflictErrorFilter |
| 429 | `RATE_LIMIT_EXCEEDED` | Limite excedido | HttpExceptionFilter |
| 500 | `INTERNAL_SERVER_ERROR` | Erro interno | HttpExceptionFilter |

## 🔗 **Integração com Sistema de Mensagens**

### **MessagesService Integration**
```typescript
export class BaseExceptionFilter {
  constructor(protected readonly messagesService: MessagesService) {}

  // Exemplo de uso
  catch(exception: ValidationError, host: ArgumentsHost) {
    this.sendErrorResponse(
      exception,
      host,
      HttpStatus.BAD_REQUEST,
      'BAD_REQUEST',
      this.messagesService.getErrorMessage('VALIDATION', 'INVALID_DATA'),
    );
  }
}
```

### **Mensagens Padronizadas**
```typescript
// Uso das constantes do AUTH_MESSAGES
import { AUTH_MESSAGES } from 'src/shared/auth/constants';

if (message === AUTH_MESSAGES.ERROR.TOKEN_INVALID) {
  return { isTokenError: true, errorCode: 'TOKEN_INVALID' };
}
```

## 🌐 **Tratamento no Frontend**

### **Angular HttpInterceptor**
```typescript
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorCode = error.error?.error;
        
        switch (errorCode) {
          case 'TOKEN_INVALID':
          case 'TOKEN_EXPIRED':
            this.authService.logout();
            this.router.navigate(['/login']);
            break;
          case 'TOKEN_REQUIRED':
            this.router.navigate(['/login']);
            break;
          case 'INVALID_CREDENTIALS':
            this.showError('Email ou senha inválidos');
            break;
          case 'FORBIDDEN':
            this.router.navigate(['/access-denied']);
            break;
          default:
            this.showError(error.error?.message || 'Erro desconhecido');
        }
        
        return throwError(error);
      })
    );
  }
}
```

### **React Axios Interceptor**
```typescript
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorCode = error.response?.data?.error;
    
    switch (errorCode) {
      case 'TOKEN_INVALID':
      case 'TOKEN_EXPIRED':
        authService.logout();
        window.location.href = '/login';
        break;
      case 'TOKEN_REQUIRED':
        window.location.href = '/login';
        break;
      case 'INVALID_CREDENTIALS':
        toast.error('Email ou senha inválidos');
        break;
      case 'FORBIDDEN':
        window.location.href = '/access-denied';
        break;
      default:
        toast.error(error.response?.data?.message || 'Erro desconhecido');
    }
    
    return Promise.reject(error);
  }
);
```

## ⚙️ **Configuração no App Module**

```typescript
// app.module.ts
@Module({
  // ... outros providers
  providers: [
    // Filtros específicos (ordem importa!)
    {
      provide: APP_FILTER,
      useClass: ForbiddenErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: NotFoundErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ConflictErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: UnauthorizedErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: InvalidCredentialsErrorFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AuthErrorFilter,
    },
    // Filtro genérico (deve vir por último)
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

## 📈 **Logs e Monitoramento**

### **Logs Estruturados**
```typescript
// Exemplo de log gerado pelo BaseExceptionFilter
[BaseExceptionFilter] HTTP 401 Error: Token inválido
    at AuthGuard.validateAndDecodeToken (...)
    at AuthGuard.canActivate (...)
    GET /users
```

### **Informações de Debug**
- **Desenvolvimento**: Stack traces completos nos logs
- **Produção**: Apenas mensagens amigáveis ao cliente
- **Contexto**: Método HTTP, URL, timestamp

## 🔐 **Segurança**

### **Princípios Aplicados**
- ✅ **Não exposição de stack traces** em produção
- ✅ **Mensagens técnicas** traduzidas para mensagens amigáveis
- ✅ **Detalhes internos** apenas em logs de desenvolvimento
- ✅ **Códigos de erro** específicos para diferentes cenários
- ✅ **Padronização** das respostas para evitar information leakage

### **Detecção Automática**
- ✅ **Erros de token** detectados automaticamente
- ✅ **Mensagens padronizadas** via AUTH_MESSAGES
- ✅ **Filtros específicos** para cada tipo de erro
- ✅ **Fallback** para erros não mapeados

## 🚀 **Benefícios do Sistema**

### **Para Desenvolvedores**
- **Padronização**: Respostas consistentes
- **Manutenibilidade**: Fácil adição de novos tipos de erro
- **Debugabilidade**: Logs detalhados para desenvolvimento
- **Reutilização**: BaseExceptionFilter compartilha lógica comum

### **Para Frontend**
- **Previsibilidade**: Formato de resposta sempre igual
- **Tratamento**: Códigos de erro específicos para cada cenário
- **UX**: Mensagens amigáveis ao usuário
- **Automação**: Interceptors podem tratar erros automaticamente

### **Para Segurança**
- **Ocultação**: Stack traces não expostos
- **Padronização**: Evita information leakage
- **Monitoramento**: Logs estruturados para auditoria
- **Controle**: Filtros específicos para cada tipo de erro

## 🔧 **Extensibilidade**

### **Adicionando Novos Filtros**
1. Crie a classe estendendo `BaseExceptionFilter`
2. Implemente o método `catch()`
3. Registre no `app.module.ts`
4. Documente na tabela de códigos de erro

### **Exemplo de Novo Filtro**
```typescript
@Catch(CustomError)
export class CustomErrorFilter extends BaseExceptionFilter {
  catch(exception: CustomError, host: ArgumentsHost) {
    this.sendErrorResponse(
      exception,
      host,
      HttpStatus.BAD_REQUEST,
      'CUSTOM_ERROR',
      this.messagesService.getErrorMessage('CUSTOM', 'CUSTOM_MESSAGE'),
    );
  }
}
```

## 📚 **Documentação Relacionada**

- [Sistema de Mensagens Centralizadas](../messages/README.md)
- [Módulo de Autenticação](../../auth/README.md)
- [Exceções Customizadas](../errors.ts)
- [Tratamento de Erros no Frontend](../../../../docs/frontend-error-handling.md) 