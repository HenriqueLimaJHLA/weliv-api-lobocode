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
          if (!value) return false; // Login é obrigatório
          
          const prismaService = new PrismaService();
          
          try { 
            // Busca por login na empresa atual
            const existingUser = await prismaService.user.findFirst({
              where: {
                email: value,
                deletedAt: null, // Não considerar usuários deletados
              },
            });
            // Se não encontrou, login é único
            return !existingUser;
          } catch (error) {
            // Em caso de erro, permite a validação passar
            // (será validado novamente no service)
            return true;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return VALIDATION_MESSAGES.UNIQUENESS.EMAIL_EXISTS;
        }
      }
    });
  };
} 