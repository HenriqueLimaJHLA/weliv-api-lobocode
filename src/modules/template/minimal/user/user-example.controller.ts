import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateExampleDto } from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';
import { UserExampleService } from './user-example.service';

@ApiTags('user/examples')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.USER, Roles.ADMIN, Roles.SYSTEM_ADMIN],
  POST: [Roles.ADMIN, Roles.SYSTEM_ADMIN],
  PATCH: [Roles.ADMIN, Roles.SYSTEM_ADMIN],
  DELETE: [Roles.ADMIN, Roles.SYSTEM_ADMIN],
})
@Controller('user/examples')
export class UserExampleController extends UniversalController<
  CreateExampleDto,
  UpdateExampleDto,
  UserExampleService
> {
  constructor(service: UserExampleService) {
    super(service);
  }

  // MINIMAL · USER: apenas leitura para Roles.USER via UniversalController.
  // Escrita (POST/PATCH/DELETE) restrita a ADMIN+ — rotas extras do usuário
  // ficam nos templates STANDARD/COMPLEX (ex.: GET/PUT /me).
  // TenantInterceptor e CaslInterceptor já são aplicados pelo UniversalController.
}
