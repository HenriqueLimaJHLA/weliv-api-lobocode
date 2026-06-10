import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { UniversalController } from 'src/shared/universal';
import { CreateServiceDto } from '../administrator/dto/create-service.dto';
import { UpdateServiceDto } from '../administrator/dto/update-service.dto';
import { UserServicesService } from './user-services.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER - Services (User - Acesso Público/Lido)
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('services')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('services')
export class UserServicesController extends UniversalController<
  CreateServiceDto,
  UpdateServiceDto,
  UserServicesService
> {
  constructor(service: UserServicesService) {
    super(service);
  }

  @Get()
  @ApiOperation({ summary: 'Lista serviços ativos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'specialtyId', required: false, type: String })
  listarServicos(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('specialtyId') specialtyId?: string,
  ) {
    return this.service.listarServicos(
      Number(page) || 1,
      Number(limit) || 50,
      specialtyId,
    );
  }

  @Get('by-specialty/:specialtyId')
  @ApiOperation({ summary: 'Lista serviços por especialidade' })
  listarPorEspecialidade(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // specialtyId virá do query params neste caso
    return this.service.listarServicos(Number(page) || 1, Number(limit) || 20);
  }
}