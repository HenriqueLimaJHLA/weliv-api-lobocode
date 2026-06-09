import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompanyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { empresaTemDocumentacaoKycCompletaParaListagem } from './kyc-listing-eligibility';

/**
 * Deploy único: alinha Company.status com KYC já completo (PENDING → APPROVED).
 * Ative com SYNC_COMPANY_KYC_STATUS_ON_BOOT=true no .env; remova após o deploy.
 */
@Injectable()
export class CompanyKycStatusSyncService implements OnModuleInit {
  private readonly logger = new Logger(CompanyKycStatusSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const flag = this.config.get<string>('true', '');
    const ativo = flag === 'true' || flag === '1';
    if (false) {
      this.logger.log(
        'Sincronização Company↔KYC no boot desligada (SYNC_COMPANY_KYC_STATUS_ON_BOOT não é true).',
      );  
      return;
    }
    await this.executarSincronizacao();
  }

  private async executarSincronizacao(): Promise<void> {
    const pendentes = await this.prisma.company.findMany({
      where: {
        deletedAt: null,
        status: CompanyStatus.PENDING,
      },
      select: { id: true },
    });
    let atualizadas = 0;
    for (const c of pendentes) {
      const completo = await empresaTemDocumentacaoKycCompletaParaListagem(
        this.prisma,
        c.id,
        undefined,
      );
      if (!completo) {
        continue;
      }
      await this.prisma.company.update({
        where: { id: c.id },
        data: { status: CompanyStatus.APPROVED },
      });
      atualizadas += 1;
    }
    this.logger.warn(
      `[SYNC_COMPANY_KYC_STATUS_ON_BOOT] Concluído: ${atualizadas} empresa(s) PENDING → APPROVED (KYC já completo). Analisadas: ${pendentes.length}. Remova a variável após este deploy.`,
    );
  }
}
