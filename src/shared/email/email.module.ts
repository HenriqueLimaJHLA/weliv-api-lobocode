import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailDispatchService } from './services/email-dispatch.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailDispatchService],
  exports: [EmailDispatchService],
})
export class EmailModule {}

