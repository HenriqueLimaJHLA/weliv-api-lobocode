import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { VALIDATION_MESSAGES } from '../common/messages';

export function IsUniqueLogin(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueLoginPerCompany',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          // TODO: Validador desabilitado - campo login removido do schema
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return VALIDATION_MESSAGES.UNIQUENESS.EMAIL_EXISTS;
        }
      }
    });
  };
} 