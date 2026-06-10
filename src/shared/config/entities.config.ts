import {
  PROJECT_CORE_CASL_TO_MODEL_MAPPING,
  PROJECT_CORE_ENTITY_MAPPING,
} from './entities.core.config';

// ============================================================================
// ENTIDADES DO PROJETO
// Apenas entidades que existem no schema Prisma atual
// ============================================================================

export const PROJECT_PLUGIN_ENTITY_MAPPING = {
  setting: 'Setting',
} as const;

export const PROJECT_PLUGIN_CASL_TO_MODEL_MAPPING = {
  Setting: 'setting',
} as const;

export const PROJECT_ENTITY_MAPPING = {
  ...PROJECT_CORE_ENTITY_MAPPING,
  ...PROJECT_PLUGIN_ENTITY_MAPPING,
} as const;

export const PROJECT_CASL_TO_MODEL_MAPPING = {
  ...PROJECT_CORE_CASL_TO_MODEL_MAPPING,
  ...PROJECT_PLUGIN_CASL_TO_MODEL_MAPPING,
} as const;
