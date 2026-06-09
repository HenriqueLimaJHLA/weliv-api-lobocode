// ============================================================================
// MENSAGENS CENTRALIZADAS - TEMPLATE BASE LOBOCODE
// ============================================================================

// ============================================================================
// MENSAGENS DE VALIDAÇÃO
// ============================================================================

export const VALIDATION_MESSAGES = {
  // Campos obrigatórios
  REQUIRED: {
    FIELD: 'Campo é obrigatório',
    NAME: 'Nome é obrigatório',
    LOGIN: 'Login é obrigatório',
    EMAIL: 'Email é obrigatório',
    PASSWORD: 'Senha é obrigatória',
    ID: 'ID é obrigatório',
    ROLE: 'Role é obrigatória',
    PLATE: 'Identificador é obrigatório',
    MODEL: 'Modelo é obrigatório',
    INITIAL_KM: 'Valor inicial é obrigatório',
    CURRENT_KM: 'Valor atual é obrigatório',
    FUEL_TYPE: 'Tipo é obrigatório',
    FUEL_QUANTITY: 'Quantidade é obrigatória',
    FUEL_PRICE: 'Valor é obrigatório',
  },

  // Validações de formato
  FORMAT: {
    EMAIL_INVALID: 'Email inválido',
    PASSWORD_WEAK: 'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial',
    CPF_INVALID: 'CPF inválido',
    CNPJ_INVALID: 'CNPJ inválido',
    PHONE_INVALID: 'Telefone deve estar no formato brasileiro: (XX) XXXXX-XXXX',
    UUID_INVALID: 'ID inválido',
    FIELD_INVALID: 'Campo deve ser um texto',
    BOOLEAN_INVALID: 'Valor deve ser um booleano',
    SLUG_INVALID: 'Slug pode conter apenas letras minúsculas, números e hífens',
    ENUM_INVALID: 'Valor inválido para o enum',
    URL_INVALID: 'URL inválida',
    NUMBER_INVALID: 'Valor deve ser um número',
    DATE_INVALID: 'Data inválida',
    ARRAY_INVALID: 'Campo deve ser um array',
  },

  // Validações de unicidade
  UNIQUENESS: {
    FIELD_EXISTS: 'Este valor já está cadastrado',
    EMAIL_EXISTS: 'Este email já está cadastrado no sistema',
    LOGIN_EXISTS: 'Este login já está cadastrado no sistema',
    CPF_EXISTS: 'Este CPF já está cadastrado no sistema',
    CNPJ_EXISTS: 'Este CNPJ/CPF já está cadastrado',
  },

  // Validações de tamanho
  LENGTH: {
    MIN_LENGTH: 'Campo deve ter pelo menos {min} caracteres',
    NAME_MIN: 'Nome deve ter pelo menos 2 caracteres',
    LOGIN_MIN: 'Login deve ter pelo menos 3 caracteres',
    PASSWORD_MIN: 'Senha deve ter pelo menos 8 caracteres',
  },

  // Validações específicas por role
  ROLE_SPECIFIC: {
    FIELD_REQUIRED_FOR_ROLE: 'Campo é obrigatório para este perfil',
    GUARD_CPF_REQUIRED: 'CPF é obrigatório para este perfil',
    RESIDENT_PHONE_REQUIRED: 'Telefone é obrigatório para este perfil',
    RESIDENT_APARTMENT_REQUIRED: 'Campo é obrigatório para este perfil',
  },
};

// ============================================================================
// MENSAGENS DE ERRO
// ============================================================================

