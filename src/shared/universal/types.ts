// ============================================================================
// 🏷️ TIPOS DE ENTIDADES
// ============================================================================

export type EntityNameModel =
  | 'user'
  | 'company'
  | 'companyUnit'
  | 'specialty'
  | 'service'
  | 'appointment'
  | 'waitingListEntry'
  | 'professionalBlockedTime'
  | 'scheduleReminder'
  | 'payment'
  | 'charge'
  | 'medicalRecord'
  | 'document'
  | 'notification'
  | 'auditLog'

export type EntityNameCasl =
  | 'User'
  | 'Company'
  | 'CompanyUnit'
  | 'Specialty'
  | 'Service'
  | 'Appointment'
  | 'WaitingListEntry'
  | 'ProfessionalBlockedTime'
  | 'ScheduleReminder'
  | 'Payment'
  | 'Charge'
  | 'MedicalRecord'
  | 'Document'
  | 'Notification'
  | 'AuditLog'

// ============================================================================
// 🔄 MAPEAMENTO AUTOMÁTICO MODEL ↔ CASL
// ============================================================================

/**
 * Mapeamento entre nomes de entidade do Prisma (model) e CASL (permissions)
 */
export const ENTITY_MAPPING = {
  user: 'User',
  company: 'Company',
  companyUnit: 'CompanyUnit',
  specialty: 'Specialty',
  service: 'Service',
  appointment: 'Appointment',
  waitingListEntry: 'WaitingListEntry',
  professionalBlockedTime: 'ProfessionalBlockedTime',
  scheduleReminder: 'ScheduleReminder',
  payment: 'Payment',
  charge: 'Charge',
  medicalRecord: 'MedicalRecord',
  document: 'Document',
  notification: 'Notification',
  auditLog: 'AuditLog',
} as const;

/**
 * Mapeamento reverso CASL → Model
 */
export const CASL_TO_MODEL_MAPPING = {
  User: 'user',
  Company: 'company',
  CompanyUnit: 'companyUnit',
  Specialty: 'specialty',
  Service: 'service',
  Appointment: 'appointment',
  WaitingListEntry: 'waitingListEntry',
  ProfessionalBlockedTime: 'professionalBlockedTime',
  ScheduleReminder: 'scheduleReminder',
  Payment: 'payment',
  Charge: 'charge',
  MedicalRecord: 'medicalRecord',
  Document: 'document',
  Notification: 'notification',
  AuditLog: 'auditLog',
} as const;

// ============================================================================
// 🛠️ FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Converte nome da entidade do Prisma para nome do CASL
 * @param modelName Nome da entidade no Prisma (ex: 'company')
 * @returns Nome da entidade no CASL (ex: 'Company')
 */
export function getCaslName(modelName: EntityNameModel): EntityNameCasl {
  return ENTITY_MAPPING[modelName];
}

/**
 * Converte nome da entidade do CASL para nome do Prisma
 * @param caslName Nome da entidade no CASL (ex: 'Company')
 * @returns Nome da entidade no Prisma (ex: 'company')
 */
export function getModelName(caslName: EntityNameCasl): EntityNameModel {
  return CASL_TO_MODEL_MAPPING[caslName];
}

/**
 * Verifica se um nome de entidade é válido
 * @param entityName Nome da entidade para validar
 * @returns true se válido
 */
export function isValidEntityName(
  entityName: string,
): entityName is EntityNameModel {
  return Object.keys(ENTITY_MAPPING).includes(entityName);
}

/**
 * Obtém lista de todas as entidades disponíveis
 * @returns Array com todos os nomes de entidade do modelo
 */
export function getAllEntityNames(): EntityNameModel[] {
  return Object.keys(ENTITY_MAPPING) as EntityNameModel[];
}

/**
 * 🚀 Helper para criar configuração completa da entidade
 * @param modelName Nome da entidade no modelo (ex: 'company')
 * @returns Objeto com ambos os nomes para usar no constructor
 */
export function createEntityConfig(modelName: EntityNameModel) {
  return {
    model: modelName,
    casl: getCaslName(modelName),
  } as const;
}

// ============================================================================
// 📋 INTERFACES PARA CONFIGURAÇÃO DE INCLUDES E TRANSFORMAÇÕES
// ============================================================================

/** Permite select com campos boolean ou relações aninhadas (ex: product: { select: { id: true } }) */
export type SelectConfig = Record<
  string,
  boolean | { select?: SelectConfig; include?: IncludeConfig }
>;

export interface IncludeConfig {
  [key: string]:
  | boolean
  | {
    select?: SelectConfig;
    include?: IncludeConfig;
  };
}

export interface TransformConfig {
  // Mapeia campos de relacionamento para campos planos
  // Pode ser string simples ou objeto com configuração específica
  flatten?: Record<
    string,
    string | { field: string; target: string; keep?: boolean }
  >;
  // Função customizada de transformação
  custom?: (data: any) => any;
  // Remove campos específicos após transformação
  exclude?: string[];
}

export interface EntityConfig {
  includes?: IncludeConfig;
  transform?: TransformConfig;
  /** Cláusula where padrão para listagens/export (ex: { deletedAt: null }) */
  where?: Record<string, unknown>;
  /** orderBy padrão para listagens (ex: { updatedAt: 'desc' } para modelos sem createdAt) */
  orderBy?: Record<string, 'asc' | 'desc'>;
}