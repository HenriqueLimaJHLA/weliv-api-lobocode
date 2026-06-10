export const PROJECT_CORE_ENTITY_MAPPING = {
  user: 'User',
  company: 'Company',
  file: 'File',
  notification: 'Notification',
  specialty: 'Specialty',
  service: 'Service',
  professional: 'Professional',
  patient: 'Patient',
  appointment: 'Appointment',
} as const;

export const PROJECT_CORE_CASL_TO_MODEL_MAPPING = {
  User: 'user',
  Company: 'company',
  File: 'file',
  Notification: 'notification',
  Specialty: 'specialty',
  Service: 'service',
  Professional: 'professional',
  Patient: 'patient',
  Appointment: 'appointment',
} as const;