export const ERROR_MESSAGES = {
  // Erros de autenticação
  AUTH: {
    UNAUTHORIZED: 'Usuário não autenticado',
    INVALID_CREDENTIALS: 'Credenciais inválidas',
    TOKEN_EXPIRED: 'Token expirado',
    TOKEN_INVALID: 'Token inválido',
    TOKEN_REQUIRED: 'Token é obrigatório',
    INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes',
    USER_NOT_FOUND: 'Usuário não encontrado',
    EMAIL_NOT_REGISTERED: 'Não existe cadastro com este e-mail no sistema.',
  },

  // Erros de autorização
  AUTHORIZATION: {
    FORBIDDEN: 'Acesso negado',
    ROLE_REQUIRED: 'Role específica é necessária',
    RESOURCE_ACCESS_DENIED: 'Acesso negado para este recurso',
    COMPANY_ACCESS_DENIED: 'Acesso negado para esta empresa',
    POST_ACCESS_DENIED: 'Acesso negado para este recurso',
  },

  // Erros de recursos
  RESOURCE: {
    NOT_FOUND: 'Recurso não encontrado',
    ALREADY_EXISTS: 'Recurso já existe',
    DELETED: 'Recurso foi deletado',
    INACTIVE: 'Recurso está inativo',
    REQUIRED_FIELD: 'Campo obrigatório',
  },

  NOT_FOUND: {
    USER: 'Usuário não encontrado',
    COMPANY: 'Empresa não encontrada',
    PET: 'Recurso não encontrado',
  },

  // Erros de validação
  VALIDATION: {
    INVALID_DATA: 'Dados inválidos',
    MISSING_FIELDS: 'Campos obrigatórios não preenchidos',
    INVALID_FORMAT: 'Formato inválido',
  },

  // Erros de negócio
  BUSINESS: {
    USER_ALREADY_EXISTS: 'Usuário já existe',
    INVALID_OPERATION: 'Operação inválida',
    WORKFLOW_ERROR: 'Erro no fluxo de trabalho',
    EMAIL_IN_USE: 'Email já está em uso',
    CPF_IN_USE: 'CPF já está em uso',
  },

  // Erros de sistema
  SYSTEM: {
    INTERNAL_ERROR: 'Erro interno do servidor',
    DATABASE_ERROR: 'Erro no banco de dados',
    EXTERNAL_SERVICE_ERROR: 'Erro em serviço externo',
    TIMEOUT: 'Tempo limite excedido',
  },
};

// ============================================================================
// MENSAGENS DE SUCESSO
// ============================================================================

export const SUCCESS_MESSAGES = {
  // Operações CRUD
  CRUD: {
    CREATED: 'Recurso criado com sucesso',
    UPDATED: 'Recurso atualizado com sucesso',
    DELETED: 'Recurso deletado com sucesso',
    RESTORED: 'Recurso restaurado com sucesso',
    LISTED: 'Recursos listados com sucesso',
    FOUND: 'Recurso encontrado com sucesso',
  },

  // Operações por entidade
  CREATE: {
    USER: 'Usuário criado com sucesso',
    COMPANY: 'Empresa criada com sucesso',
    PET: 'Recurso criado com sucesso',
  },

  UPDATE: {
    USER: 'Usuário atualizado com sucesso',
    COMPANY: 'Empresa atualizada com sucesso',
    PET: 'Recurso atualizado com sucesso',
  },

  DELETE: {
    USER: 'Usuário deletado com sucesso',
    COMPANY: 'Empresa deletada com sucesso',
    PET: 'Recurso deletado com sucesso',
  },

  // Operações específicas
  OPERATIONS: {
    LOGIN_SUCCESS: 'Login realizado com sucesso',
    LOGOUT_SUCCESS: 'Logout realizado com sucesso',
    PASSWORD_CHANGED: 'Senha alterada com sucesso',
    EMAIL_SENT: 'Email enviado com sucesso',
    FILE_UPLOADED: 'Arquivo enviado com sucesso',
    BACKUP_CREATED: 'Backup criado com sucesso',
  },

  // Validações
  VALIDATION: {
    DATA_VALID: 'Dados válidos',
    OPERATION_ALLOWED: 'Operação permitida',
    ACCESS_GRANTED: 'Acesso concedido',
  },
};

// ============================================================================
// MENSAGENS DE LOG
// ============================================================================

export const LOG_MESSAGES = {
  // Logs de autenticação
  AUTH: {
    AUTH_ATTEMPT: 'Tentativa de autenticação',
    AUTH_SUCCESS: 'Autenticação bem-sucedida',
    AUTH_FAILED: 'Autenticação falhou',
    LOGOUT: 'Logout realizado',
    PASSWORD_CHANGE: 'Senha alterada',
    TOKEN_REFRESH: 'Token renovado',
  },

  // Logs de operações
  OPERATIONS: {
    CREATE: 'Recurso criado',
    UPDATE: 'Recurso atualizado',
    DELETE: 'Recurso deletado',
    SOFT_DELETE: 'Recurso marcado como deletado',
    RESTORE: 'Recurso restaurado',
    ACCESS: 'Acesso ao recurso',
  },

  // Logs de sistema
  SYSTEM: {
    STARTUP: 'Sistema iniciado',
    SHUTDOWN: 'Sistema finalizado',
    HEALTH_CHECK: 'Verificação de saúde',
    BACKUP: 'Backup realizado',
    MAINTENANCE: 'Manutenção iniciada',
  },

  // Logs de segurança
  SECURITY: {
    UNAUTHORIZED_ACCESS: 'Tentativa de acesso não autorizado',
    RATE_LIMIT_EXCEEDED: 'Limite de taxa excedido',
    SUSPICIOUS_ACTIVITY: 'Atividade suspeita detectada',
    PERMISSION_DENIED: 'Permissão negada',
  },
};

