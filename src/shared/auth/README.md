# Módulo de Autenticação (Auth)

Módulo completo de autenticação com JWT, refresh tokens, rate limiting e recuperação de senha.

## 🏗️ Arquitetura

### Estrutura de Diretórios
```
src/shared/auth/
├── constants/
│   └── auth.constants.ts      # Constantes do módulo
├── dto/
│   ├── auth.dto.ts           # DTOs de autenticação
│   ├── password-reset.dto.ts # DTOs de reset de senha
│   └── index.ts              # Exportações
├── guards/
│   ├── auth.guard.ts         # Guard de autenticação
│   ├── refresh.guard.ts      # Guard de refresh token
│   └── rate-limit.guard.ts   # Guard de rate limiting
├── interceptors/
│   └── auth.interceptor.ts   # Interceptor de autenticação
├── decorators/
│   ├── public.decorator.ts   # Decorator @Public
│   ├── current-user.decorator.ts # Decorator @CurrentUser
│   └── require-roles.decorator.ts # Decorator @RequireRoles
├── services/
│   ├── auth.service.ts       # Serviço principal de auth (orquestrador)
│   ├── login.service.ts      # Serviço especializado de login
│   ├── refresh-token.service.ts # Serviço de refresh tokens
│   ├── password.service.ts   # Serviço de senhas
│   ├── session.service.ts    # Serviço de sessões
│   ├── password-reset.service.ts # Serviço de reset de senha
│   └── email.service.ts      # Serviço de emails
├── validators/
│   └── auth.validator.ts     # Validações centralizadas
├── auth.controller.ts        # Controller principal
├── auth.module.ts           # Módulo principal
└── README.md               # Esta documentação
```

## 🔧 Funcionalidades

### 1. Autenticação JWT
- **Login**: Autenticação com email/senha
- **Refresh Token**: Renovação automática de tokens
- **Logout**: Invalidação de tokens
- **Logout All**: Invalidação de todas as sessões

### 2. Segurança
- **Rate Limiting**: Proteção contra ataques de força bruta
- **Password Hashing**: Senhas criptografadas com bcrypt
- **Token Expiration**: Tokens com expiração configurável
- **Stateless JWT**: Sem persistência de estado no servidor
- **Exceções Customizadas**: Tratamento específico de erros de autenticação

### 3. Arquitetura Refatorada (Seguindo Padrão SOLID)
- **AuthService**: Orquestrador principal
- **LoginService**: Especializado em lógica de login
- **AuthValidator**: Validações centralizadas
- **MessagesService**: Mensagens padronizadas
- **Filtros Específicos**: Tratamento de erros por tipo

### 4. Recuperação de Senha
- **Request Reset**: Solicita reset via email
- **Token Validation**: Validação de tokens de reset
- **Password Reset**: Reset de senha com token
- **Email Notifications**: Notificações por email

## 🏗️ **Arquitetura Refatorada Detalhada**

### **Antes vs Depois**

#### **❌ Antes da Refatoração**
- Controller com try/catch manuais
- Mensagens hardcoded
- Lógica misturada no AuthService
- Exceções genéricas (HttpException)

#### **✅ Depois da Refatoração**
- Controller limpo sem try/catch
- Mensagens centralizadas via MessagesService
- Responsabilidades separadas
- Exceções específicas customizadas

### **Novos Componentes**

#### **AuthValidator**
```typescript
@Injectable()
export class AuthValidator {
  validateLoginCredentials(email: string, password: string): void {
    if (!email || !password) {
      throw new UnauthorizedError(
        this.messagesService.getErrorMessage('AUTH', 'INVALID_CREDENTIALS')
      );
    }
  }

  validateUserStatus(user: any): void {
    if (!user) {
      throw new UnauthorizedError(
        this.messagesService.getErrorMessage('AUTH', 'USER_NOT_FOUND')
      );
    }
  }
}
```

#### **LoginService**
```typescript
@Injectable()
export class LoginService {
  async processLogin(email: string, password: string): Promise<LoginResponse> {
    // Validações específicas
    this.authValidator.validateLoginCredentials(email, password);
    
    // Lógica de login especializada
    const user = await this.findUserByEmail(email);
    this.authValidator.validateUserStatus(user);
    
    // Geração de tokens
    return this.generateTokens(user);
  }
}
```

#### **Integração com Sistema de Mensagens**
```typescript
// auth.constants.ts
export const AUTH_MESSAGES = {
  ERROR: {
    INVALID_CREDENTIALS: 'Email ou senha inválidos',
    TOKEN_EXPIRED: 'Token expirado. Faça login novamente',
    TOKEN_INVALID: 'Token inválido',
    USER_NOT_FOUND: 'Usuário não encontrado',
  },
  VALIDATION: {
    TOKEN_REQUIRED: 'Token é obrigatório',
    EMAIL_REQUIRED: 'Email é obrigatório',
    PASSWORD_REQUIRED: 'Senha é obrigatória',
  },
};

// Uso nos services
throw new UnauthorizedError(AUTH_MESSAGES.ERROR.INVALID_CREDENTIALS);
```

#### **Exceções Customizadas**
```typescript
// errors.ts
export class TokenExpiredError extends Error {
  constructor(message: string = AUTH_MESSAGES.ERROR.TOKEN_EXPIRED) {
    super(message);
  }
}

export class TokenInvalidError extends Error {
  constructor(message: string = AUTH_MESSAGES.ERROR.TOKEN_INVALID) {
    super(message);
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super(AUTH_MESSAGES.ERROR.INVALID_CREDENTIALS);
  }
}
```

### **Benefícios da Refatoração**

