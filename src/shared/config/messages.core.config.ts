export const CORE_VALIDATION_MESSAGES = {
  REQUIRED: {
    FIELD: 'Campo é obrigatório',
    NAME: 'Nome é obrigatório',
    LOGIN: 'Login é obrigatório',
    EMAIL: 'Email é obrigatório',
    PASSWORD: 'Senha é obrigatória',
    ID: 'ID é obrigatório',
    ROLE: 'Role é obrigatória',
  },
  FORMAT: {
    EMAIL_INVALID: 'Email inválido',
    PASSWORD_WEAK:
      'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial',
    CPF_INVALID: 'CPF inválido',
    CNPJ_INVALID: 'CNPJ inválido',
    PHONE_INVALID: 'Telefone deve estar no formato brasileiro: (XX) XXXXX-XXXX',
    UUID_INVALID: 'ID inválido',
    FIELD_INVALID: 'Campo deve ser um texto',
    BOOLEAN_INVALID: 'Valor deve ser um booleano',
    ENUM_INVALID: 'Valor inválido para o enum',
    URL_INVALID: 'URL inválida',
    NUMBER_INVALID: 'Valor deve ser um número',
    DATE_INVALID: 'Data inválida',
    ARRAY_INVALID: 'Campo deve ser um array',
  },
  UNIQUENESS: {
    FIELD_EXISTS: 'Este valor já está cadastrado',
    EMAIL_EXISTS: 'Este email já está cadastrado no sistema',
    LOGIN_EXISTS: 'Este login já está cadastrado no sistema',
    CPF_EXISTS: 'Este CPF já está cadastrado no sistema',
    CNPJ_EXISTS: 'Este CNPJ/CPF já está cadastrado',
  },
  LENGTH: {
    MIN_LENGTH: 'Campo deve ter pelo menos {min} caracteres',
    NAME_MIN: 'Nome deve ter pelo menos 2 caracteres',
    LOGIN_MIN: 'Login deve ter pelo menos 3 caracteres',
    PASSWORD_MIN: 'Senha deve ter pelo menos 8 caracteres',
  },
} as const;

export const CORE_ERROR_MESSAGES = {
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
  AUTHORIZATION: {
    FORBIDDEN: 'Acesso negado',
    ROLE_REQUIRED: 'Role específica é necessária',
    RESOURCE_ACCESS_DENIED: 'Acesso negado para este recurso',
    COMPANY_ACCESS_DENIED: 'Acesso negado para esta empresa',
  },
  RESOURCE: {
    NOT_FOUND: 'Recurso não encontrado',
    ALREADY_EXISTS: 'Recurso já existe',
    DELETED: 'Recurso foi deletado',
    INACTIVE: 'Recurso está inativo',
    REQUIRED_FIELD: 'Campo obrigatório',
  },
  VALIDATION: {
    INVALID_DATA: 'Dados inválidos',
    MISSING_FIELDS: 'Campos obrigatórios não preenchidos',
    INVALID_FORMAT: 'Formato inválido',
  },
  BUSINESS: {
    USER_ALREADY_EXISTS: 'Usuário já existe',
    INVALID_OPERATION: 'Operação inválida',
    WORKFLOW_ERROR: 'Erro no fluxo de trabalho',
    EMAIL_IN_USE: 'Email já está em uso',
    CPF_IN_USE: 'CPF já está em uso',
  },
  SYSTEM: {
    INTERNAL_ERROR: 'Erro interno do servidor',
    DATABASE_ERROR: 'Erro no banco de dados',
    EXTERNAL_SERVICE_ERROR: 'Erro em serviço externo',
    TIMEOUT: 'Tempo limite excedido',
  },
} as const;
