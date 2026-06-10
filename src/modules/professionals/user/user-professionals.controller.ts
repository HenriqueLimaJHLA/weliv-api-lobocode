import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { UniversalController } from 'src/shared/universal';
import { CreateProfessionalDto } from '../administrator/dto/create-professional.dto';
import { UpdateProfessionalDto } from '../administrator/dto/update-professional.dto';
import { UserProfessionalsService } from './user-professionals.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER - Professionals (User)
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('professionals')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('professionals')
export class UserProfessionalsController extends UniversalController<
  CreateProfessionalDto,
  UpdateProfessionalDto,
  UserProfessionalsService
> {
  constructor(service: UserProfessionalsService) {
    super(service);
  }

  @Get()
  @ApiOperation({ summary: 'Lista profissionais ativos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'specialtyId', required: false, type: String })
  listarProfissionais(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('specialtyId') specialtyId?: string,
  ) {
    return this.service.listarProfissionais(
      Number(page) || 1,
      Number(limit) || 50,
      specialtyId,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Meu perfil de profissional' })
  meuPerfil() {
    return this.service.meuPerfil();
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar meu perfil' })
  atualizarMeuPerfil(@Body() dto: UpdateProfessionalDto) {
    return this.service.atualizarMeuPerfil(dto);
  }
}