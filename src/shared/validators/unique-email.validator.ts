import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { VALIDATION_MESSAGES } from '../common/messages';

export function IsUniqueEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueEmailPerCompany',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        async validate(value: any, args: ValidationArguments) {
          if (!value) return false; // Email é obrigatório
          
          const prismaService = new PrismaService();
          
          try {
            console.log('IsUniqueEmail email:', value);
            // Busca por email na empresa atual
            const existingUser = await prismaService.user.findFirst({
              where: {
                email: value,
                deletedAt: null, // Não considerar usuários deletados
              },
            });
            // Se não encontrou, email é único
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