// ============================================================================
// MENSAGENS DE NOTIFICAÇÃO
// ============================================================================

export const NOTIFICATION_MESSAGES = {
  // Notificações de usuário
  USER: {
    WELCOME: 'Bem-vindo(a) à plataforma!',
    ACCOUNT_CREATED: 'Conta criada com sucesso',
    PROFILE_UPDATED: 'Perfil atualizado',
    PASSWORD_RESET: 'Redefinição de senha solicitada',
    ACCOUNT_LOCKED: 'Conta bloqueada por segurança',
  },

  // Notificações de sistema
  SYSTEM: {
    MAINTENANCE_SCHEDULED: 'Manutenção programada',
    SYSTEM_UPDATE: 'Atualização do sistema',
    BACKUP_COMPLETED: 'Backup concluído',
    ERROR_DETECTED: 'Erro detectado no sistema',
  },

  // Notificações de negócio
  BUSINESS: {
    NEW_ROUND_ASSIGNED: 'Nova tarefa atribuída',
    INCIDENT_REPORTED: 'Incidente reportado',
    SHIFT_CHANGED: 'Turno alterado',
    SUPERVISOR_NOTIFIED: 'Supervisor notificado',
  },
};

// ============================================================================
// MENSAGENS DE API
// ============================================================================

export const API_MESSAGES = {
  // Respostas padrão
  RESPONSES: {
    OK: 'Operação realizada com sucesso',
    CREATED: 'Recurso criado com sucesso',
    NO_CONTENT: 'Nenhum conteúdo',
    BAD_REQUEST: 'Requisição inválida',
    UNAUTHORIZED: 'Não autorizado',
    FORBIDDEN: 'Acesso negado',
    NOT_FOUND: 'Recurso não encontrado',
    CONFLICT: 'Conflito de dados',
    INTERNAL_ERROR: 'Erro interno do servidor',
  },

  // Headers
  HEADERS: {
    RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
    RATE_LIMIT_RESET: 'X-RateLimit-Reset',
    TOTAL_COUNT: 'X-Total-Count',
    PAGE_COUNT: 'X-Page-Count',
  },
};

// ============================================================================
// MENSAGENS DE AMBIENTE
// ============================================================================

export const ENVIRONMENT_MESSAGES = {
  DEVELOPMENT: {
    DEBUG_MODE: 'Modo debug ativado',
    HOT_RELOAD: 'Hot reload ativo',
    MOCK_DATA: 'Usando dados simulados',
  },

  PRODUCTION: {
    SECURITY_MODE: 'Modo de segurança ativo',
    PERFORMANCE_MODE: 'Modo de performance ativo',
    MONITORING_ACTIVE: 'Monitoramento ativo',
  },

  TEST: {
    TEST_MODE: 'Modo de teste ativo',
    MOCK_SERVICES: 'Serviços simulados ativos',
  },
};

// ============================================================================
// MENSAGENS DE MÉTRICAS
// ============================================================================

export const METRICS_MESSAGES = {
  PERFORMANCE: {
    SLOW_REQUEST: 'Requisição lenta detectada',
    HIGH_MEMORY_USAGE: 'Alto uso de memória',
    HIGH_CPU_USAGE: 'Alto uso de CPU',
    DATABASE_SLOW: 'Consulta lenta no banco',
  },

  BUSINESS: {
    HIGH_USER_ACTIVITY: 'Alta atividade de usuários',
    MANY_INCIDENTS: 'Muitos incidentes reportados',
    LOW_ROUND_COMPLETION: 'Baixa taxa de conclusão de tarefas',
  },
};

// ============================================================================
// EXPORTAÇÃO UNIFICADA
// ============================================================================

export const MESSAGES = {
  VALIDATION: VALIDATION_MESSAGES,
  ERROR: ERROR_MESSAGES,
  SUCCESS: SUCCESS_MESSAGES,
  LOG: LOG_MESSAGES,
  NOTIFICATION: NOTIFICATION_MESSAGES,
  API: API_MESSAGES,
  ENVIRONMENT: ENVIRONMENT_MESSAGES,
  METRICS: METRICS_MESSAGES,
};

export default MESSAGES; 