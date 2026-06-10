import { User } from '@prisma/client';

type CanBuilder = {
  can: (...args: any[]) => void;
};

export type ProjectCoreDefinePermissions = (
  user: User,
  builder: CanBuilder,
) => void;

export const PROJECT_CORE_CASL_ROLE_PERMISSIONS: Record<
  string,
  ProjectCoreDefinePermissions
> = {
  SYSTEM_ADMIN: (user: User, { can }: any) => {
    can('manage', 'all');
  },
  ADMIN: (user: User, { can }: any) => {
    can('manage', 'all');
  },
  USER: (user: User, { can }: any) => {
    const userId = user.id;
    can('manage', 'User', { id: userId });
    if (user.companyId) {
      can('read', 'Company', { id: user.companyId });
      can('update', 'Company', { id: user.companyId });
    }
    can('manage', 'File', { uploadedBy: userId });
    can('read', 'Notification', {
      recipients: { some: { userId } },
    });

    // Specialties - usuários comuns podem ler especialidades ativas
    can('read', 'Specialty', { status: 'ACTIVE' });

    // Services - usuários comuns podem ler serviços ativos
    can('read', 'Service', { status: 'ACTIVE' });

    // Professionals - usuários comuns podem ler profissionais ativos
    can('read', 'Professional', { status: 'ACTIVE' });

    // Patients - usuário pode ler/atualizar próprio paciente
    can('read', 'Patient', { userId: userId });
    can('update', 'Patient', { userId: userId });

    // Appointments - usuário pode ler próprios agendamentos
    can('read', 'Appointment', { patientId: userId });

    // Payments e Charges - usuário pode ler próprios
    can('read', 'Payment', { patientId: userId });
    can('read', 'Charge', { patientId: userId });

    // MedicalRecords e Documents - usuário pode ler próprios
    can('read', 'MedicalRecord', { patientId: userId });
    can('read', 'Document', { patientId: userId });
  },
};
