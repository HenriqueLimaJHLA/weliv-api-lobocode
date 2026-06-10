import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/shared/auth/guards/auth.guard';
import { UniversalController } from 'src/shared/universal';
import { CreateAppointmentDto } from '../administrator/dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../administrator/dto/update-appointment.dto';
import { UserAppointmentsService } from './user-appointments.service';

@ApiTags('appointments')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('appointments')
export class UserAppointmentsController extends UniversalController<CreateAppointmentDto, UpdateAppointmentDto, UserAppointmentsService> {
  constructor(service: UserAppointmentsService) { super(service); }

  @Get('my-appointments')
  @ApiOperation({ summary: 'Minhas consultas' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  minhasConsultas(@Query() query: any) {
    return this.service.minhasConsultas(query.page ? Number(query.page) : 1, query.limit ? Number(query.limit) : 20, query.status);
  }

  @Get('my-agenda')
  @ApiOperation({ summary: 'Minha agenda' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  minhaAgenda(@Query() query: any) {
    return this.service.minhaAgenda(query.page ? Number(query.page) : 1, query.limit ? Number(query.limit) : 20, query.startDate, query.endDate);
  }
}