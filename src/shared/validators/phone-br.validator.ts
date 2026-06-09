import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../common/messages';

export function IsPhoneNumberBR(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPhoneNumberBR',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Telefone é opcional

          return validatePhoneNumberBR(value);
        },
        defaultMessage(args: ValidationArguments) {
          const message = VALIDATION_MESSAGES.FORMAT.PHONE_INVALID;
          return message;
        },
      },
    });
  };
}

function validatePhoneNumberBR(phone: string): boolean {
  // Remove caracteres especiais
  const cleanPhone = phone.replace(/[^\d]/g, '');

  // Verifica se tem 10 ou 11 dígitos (com DDD)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) return false;

  // Verifica se começa com DDD válido (11-99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;

  // Verifica se o número não é composto apenas por zeros
  const number = cleanPhone.substring(2);
  if (/^0+$/.test(number)) return false;

  // Verifica se o número não é composto apenas por números iguais
  if (/^(\d)\1+$/.test(number)) return false;

  return true;
}
