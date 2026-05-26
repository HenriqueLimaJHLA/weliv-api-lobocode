import { Injectable } from '@nestjs/common';
import { Roles, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

@Injectable()
export class UserFactory {
  criarPaciente(dto: any): Record<string, any> {
    return {
      name: dto.name,
      login: String(dto.login || dto.email).trim().toLowerCase(),
      email: String(dto.email).trim().toLowerCase(),
      password: bcrypt.hashSync(dto.password, 10),
      role: Roles.PATIENT,
      status: UserStatus.ACTIVE,
      cpf: dto.cpf ?? null,
      phone: dto.phone,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      avatarUrl: dto.avatarUrl,
      healthPlan: dto.healthPlan,
    };
  }

  criarAdmin(dto: any): Record<string, any> {
    return {
      name: dto.name,
      login: String(dto.login || dto.email).trim().toLowerCase(),
      email: String(dto.email).trim().toLowerCase(),
      password: bcrypt.hashSync(dto.password, 10),
      role: Roles.ADMIN,
      status: UserStatus.ACTIVE,
      cpf: dto.cpf ?? null,
    };
  }
}
