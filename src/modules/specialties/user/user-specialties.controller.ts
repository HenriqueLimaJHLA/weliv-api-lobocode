import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { UniversalController } from 'src/shared/universal';
import { CreateSpecialtyDto } from '../administrator/dto/create-specialty.dto';
import { UpdateSpecialtyDto } from '../administrator/dto/update-specialty.dto';
import { UserSpecialtiesService } from './user-specialties.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER - Specialties (User - Acesso Público/Lido)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Rotas para usuários comuns:
// - GET /specialties           → lista especialidades ativas
// - GET /specialties/:id      → busca por ID
// - GET /specialties/categories → lista categorias
//
// ============================================================================

@ApiTags('specialties')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('specialties')
export class UserSpecialtiesController extends UniversalController<
  CreateSpecialtyDto,
  UpdateSpecialtyDto,
  UserSpecialtiesService
> {
  constructor(service: UserSpecialtiesService) {
    super(service);
  }

  @Get()
  @ApiOperation({ summary: 'Lista especialidades ativas' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  listarEspecialidades(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    return this.service.listarEspecialidades(
      Number(page) || 1,
      Number(limit) || 50,
      category,
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lista categorias de especialidades' })
  listarCategorias() {
    return this.service.listarCategorias();
  }
}