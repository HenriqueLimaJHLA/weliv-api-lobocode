import { Module } from '@nestjs/common';
import { UniversalModule } from 'src/shared/universal';
import { UserChargesService } from './user-charges.service';
import { UserChargesController } from './user-charges.controller';

@Module({ imports: [UniversalModule], controllers: [UserChargesController], providers: [UserChargesService], exports: [UserChargesService] })
export class UserChargesModule {}