#### **1. Separação de Responsabilidades**
- `AuthService`: Orquestração geral
- `LoginService`: Lógica específica de login
- `AuthValidator`: Validações centralizadas
- `RefreshTokenService`: Gerenciamento de refresh tokens
- `PasswordResetService`: Recuperação de senha

#### **2. Tratamento de Erros Melhorado**
- Exceções específicas por tipo de erro
- Mensagens padronizadas
- Filtros automáticos para cada tipo
- Detecção automática de erros de token

#### **3. Manutenibilidade**
- Código mais limpo e legível
- Fácil adição de novas funcionalidades
- Testes mais específicos
- Documentação atualizada

#### **4. Consistência**
- Padrão único em toda aplicação
- Mensagens centralizadas
- Estrutura modular
- Princípios SOLID aplicados

### 5. Decorators e Guards
- **@Public()**: Endpoints públicos
- **@CurrentUser()**: Usuário atual
- **@RequireRoles()**: Validação de roles
- **AuthGuard**: Proteção de rotas
- **RefreshGuard**: Validação de refresh tokens

## 🚀 Endpoints

### Autenticação
```http
POST /auth/login
POST /auth/refresh
POST /auth/logout
POST /auth/logout-all
```

### Reset de Senha
```http
POST /auth/forgot-password
POST /auth/validate-reset-token
POST /auth/reset-password
```

## 📝 Exemplos de Uso

### Login
```typescript
const loginData = {
  email: 'user@example.com',
  password: 'password123'
};

const response = await authService.login(loginData);
// Retorna: { accessToken, refreshToken, user }
```

### Refresh Token
```typescript
const refreshData = {
  refreshToken: 'jwt_refresh_token'
};

const response = await authService.refresh(refreshData.refreshToken);
// Retorna: { accessToken, refreshToken }
```

### Reset de Senha
```typescript
// 1. Solicitar reset
await authService.requestPasswordReset({ email: 'user@example.com' });

// 2. Validar token (opcional)
const isValid = await authService.validateResetToken({ token: 'reset_token' });

// 3. Resetar senha
await authService.resetPassword({ 
  token: 'reset_token', 
  newPassword: 'newPassword123' 
});
```

### Proteção de Rotas
```typescript
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  
  @Get('profile')
  @CurrentUser()
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Post('admin-only')
  @RequireRoles(Roles.ADMIN)
  adminAction() {
    return 'Admin action';
  }

  @Get('public')
  @Public()
  publicEndpoint() {
    return 'Public endpoint';
  }
}
```

## ⚙️ Configuração

### Variáveis de Ambiente
```env
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Configuração do App Module
O `ConfigModule` deve estar configurado no `app.module.ts` para carregar as variáveis de ambiente:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // ... outros módulos
  ],
})
export class AppModule {}
```

### Rate Limiting
```typescript
// Configuração padrão
{
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por window
  message: 'Too many requests'
}
```

## 🔒 Segurança

### Tokens JWT
- **Access Token**: 15 minutos (configurável)
- **Refresh Token**: 7 dias (configurável)
- **Reset Token**: 1 hora (fixo)

### Validação de Senha
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

### Rate Limiting
- Proteção contra ataques de força bruta
- Limite configurável por endpoint
- Bloqueio temporário de IPs suspeitos

## 📧 Email Service

O `EmailService` está preparado para integração com serviços de email:

### Serviços Suportados
- SendGrid
- AWS SES
- Nodemailer
- Mailgun

### Templates de Email
- Reset de senha
- Confirmação de mudança de senha
- Boas-vindas
- Notificação de login suspeito

## 🧪 Testes

### Estrutura de Testes
```
src/shared/auth/
├── __tests__/
│   ├── auth.service.spec.ts
│   ├── password-reset.service.spec.ts
│   ├── auth.guard.spec.ts
│   └── auth.controller.spec.ts
```

### Cobertura
- Autenticação
- Refresh tokens
- Reset de senha
- Validações
- Guards e decorators

## 🔧 Troubleshooting

### Erro: "secretOrPrivateKey must have a value"
**Causa**: O `JWT_SECRET` não está sendo carregado das variáveis de ambiente.

**Solução**:
1. Verifique se o `ConfigModule` está configurado no `app.module.ts`
2. Confirme que o arquivo `.env` existe e contém `JWT_SECRET`
3. Reinicie o servidor após alterações no `.env`

### Erro: "401 Unauthorized" no Login
**Causa**: Problemas na geração do token JWT.

**Solução**:
1. Verifique se o usuário existe e a senha está correta
2. Confirme que o `JWT_SECRET` está definido
3. Verifique os logs do servidor para detalhes do erro

### Erro: "Rate limit exceeded"
**Causa**: Muitas tentativas de login em pouco tempo.

**Solução**:
1. Aguarde o período de bloqueio (15 minutos por padrão)
2. Use um IP diferente se necessário
3. Ajuste os limites no `RateLimitGuard` se necessário

## 🔄 Próximos Passos

### Funcionalidades Futuras
1. **Autenticação Multi-Fator (MFA)**
2. **OAuth2/OpenID Connect**
3. **Auditoria de Login**
4. **Blacklist de Tokens**
5. **Integração com LDAP/Active Directory**

### Melhorias de Segurança
1. **Detecção de Login Suspeito**
2. **Geolocalização de Logins**
3. **Notificações de Segurança**
4. **Política de Senhas Avançada**

## 📚 Referências

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [JWT.io](https://jwt.io/)
- [bcrypt](https://github.com/dcodeIO/bcrypt.js)
- [Rate Limiting](https://docs.nestjs.com/security/rate-limiting) 