import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { UniversalController } from 'src/shared/universal';
import { CreateSettingDto, SettingType } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { AdministratorSettingService } from './administrator-setting.service';

@ApiTags('admin/settings')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.SYSTEM_ADMIN, Roles.ADMIN, Roles.USER],
  POST: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  PATCH: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
  DELETE: [Roles.SYSTEM_ADMIN, Roles.ADMIN],
})
@Controller('admin/settings')
export class AdministratorSettingController extends UniversalController<
  CreateSettingDto,
  UpdateSettingDto,
  AdministratorSettingService
> {
  constructor(service: AdministratorSettingService) {
    super(service);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES CUSTOM - Vêm ANTES das rotas com :id do UniversalController
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('by-key')
  @ApiOperation({ summary: 'Busca configuração pela chave' })
  @ApiQuery({ name: 'key', required: true, description: 'Chave da configuração' })
  get(@Query('key') key: string) {
    if (!key?.trim()) {
      throw new BadRequestException('Chave é obrigatória');
    }
    return this.service.get(key);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Busca configurações por categoria' })
  @ApiQuery({ name: 'category', required: true, description: 'Categoria' })
  getByCategory(@Query('category') category: string) {
    if (!category?.trim()) {
      throw new BadRequestException('Categoria é obrigatória');
    }
    return this.service.getByCategory(category);
  }

  @Get('public')
  @ApiOperation({ summary: 'Busca todas configurações públicas' })
  getAllPublic() {
    return this.service.getAllPublic();
  }

  @Get('multiple')
  @ApiOperation({ summary: 'Busca múltiplas configurações' })
  getMultiple(@Query('keys') keys: string) {
    if (!keys?.trim()) {
      throw new BadRequestException('Keys é obrigatório (separadas por vírgula)');
    }
    const keyList = keys.split(',').map(k => k.trim()).filter(Boolean);
    return this.service.getMultiple(keyList);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROUTES DE AÇÃO
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('set')
  @ApiOperation({ summary: 'Cria ou atualiza configuração pela chave' })
  set(@Body() data: { key: string; value: any; description?: string }) {
    if (!data.key?.trim()) {
      throw new BadRequestException('Chave é obrigatória');
    }
    return this.service.set(data.key, data.value, data.description);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Ativa/desativa configuração' })
  toggle(@Param('id') id: string) {
    return this.service.toggle(id);
  }
}
