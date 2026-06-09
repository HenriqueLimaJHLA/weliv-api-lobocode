import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantService } from './tenant.service';
import { PrismaService } from '../prisma/prisma.service';
import { CaslAbilityService } from '../casl/casl-ability/casl-ability.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private readonly tenantService: TenantService,
    private readonly prismaService: PrismaService,
    private readonly abilityService: CaslAbilityService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    try {
    const request = context.switchToHttp().getRequest();
      const user = this.extractUserFromRequest(request);

      // Valida se usuário tem empresa (exceto SYSTEM_ADMIN)
      this.validateUserHasCompany(user);
      
      // Configura tenant baseado no contexto (body ou query)
      await this.setupTenantContext(request, user);
      
      return next.handle();
    } catch (error) {
      this.handleTenantError(error);
    }
  }

  // Extrair usuário da requisição
  protected extractUserFromRequest(request: any) {
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    return user;
  }

  // Validar se usuário tem empresa (exceto master)
  // Para usuários comuns, companyId é opcional
  private validateUserHasCompany(user: any): void {
    const ability = this.abilityService.ability;
    
    // Verifica se usuário pode acessar dados globais (SYSTEM_ADMIN)
    if (ability.can('manage', 'all')) {
      return;
    }

    // Para usuários comuns, companyId é opcional
    // Não precisa validar se tem company
  }

  // Configurar contexto do tenant baseado no request
  private async setupTenantContext(request: any, user: any): Promise<void> {
    const ability = this.abilityService.ability;
    const body = request.body;
    const query = request.query;

    // Verifica se SYSTEM_ADMIN especificou companyId (body ou query)
    const specifiedCompanyId = body?.companyId || query?.companyId;

    if (specifiedCompanyId) {
      // Valida se apenas SYSTEM_ADMIN pode especificar companyId
      if (!ability.can('manage', 'all')) {
        throw new ForbiddenException(
          'Somente administradores de plataforma podem especificar companyId em solicitações'
        );
      }

      // Busca e valida empresa especificada
      const company = await this.findAndValidateCompany(specifiedCompanyId);
      if (company && !company.isGlobal) {
        this.tenantService.setTemporaryTenant(company.id, company.name);
      } else {
        this.tenantService.setTenant({
          id: 'global',
          name: 'Global Tenant',
          isGlobal: true,
        });
      }
    } else if (user.companyId) {
      // Se usuário tem companyId, busca a empresa
      const company = await this.findAndValidateCompany(user);
      if (company) {
        this.tenantService.setTenant(company);
      } else {
        // Se não encontrou a empresa, configura tenant global
        this.tenantService.setTenant({
          id: 'global',
          name: 'Global Tenant',
          isGlobal: true,
        });
      }
    } else {
      // Se não tem companyId, configura tenant global (sem filtro de company)
      this.tenantService.setTenant({
        id: 'global',
        name: 'Global Tenant',
        isGlobal: true,
      });
    }
  }

  // Buscar e validar empresa no banco
  private async findAndValidateCompany(companyIdOrUser: any): Promise<{ id: string; name: string; isGlobal: boolean } | null> {
    const ability = this.abilityService.ability;
    
    // Se for SYSTEM_ADMIN sem especificar companyId, retorna tenant global
    if (ability.can('manage', 'all') && typeof companyIdOrUser !== 'string') {
      return { id: 'global', name: 'Global Tenant', isGlobal: true };
    }

    // Se for string (companyId), busca empresa específica
    if (typeof companyIdOrUser === 'string') {
      const company = await this.prismaService.company.findFirst({
        where: { id: companyIdOrUser },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return { id: company.id, name: company.name, isGlobal: false };
    }

    // Se for user, busca empresa do usuário
    // Se não tiver companyId, retorna null (será tratado no setupTenantContext)
    if (!companyIdOrUser.companyId) {
      return null;
    }

    const company = await this.prismaService.company.findFirst({
      where: { id: companyIdOrUser.companyId },
    });

    if (!company) {
      // Não lança erro, retorna null para permitir tenant global
      return null;
    }

    return { id: company.id, name: company.name, isGlobal: false };
    }

  // Tratar erros de tenant de forma padronizada
  private handleTenantError(error: any): never {
    console.error('Tenant error:', error);

    if (
      error instanceof ForbiddenException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    throw new ForbiddenException('Tenant configuration failed');
  }

  // Método protegido para extensão (Open/Closed Principle)
  protected getTenantExtractionStrategy(): 'company' | 'subdomain' | 'custom' {
    return 'company';
  }
}
