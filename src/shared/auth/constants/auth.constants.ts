// ============================================================================
// CONSTANTES DO MÓDULO DE AUTENTICAÇÃO
// ============================================================================

export const AUTH_CONSTANTS = {
  // Configurações de token
  TOKEN: {
    TYPE: 'Bearer',
    ACCESS_EXPIRES_IN: '2h',
    REFRESH_EXPIRES_IN: '7d',
    RESET_PASSWORD_EXPIRES_IN: '1h',
  },

  // Configurações de rate limiting
  RATE_LIMIT: {
    LOGIN_MAX_ATTEMPTS: 100,
    LOGIN_WINDOW_MS: 5 * 60 * 1000, // 15 minutos
    REFRESH_MAX_ATTEMPTS: 100,
    REFRESH_WINDOW_MS: 5 * 60 * 1000, // 15 minutos
  },  

  // Configurações de segurança
  SECURITY: {
    PASSWORD_MIN_LENGTH: 8,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
    MAX_SESSIONS_PER_USER: 5,
  },

  // Headers
  HEADERS: {
    AUTHORIZATION: 'Authorization',
    REFRESH_TOKEN: 'X-Refresh-Token',
  },

  // Cookies
  COOKIES: {
    REFRESH_TOKEN: 'refresh_token',
    ACCESS_TOKEN: 'access_token',
  },
};

// ============================================================================
// MENSAGENS ESPECÍFICAS DE AUTENTICAÇÃO
// ============================================================================

export const AUTH_MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login realizado com sucesso',
    LOGOUT: 'Logout realizado com sucesso',
    REFRESH: 'Token renovado com sucesso',
    PASSWORD_RESET_REQUESTED: 'Email de recuperação enviado',
    PASSWORD_RESET_SUCCESS: 'Senha alterada com sucesso',
  },

  ERROR: {
    INVALID_CREDENTIALS: 'Email ou senha inválidos',
    TOKEN_EXPIRED: 'Token expirado. Faça login novamente',
    TOKEN_INVALID: 'Token inválido',
    REFRESH_TOKEN_INVALID: 'Refresh token inválido',
    REFRESH_TOKEN_EXPIRED: 'Refresh token expirado',
    USER_NOT_FOUND: 'Usuário não encontrado',
    USER_INACTIVE: 'Usuário inativo',
    TOO_MANY_ATTEMPTS: 'Muitas tentativas. Tente novamente em alguns minutos',
    EMAIL_NOT_FOUND: 'Email não encontrado no sistema',
    RESET_TOKEN_INVALID: 'Token de recuperação inválido',
    RESET_TOKEN_EXPIRED: 'Token de recuperação expirado',
    PASSWORDS_DONT_MATCH: 'As senhas não coincidem',
  },

  VALIDATION: {
    EMAIL_REQUIRED: 'Email é obrigatório',
    PASSWORD_REQUIRED: 'Senha é obrigatória',
    TOKEN_REQUIRED: 'Token é obrigatório',
    REFRESH_TOKEN_REQUIRED: 'Refresh token é obrigatório',
  },
};

// Password Reset
export const PASSWORD_RESET_EXPIRATION = 3600; // 1 hora em segundos
export const PASSWORD_RESET_PREFIX = 'password_reset'; 