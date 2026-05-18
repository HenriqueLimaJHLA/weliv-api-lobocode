import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from './password.service';
import { RegisterPatientDto } from '../dto/register-patient.dto';
import { Roles, UserStatus } from '@prisma/client';
import { ConflictError, ValidationError } from '../../common/errors';
import { MessagesService } from '../../common/messages/messages.service';

@Injectable()
export class PatientRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly messagesService: MessagesService,
  ) {}

  async register(dto: RegisterPatientDto) {
    if (dto.password !== dto.passwordConfirm) {
      throw new ValidationError(
        this.messagesService.getValidationMessage('MATCH', 'PASSWORD'),
      );
    }

    const email = dto.email.trim().toLowerCase();
    const login = dto.login.trim().toLowerCase();
    const name = dto.name.trim();
    const cpfDigits = dto.cpf.replace(/\D/g, '');

    if (!this.isValidCpf(cpfDigits)) {
      throw new ValidationError(
        this.messagesService.getValidationMessage('FORMAT', 'CPF_INVALID'),
      );
    }

    const cpf = this.formatCpf(cpfDigits);

    const [byEmail, byLogin, byCpf] = await Promise.all([
      this.prisma.user.findFirst({ where: { email, deletedAt: null } }),
      this.prisma.user.findFirst({ where: { login, deletedAt: null } }),
      this.prisma.user.findFirst({ where: { cpf, deletedAt: null } }),
    ]);

    if (byEmail) {
      throw new ConflictError(
        this.messagesService.getErrorMessage('BUSINESS', 'EMAIL_IN_USE'),
      );
    }
    if (byLogin) {
      throw new ConflictError(
        this.messagesService.getValidationMessage('UNIQUENESS', 'LOGIN_EXISTS'),
      );
    }
    if (byCpf) {
      throw new ConflictError(
        this.messagesService.getValidationMessage('UNIQUENESS', 'CPF_EXISTS'),
      );
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        login,
        name,
        cpf,
        password: passwordHash,
        role: Roles.PATIENT,
        status: UserStatus.ACTIVE,
      },
      select: { id: true, email: true, name: true },
    });

    return {
      message: this.messagesService.getSuccessMessage('CRUD', 'CREATED'),
      user,
    };
  }

  private formatCpf(digits: string): string {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  private isValidCpf(d: string): boolean {
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(d[i], 10) * (10 - i);
    }
    let mod = (sum * 10) % 11;
    if (mod === 10) mod = 0;
    if (mod !== parseInt(d[9], 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(d[i], 10) * (11 - i);
    }
    mod = (sum * 10) % 11;
    if (mod === 10) mod = 0;
    return mod === parseInt(d[10], 10);
  }
}
