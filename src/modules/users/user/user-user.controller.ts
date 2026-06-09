import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@prisma/client';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { RoleByMethodGuard } from 'src/shared/auth/guards/role-by-method.guard';
import { RoleByMethod } from 'src/shared/auth/role-by-method.decorator';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import { UserUserService } from './user-user.service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER - USER LAYER
// ═══════════════════════════════════════════════════════════════════════════════

@ApiTags('user/profile')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RoleByMethodGuard)
@RoleByMethod({
  GET: [Roles.USER, Roles.ADMIN, Roles.SYSTEM_ADMIN],
  PATCH: [Roles.USER, Roles.ADMIN, Roles.SYSTEM_ADMIN],
  POST: [Roles.USER, Roles.ADMIN, Roles.SYSTEM_ADMIN],
})
@Controller('user/profile')
export class UserUserController {
  constructor(private readonly service: UserUserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obter meus dados' })
  getMe() {
    return this.service.getMe();
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar meu perfil' })
  updateMyProfile(@Body() data: UpdateProfileDto) {
    return this.service.updateMyProfile(data);
  }

  @Post('me/password')
  @ApiOperation({ summary: 'Alterar minha senha' })
  changeMyPassword(@Body() data: ChangePasswordDto) {
    return this.service.changeMyPassword(data.currentPassword, data.newPassword);
  }
}
