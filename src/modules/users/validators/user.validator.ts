import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from 'src/shared/common/errors';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserValidator {
  constructor(private readonly userRepository: UserRepository) {}

  async validarSeEmailEhUnico(email: string, excludeUserId?: string) {
    const user = await this.userRepository.buscarUnico({ email });
    if (user && user.id !== excludeUserId) {
      throw new ConflictError('E-mail já está em uso');
    }
  }

  async validarSeLoginEhUnico(login: string, excludeUserId?: string) {
    const user = await this.userRepository.buscarUnico({ login });
    if (user && user.id !== excludeUserId) {
      throw new ConflictError('Login já está em uso');
    }
  }

  async validarSeCpfEhUnico(cpf: string, excludeUserId?: string) {
    if (!cpf) return;
    const user = await this.userRepository.buscarUnico({ cpf });
    if (user && user.id !== excludeUserId) {
      throw new ConflictError('CPF já está em uso');
    }
  }

  async validarSeUserExiste(id: string) {
    const user = await this.userRepository.buscarUnico({ id });
    if (!user) throw new NotFoundError('User', id, 'id');
    return user;
  }
}
