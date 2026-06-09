import {
  KycDocumentType,
  KycStatus,
  ServiceCategory,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Tipos obrigatórios de KYC (alinhado ao admin / pro-kyc-documents).
 * Usado para promover empresa PENDING → APPROVED quando a documentação estiver completa.
 */
export function tiposKycObrigatoriosParaEmpresa(
  primaryCategory: ServiceCategory | null | undefined,
): KycDocumentType[] {
  const base: KycDocumentType[] = [
    KycDocumentType.CNPJ,
    KycDocumentType.BANK_PROOF,
    KycDocumentType.RG,
    KycDocumentType.PROOF_OF_ADDRESS,
  ];
  if (primaryCategory === ServiceCategory.VETERINARY) {
    return [...base, KycDocumentType.CRMV];
  }
  return base;
}

/**
 * Empresa com todos os tipos obrigatórios aprovados (gatilho para status APPROVED no fluxo KYC).
 */
export async function empresaTemDocumentacaoKycCompletaParaListagem(
  prisma: PrismaService,
  companyId: string,
  primaryCategory: ServiceCategory | null | undefined,
): Promise<boolean> {
  const required = tiposKycObrigatoriosParaEmpresa(primaryCategory);
  const approvedTypes = await prisma.kycDocument.findMany({
    where: {
      companyId,
      deletedAt: null,
      status: KycStatus.APPROVED,
      type: { in: required },
    },
    distinct: ['type'],
    select: { type: true },
  });
  return approvedTypes.length === required.length;
}
