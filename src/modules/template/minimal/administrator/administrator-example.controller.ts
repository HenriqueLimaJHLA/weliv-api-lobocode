import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateExampleDto } from './dto/create-example.dto';
import { UpdateExampleDto } from './dto/update-example.dto';
import { AdministratorExampleService } from './administrator-example.service';

@ApiTags('admin/examples')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('admin/examples')
export class AdministratorExampleController extends UniversalController<
  CreateExampleDto,
  UpdateExampleDto,
  AdministratorExampleService
> {
  constructor(service: AdministratorExampleService) {
    super(service);
  }

  // MINIMAL · ADMINISTRATOR: CRUD completo para gestão administrativa.
  // Todos os endpoints vêm do UniversalController via herança.
  // TenantInterceptor e CaslInterceptor já são aplicados pelo UniversalController.
}
