import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { NotFoundError, UnauthorizedError } from 'src/shared/common/errors';
import { UpdateProviderSettingsDto } from './dto/update-provider-settings.dto';

const SETTINGS_SELECT = {
  id: true,
  remarcationEnabled: true,
  remarcationLimit: true,
  waitingListEnabled: true,
  depositPercentage: true,
  availableSchedule: true,
  consultationPrice: true,
  acceptsInsurance: true,
  insurances: true,
};

@Injectable({ scope: Scope.REQUEST })
export class ProviderSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {}

  async obterMinhasConfiguracoes() {
    const userId = this.extrairUserId();
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: SETTINGS_SELECT });
    if (!user) throw new NotFoundError('User', userId, 'id');
    return { data: user };
  }

  async atualizarMinhasConfiguracoes(dto: UpdateProviderSettingsDto) {
    const userId = this.extrairUserId();

    const data = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.remarcationEnabled !== undefined && { remarcationEnabled: dto.remarcationEnabled }),
        ...(dto.remarcationLimit !== undefined && { remarcationLimit: dto.remarcationLimit }),
        ...(dto.waitingListEnabled !== undefined && { waitingListEnabled: dto.waitingListEnabled }),
        ...(dto.depositPercentage !== undefined && { depositPercentage: dto.depositPercentage }),
        ...(dto.availableSchedule !== undefined && { availableSchedule: dto.availableSchedule }),
        ...(dto.consultationPrice !== undefined && { consultationPrice: dto.consultationPrice }),
        ...(dto.acceptsInsurance !== undefined && { acceptsInsurance: dto.acceptsInsurance }),
        ...(dto.insurances !== undefined && { insurances: dto.insurances }),
      } as any,
      select: SETTINGS_SELECT,
    });

    return { data };
  }

  async obterConfiguracoesPorProfissional(professionalId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: professionalId }, select: SETTINGS_SELECT });
    if (!user) throw new NotFoundError('User', professionalId, 'id');
    return { data: user };
  }

  async atualizarConfiguracoesPorProfissional(professionalId: string, dto: UpdateProviderSettingsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: professionalId } });
    if (!user) throw new NotFoundError('User', professionalId, 'id');

    const data = await this.prisma.user.update({
      where: { id: professionalId },
      data: {
        ...(dto.remarcationEnabled !== undefined && { remarcationEnabled: dto.remarcationEnabled }),
        ...(dto.remarcationLimit !== undefined && { remarcationLimit: dto.remarcationLimit }),
        ...(dto.waitingListEnabled !== undefined && { waitingListEnabled: dto.waitingListEnabled }),
        ...(dto.depositPercentage !== undefined && { depositPercentage: dto.depositPercentage }),
        ...(dto.availableSchedule !== undefined && { availableSchedule: dto.availableSchedule }),
        ...(dto.consultationPrice !== undefined && { consultationPrice: dto.consultationPrice }),
        ...(dto.acceptsInsurance !== undefined && { acceptsInsurance: dto.acceptsInsurance }),
        ...(dto.insurances !== undefined && { insurances: dto.insurances }),
      } as any,
      select: SETTINGS_SELECT,
    });

    return { data };
  }

  private extrairUserId(): string {
    const id = this.request?.user?.id;
    if (!id) throw new UnauthorizedError('Usuário não autenticado');
    return id;
  }
}
