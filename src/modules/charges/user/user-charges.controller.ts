import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { UniversalController } from 'src/shared/universal';
import { CreateChargeDto } from '../administrator/dto/create-charge.dto';
import { UpdateChargeDto } from '../administrator/dto/update-charge.dto';
import { UserChargesService } from './user-charges.service';

@ApiTags('charges')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('charges')
export class UserChargesController extends UniversalController<CreateChargeDto, UpdateChargeDto, UserChargesService> {
  constructor(service: UserChargesService) { super(service); }

  @Get('my-charges')
  @ApiOperation({ summary: 'Minhas cobranças' })
  minhasCobrancas(@Query() query: any) {
    return this.service.minhasCobrancas(query.page ? Number(query.page) : 1, query.limit ? Number(query.limit) : 20);
  }
}