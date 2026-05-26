import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './repositories/user.repository';
import { UserValidator } from './validators/user.validator';
import { UserFactory } from './factories/user.factory';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UserRepository, UserValidator, UserFactory],
  exports: [UsersService, UserRepository, UserValidator],
})
export class UsersModule {}
