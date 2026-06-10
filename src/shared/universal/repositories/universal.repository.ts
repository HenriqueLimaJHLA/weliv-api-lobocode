import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntityNameModel } from '../types';
import { TenantService } from 'src/shared/tenant';

@Injectable()
export class UniversalRepository<DtoCreate, DtoUpdate> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  /**
   * Repository universal que funciona para qualquer entidade
   */
  private buscarEntidade(entityName: EntityNameModel) {
    return this.prisma[entityName] as any;
  }

  /**
   * Buscar múltiplos registros
   */
  async buscarMuitos(
    entityName: EntityNameModel,
    where?: any,
    options?: { skip?: number; take?: number; orderBy?: any },
    include?: any,
  ): Promise<any[]> { 
    return this.buscarEntidade(entityName).findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy || { createdAt: 'desc' },
      include,
    });
  }

  /**
   * Buscar com paginação
   */
  async buscarComPaginacao(
    entityName: EntityNameModel,
    where?: any,
    page: number = 1,
    limit: number = 10,
    orderBy?: any,
    include?: any,
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.buscarMuitos(
        entityName,
        where,
        { skip, take: limit, orderBy },
        include,
      ),
      this.contarTodos(entityName, where),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Buscar registro único
   */
  async buscarUnico(
    entityName: EntityNameModel,
    where: any,
    include?: any,
  ): Promise<any | null> {
    return this.buscarEntidade(entityName).findUnique({
      where,
      include,
    });
  }

  /**
   * Buscar primeiro registro que atenda aos critérios
   */
  async buscarPrimeiro(
    entityName: EntityNameModel,
    where: any,
    include?: any,
    select?: any,
  ): Promise<any | null> {
    return this.buscarEntidade(entityName).findFirst({
      where,
      select,
      include,
    });
  }
  /**
   * Entidades que não possuem relação company no schema (ex.: Reminder vinculado só ao usuário).
   * Não injetar company no create para essas entidades.
   */
  private static readonly ENTIDADES_SEM_RELACAO_COMPANY: EntityNameModel[] = [
    
    'company',
  ];

  /**
   * Criar novo registro
   */
  async criar(
    entityName: EntityNameModel,
    data: DtoCreate,
    include?: any,
  ): Promise<any> {
    const dataComCompany = this.aplicarCompanyIdAosDadosDeCreate(data, entityName);
    const transformedData = this.transformarDadosParaPrisma(dataComCompany);

    return this.buscarEntidade(entityName).create({
      data: transformedData,
      include,
    });
  }

  /**
   * Atualizar registro existente
   */
  async atualizar(
    entityName: EntityNameModel,
    where: any,
    data: DtoUpdate,
    include?: any,
  ): Promise<any> {
    const transformedData = this.transformarDadosParaPrisma(data);

    return this.buscarEntidade(entityName).update({
      where,
      data: transformedData,
      include,
    });
  }

  /**
   * Deletar registro
   */
  async deletar(entityName: EntityNameModel, where: any): Promise<any> {
    return this.buscarEntidade(entityName).delete({
      where,
    });
  }

  /**
   * Contar registros
   */
  async contarTodos(entityName: EntityNameModel, where?: any): Promise<number> {
    return this.buscarEntidade(entityName).count({ where });
  }

  /**
   * Verificar se existe
   */
  async existe(entityName: EntityNameModel, where: any): Promise<boolean> {
    const count = await this.contarTodos(entityName, where);
    return count > 0;
  }

  /**
   * Soft delete (se a entidade tiver deletedAt)
   */
  async desativar(entityName: EntityNameModel, where: any): Promise<any> {
    return this.buscarEntidade(entityName).update({
      where,
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restaurar soft delete
   */
  async reativar(entityName: EntityNameModel, where: any): Promise<any> {
    return this.buscarEntidade(entityName).update({
      where,
      data: { deletedAt: null },
    });
  }

  /**
   * Upsert - criar ou atualizar
   */
  async upsert(
    entityName: EntityNameModel,
    where: any,
    create: any,
    update: any,
    include?: any,
  ): Promise<any> {
    const transformedCreate = this.transformarDadosParaPrisma(
      this.aplicarCompanyIdAosDadosDeCreate(create, entityName),
    );
    const transformedUpdate = this.transformarDadosParaPrisma(update);

    return this.buscarEntidade(entityName).upsert({
      where,
      create: transformedCreate,
      update: transformedUpdate,
      include,
    });
  }

  /**
   * Deletar muitos
   */
  async deletarMuitos(entityName: EntityNameModel, where: any): Promise<any> {
    return this.buscarEntidade(entityName).deleteMany({
      where,
    });
  }

  //  Obter companyId do contexto atual
  private obterCompanyIdDoContexto(): string | null {
    const tenant = this.tenantService.getTenant();

    // Se for tenant global (SYSTEM_ADMIN), retorna null
    if (tenant?.isGlobal) {
      return null;
    }

    // Se for tenant temporário ou normal, retorna o companyId
    return tenant?.id || null;
  }

  /**
   * Transforma dados com campos "Id" em relacionamentos Prisma
   * Exemplo: { postId: "abc", userId: "xyz" } -> { post: { connect: { id: "abc" } }, user: { connect: { id: "xyz" } } }
   */
  private transformarDadosParaPrisma(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const transformedData = { ...data };

    // Verifica se há nested creates (como pets: { create: [...] })
    const hasNestedCreates = Object.keys(transformedData).some(
      (key) =>
        typeof transformedData[key] === 'object' &&
        transformedData[key] !== null &&
        !Array.isArray(transformedData[key]) &&
        transformedData[key].create !== undefined,
    );

    // Detecta campos que terminam com "Id" e os transforma em relacionamentos
    Object.keys(data).forEach((key) => {
      if (key.endsWith('Id') && data[key] !== null && data[key] !== undefined) {
        const relationName = key.slice(0, -2); // Remove "Id" do final

        // Pula se já existe um relacionamento com esse nome
        if (transformedData[relationName]) {
          return;
        }

        // Quando há nested creates, mantém o campo Id diretamente
        // pois o Prisma precisa dele para criar os relacionamentos nested
        if (hasNestedCreates) {
          return;
        }

        // Cria o relacionamento Prisma
        transformedData[relationName] = {
          connect: { id: data[key] },
        };

        // Remove o campo original "Id"
        delete transformedData[key];
      }
    });

    return transformedData;
  }

  /**
   * Aplicar companyId automaticamente nos dados de criação apenas para entidades
   * que possuem relação company no schema (Pet não tem).
   */
  private aplicarCompanyIdAosDadosDeCreate(
    data: any,
    entityName: EntityNameModel,
  ): any {
    const companyId = this.obterCompanyIdDoContexto();

    if (!companyId) {
      return data;
    }

    const semRelacaoCompany =
      UniversalRepository.ENTIDADES_SEM_RELACAO_COMPANY.includes(entityName);
    if (semRelacaoCompany) {
      delete data.companyId;
      return { ...data };
    }

    delete data.companyId;
    return {
      ...data,
      company: {
        connect: { id: companyId },
      },
    };
  }
}
