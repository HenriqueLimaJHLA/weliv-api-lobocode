import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { TenantService } from 'src/shared/tenant/tenant.service';
import { NotFoundError, UnauthorizedError, ValidationError } from 'src/shared/common/errors';
import { UpdateOpeningHoursDto, WeeklyScheduleDto } from './dto/weekly-schedule.dto';

@Injectable({ scope: Scope.REQUEST })
export class OpeningHoursService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
    @Optional() @Inject(REQUEST) private readonly request: any,
  ) {}

  async obterHorarios() {
    const companyId = await this.resolverCompanyId();

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, availableSchedule: true },
    });

    if (!company) throw new NotFoundError('company', companyId, 'id');

    const availability = (company.availableSchedule as unknown as WeeklyScheduleDto)
      || this.gradeVazia();

    return { data: { availability } };
  }

  async atualizarHorarios(dto: UpdateOpeningHoursDto) {
    const companyId = await this.resolverCompanyId();

    this.validarGrade(dto.availability);

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: { availableSchedule: dto.availability as any },
      select: { id: true, availableSchedule: true },
    });

    return { data: { availability: company.availableSchedule as unknown as WeeklyScheduleDto } };
  }

  private async resolverCompanyId(): Promise<string> {
    const user = this.request?.user;
    if (!user) throw new UnauthorizedError('Usuário não autenticado');

    let companyId = this.tenantService.getCompanyId();
    if (!companyId) {
      const userData = await this.prisma.user.findUnique({
        where: { id: user.id },
        select: { companyId: true },
      });
      if (!userData?.companyId) throw new ValidationError('Usuário não possui empresa vinculada');
      companyId = userData.companyId;
    }
    return companyId;
  }

  private validarGrade(availability: WeeklyScheduleDto): void {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

    for (const day of ['0', '1', '2', '3', '4', '5', '6']) {
      const d = availability[day];
      if (!d) throw new ValidationError(`Dia ${day} não encontrado`);
      if (typeof d.active !== 'boolean') throw new ValidationError(`Campo 'active' inválido no dia ${day}`);
      if (!Array.isArray(d.slots)) throw new ValidationError(`Campo 'slots' inválido no dia ${day}`);

      for (const slot of d.slots) {
        if (!slot.start || !slot.end) throw new ValidationError(`Slot inválido no dia ${day}`);
        if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
          throw new ValidationError(`Formato de hora inválido no dia ${day}. Use HH:MM`);
        }
        const [h1, m1] = slot.start.split(':').map(Number);
        const [h2, m2] = slot.end.split(':').map(Number);
        if (h1 * 60 + m1 >= h2 * 60 + m2) {
          throw new ValidationError(`Início deve ser menor que fim no dia ${day}`);
        }
      }
    }
  }

  private gradeVazia(): WeeklyScheduleDto {
    return Object.fromEntries(['0','1','2','3','4','5','6'].map(d => [d, { active: false, slots: [] }]));
  }
}
