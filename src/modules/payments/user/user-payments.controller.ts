import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { UniversalController } from 'src/shared/universal';
import { CreatePaymentDto } from '../administrator/dto/create-payment.dto';
import { UpdatePaymentDto } from '../administrator/dto/update-payment.dto';
import { UserPaymentsService } from './user-payments.service';

@ApiTags('payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('payments')
export class UserPaymentsController extends UniversalController<CreatePaymentDto, UpdatePaymentDto, UserPaymentsService> {
  constructor(service: UserPaymentsService) { super(service); }

  @Get('my-payments')
  @ApiOperation({ summary: 'Meus pagamentos' })
  meusPagamentos(@Query() query: any) {
    return this.service.meusPagamentos(query.page ? Number(query.page) : 1, query.limit ? Number(query.limit) : 20);
  }
}