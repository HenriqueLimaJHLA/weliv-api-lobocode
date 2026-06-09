import { Injectable, Inject, Optional, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import {
  UniversalService,
  UniversalRepository,
  UniversalMetricsService,
  UniversalQueryService,
  UniversalPermissionService,
  createEntityConfig,
} from 'src/shared/universal';
import { ForbiddenError, ConflictError, NotFoundError } from 'src/shared/common/errors';
import { CreateSettingDto, SettingType } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE - Settings (Administrator)
// ═══════════════════════════════════════════════════════════════════════════════

@Injectable({ scope: Scope.REQUEST })
export class AdministratorSettingService extends UniversalService<
  CreateSettingDto,
  UpdateSettingDto
> {
  private static readonly entityConfig = createEntityConfig('setting');

  constructor(
    repository: UniversalRepository<CreateSettingDto, UpdateSettingDto>,
    queryService: UniversalQueryService,
    permissionService: UniversalPermissionService,
    metricsService: UniversalMetricsService,
    @Optional() @Inject(REQUEST) protected readonly request: any,
    
  ) {
    const { model, casl } = AdministratorSettingService.entityConfig;
    super(
      repository,
      queryService,
      permissionService,
      metricsService,
      request,
      model,
      casl,
    );
    this.setEntityConfig();
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // CONFIGURAÇÃO DE ENTITY
  // ═══════════════════════════════════════════════════════════════════════════════

  private setEntityConfig() {
    this.entityConfig = {
      includes: {
        company: {
          select: {
            id: true,
            name: true,
            cnpj: true,
          },
        },
      },
      transform: {
        flatten: {
          company: { field: 'name', target: 'companyName' },
        },
        custom: (data) => {
          // Não expor valores encriptados
          if (data.isEncrypted && data.value) {
            data.value = '***';
            data.valueEncrypted = true;
          }

          // Adicionar label do tipo
          data.typeLabel = this.getTypeLabel(data.type);

          return data;
        },
        exclude: [],
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HOOKS
  // ═══════════════════════════════════════════════════════════════════════════════

  protected async antesDeCriar(data: CreateSettingDto): Promise<void> {
    const companyId = this.obterCompanyId();

    if (!companyId) {
      throw new ForbiddenError('Contexto de empresa não disponível');
    }

    (data as any).companyId = companyId;

    // Validar key única por empresa
    const existe = await this.repository.buscarPrimeiro(this.entityName, {
      companyId,
      key: data.key,
      deletedAt: null,
    });

    if (existe) {
      throw new ConflictError(`Já existe uma configuração com a chave "${data.key}"`);
    }

    // Normalizar key
    (data as any).key = data.key.trim().toLowerCase().replace(/\s+/g, '_');
  }

  protected async antesDeAtualizar(id: string, data: UpdateSettingDto): Promise<void> {
    // Key não pode ser alterada
    if (data.key) {
      throw new ForbiddenError('A chave da configuração não pode ser alterada');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MÉTODOS CUSTOMIZADOS - GET/SET
  // ═══════════════════════════════════════════════════════════════════════════════

  async get(key: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const companyId = this.obterCompanyId();
    if (!companyId) {
      throw new ForbiddenError('Contexto de empresa não disponível');
    }

    const setting = await this.repository.buscarPrimeiro(this.entityName, {
      companyId,
      key,
      deletedAt: null,
    });

    if (!setting) {
      throw new NotFoundError(this.entityName, key, 'key');
    }

    return { data: this.transformData(setting) };
  }

  async set(key: string, value: any, description?: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'create');

    const companyId = this.obterCompanyId();
    if (!companyId) {
      throw new ForbiddenError('Contexto de empresa não disponível');
    }

    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');

    const existente = await this.repository.buscarPrimeiro(this.entityName, {
      companyId,
      key: normalizedKey,
      deletedAt: null,
    });

    if (existente) {
      const updated = await this.repository.atualizar(
        this.entityName,
        { id: existente.id },
        { value },
      );
      return { data: this.transformData(updated) };
    }

    const created = await this.repository.criar(this.entityName, {
      key: normalizedKey,
      value,
      description,
      companyId,
    });

    return { data: this.transformData(created) };
  }

  async getAllPublic() {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const companyId = this.obterCompanyId();
    if (!companyId) {
      throw new ForbiddenError('Contexto de empresa não disponível');
    }

    const settings = await this.repository.buscarMuitos(
      this.entityName,
      { companyId, isPublic: true, deletedAt: null },
    );

    const result = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    return { data: result };
  }

  async getMultiple(keys: string[]) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const companyId = this.obterCompanyId();
    if (!companyId) {
      throw new ForbiddenError('Contexto de empresa não disponível');
    }

    const settings = await this.repository.buscarMuitos(
      this.entityName,
      { companyId, key: { in: keys }, deletedAt: null },
    );

    const result = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    return { data: result };
  }

  async getByCategory(category: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'read');

    const companyId = this.obterCompanyId();
    if (!companyId) {
      throw new ForbiddenError('Contexto de empresa não disponível');
    }

    const settings = await this.repository.buscarMuitos(
      this.entityName,
      { companyId, category, deletedAt: null },
    );

    return { data: this.transformData(settings) };
  }

  async toggle(id: string) {
    this.permissionService.validarAction(this.entityNameCasl, 'update');

    const setting = await this.repository.buscarPrimeiro(this.entityName, { id, deletedAt: null });

    if (!setting) {
      throw new NotFoundError(this.entityName, id, 'id');
    }

    const updated = await this.repository.atualizar(
      this.entityName,
      { id },
      { isActive: !setting.isActive },
    );

    return { data: this.transformData(updated) };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      STRING: 'Texto',
      NUMBER: 'Número',
      BOOLEAN: 'Boolean',
      JSON: 'JSON',
      ENCRYPTED: 'Encriptado',
    };
    return labels[type] || type;
  }
}
