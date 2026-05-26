import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Post('asaas')
  @HttpCode(200)
  asaas(@Body() payload: Record<string, any>) {
    return this.service.processarEventoAsaas(payload);
  }

  @Post('stripe')
  @HttpCode(200)
  stripe(
    @Body() payload: Record<string, any>,
    @Headers('stripe-signature') _signature: string,
  ) {
    return this.service.processarEventoStripe(payload);
  }
}
