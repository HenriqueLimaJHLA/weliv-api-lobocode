# 📋 Padrões de Codificação - TEMPLATE_LOBOCODE Engine

## 🎯 Visão Geral

Este documento estabelece os padrões de nomenclatura e convenções de código para o projeto TEMPLATE_LOBOCODE Engine, garantindo consistência, legibilidade e manutenibilidade.

## 🇧🇷🇺🇸 Convenções de Idioma

### ✅ **MANTER EM INGLÊS:**
- **Entidades/Modelos**: `User`, `Company`, `Post`, `Role`, `Shift`, `Patrol`
- **Propriedades**: `id`, `name`, `email`, `companyId`, `postId`
- **Tipos/Interfaces**: `Roles`, `Prisma.UserWhereInput`, `UpdateUserDto`
- **Decorators**: `@Injectable()`, `@Controller()`, `@UseGuards()`
- **Frameworks**: `NestJS`, `Prisma`, `CASL`, `TypeScript`
- **Ações CRUD**: `create`, `read`, `update`, `delete`
- **Operadores**: `AND`, `OR`, `NOT`, `IN`, `GT`, `LT`

### 🇧🇷 **CONVERTER PARA PORTUGUÊS:**
- **Métodos/Funções**: `buscarUserPorId`, `validarPermissaoParaUpdate`
- **Variáveis locais**: `dadosParaUpdate`, `whereClause`, `permissoes`
- **Comentários**: `// Valida permissão para leitura`
- **Mensagens de erro**: `'Usuário não encontrado'`

## 📝 Padrões de Nomenclatura

### 🔍 **MÉTODOS DE BUSCA**
```typescript
// ✅ Padrão: buscar[Entity]Por[Criteria]
buscarUserPorId(id: string)
buscarUserPorEmail(email: string)
buscarUsersPorCompany(companyId: string)
buscarUsersPorPost(postId: string)
buscarTodosOsUsers(page: number, limit: number)
```

### ✅ **MÉTODOS DE VALIDAÇÃO**
```typescript
// ✅ Padrão: validarSe[Condition]
validarSeUserExiste(id: string)
validarSeCompanyExiste(companyId: string)
validarSeEmailEhUnico(email: string)
validarSeCPFEhUnico(cpf: string)

// ✅ Padrão: validarPermissaoPara[Action]
validarPermissaoParaRead()
validarPermissaoParaCreate()
validarPermissaoParaUpdate()
validarPermissaoParaDelete()
```

### 🏭 **MÉTODOS DE CRIAÇÃO**
```typescript
// ✅ Padrão: criarNovo[Entity]
criarNovoUser(dto: CreateUserDto)
criarNovoAdmin(dto: CreateAdminDto)
criarNovoPlatformAdmin(dto: CreatePlatformAdminDto)
criarNovoGuard(dto: CreateGuardDto)
```

### 🔧 **MÉTODOS DE CONSTRUÇÃO**
```typescript
// ✅ Padrão: construir[What]Para[Action]
construirWhereClauseParaRead(extra?: Prisma.UserWhereInput)
construirWhereClauseParaUpdate(id: string)
construirWhereClauseParaCreate()
construirWhereClauseParaDelete(id: string)
```

### 📊 **MÉTODOS DE PREPARAÇÃO**
```typescript
// ✅ Padrão: preparar[What]Para[Action]
prepararDadosParaUpdate(updateUserDto: UpdateUserDto)
prepararDadosParaCreate(createUserDto: CreateUserDto)
prepararRelatorioParaExport(dados: any[])
```

### 🔐 **MÉTODOS DE PERMISSÃO**
```typescript
// ✅ Padrão: validarSePode[Action]
validarSePodeExecutarAction(action: string)
validarSePodeCriarUserComRole(targetRole: Roles)
validarSePodeUpdateUserComRole(targetRole: Roles)
validarSePodeDeleteUserComRole(targetRole: Roles)
```

## 🏗️ Estrutura de Serviços

### 📋 **BaseUserService**
```typescript
// Métodos públicos - Operações CRUD
async buscarTodosOsUsers(page = 1, limit = 20)
async buscarUserPorId(id: string)
async buscarUserPorEmail(email: string)
async buscarUsersPorCompany(companyId: string)
async buscarUsersPorPost(postId: string)
async updateUser(id: string, updateUserDto: UpdateUserDto)
async desativarUser(id: string)
async reativarUser(id: string)

// Métodos protegidos - Validações
protected async validarSeUserExiste(id: string)
protected async validarSeCompanyExiste(companyId: string)
protected async validarSeEmailEhUnico(email: string, excludeUserId?: string)
protected async validarSeCPFEhUnico(cpf: string, excludeUserId?: string)
protected async validarSePhoneEhUnico(phone: string, excludeUserId?: string)

// Métodos protegidos - Permissões
protected validarPermissaoParaRead(targetRole?: Roles)
protected validarPermissaoParaCreate(targetRole?: Roles)
protected validarPermissaoParaUpdate(targetRole?: Roles)
protected async validarPermissaoParaDelete()

// Métodos privados - Utilitários
private validarPermissaoParaAction(action: string, targetRole?: Roles)
private construirWhereClauseComPermissao(action: string, extra?: Prisma.UserWhereInput)
private validarPermissaoParaRole(action: string, targetRole: Roles)
private prepararDadosParaUpdate(updateUserDto: UpdateUserDto): Record<string, any>
private validarResultadoDaBusca(result: any, entity: string, identifier: string, value: string): any
private calcularInformacoesDePaginacao(page: number, limit: number, total: number)
```

### 🔐 **UserPermissionService**
```typescript
// Validação de permissões básicas
validarSePodeExecutarAction(action: 'read' | 'update' | 'delete' | 'create'): boolean

// Validação de role por ação
validarSePodeCriarUserComRole(targetRole: Roles): boolean
validarSePodeUpdateUserComRole(targetRole: Roles): boolean
validarSePodeDeleteUserComRole(targetRole: Roles): boolean
validarOperationDoUser(action: string, targetRole: Roles): boolean

// Validação de campos
validarPermissionsDosFields(updateData: any): boolean

// Métodos privados
private extrairFieldsPermitidosDasRules(rules: any[]): string[]
private validarSePodeExecutarActionComRole(action: string, targetRole: Roles): boolean
```

### 🔍 **UserQueryService**
```typescript
// Construção de where clause
construirWhereClauseParaRead(baseWhere?: Prisma.UserWhereInput): Prisma.UserWhereInput
construirWhereClauseParaUpdate(id: string): Prisma.UserWhereInput
construirWhereClauseParaCreate(): Prisma.UserWhereInput
construirWhereClauseParaDelete(id: string): Prisma.UserWhereInput

// Métodos privados
private construirWhereClauseBase(action: string, additionalWhere?: Prisma.UserWhereInput): Prisma.UserWhereInput
```

### 🗄️ **UserRepository**
```typescript
// Operações básicas
async buscarMuitosUsers(where: Prisma.UserWhereInput, options?: { skip?: number; take?: number }, include?: Prisma.UserInclude)
async buscarPrimeiroUser(where: Prisma.UserWhereInput, include?: Prisma.UserInclude)
async buscarUserUnico(where: Prisma.UserWhereUniqueInput, include?: Prisma.UserInclude)
async criarNovoUser(data: Prisma.UserCreateInput)
async updateUserExistente(where: Prisma.UserWhereUniqueInput, data: Prisma.UserUpdateInput)
async deleteUserPermanentemente(where: Prisma.UserWhereUniqueInput)

// Operações específicas
async buscarUserComRelations(id: string)
async conectarUserAosPosts(userId: string, postIds: string[])
async contarQuantidadeDeUsers(where: Prisma.UserWhereInput)

// Métodos privados
private obterCompanyIdDoContext(): string | null
private aplicarCompanyIdAosDadosDeCreate(data: Prisma.UserCreateInput): Prisma.UserCreateInput
```

### ✅ **UserValidator**
```typescript
// Validações de unicidade
async validarSeEmailEhUnico(email: string, excludeUserId?: string)
async validarSeCPFEhUnico(cpf: string, excludeUserId?: string)
async validarSePhoneEhUnico(phone: string, excludeUserId?: string)

// Validações de existência
async validarSeCompanyExiste(companyId: string)
async validarSePostPertenceACompany(postId: string, companyId: string)
async validarSeUserExiste(id: string)

// Validações de negócio
async validarSeUserPodeSerDeletado(id: string)
```

### 🏭 **UserFactory**
```typescript
// Criação de diferentes tipos de usuário
criarNovoPlatformAdmin(dto: CreatePlatformAdminDto): Prisma.UserCreateInput
criarNovoAdmin(dto: CreateAdminDto): Prisma.UserCreateInput
criarNovoSupervisor(dto: CreateSupervisorDto): Prisma.UserCreateInput
criarNovoGuard(dto: CreateGuardDto): Prisma.UserCreateInput
criarNovoHR(dto: CreateHRDto): Prisma.UserCreateInput
criarNovoPostSupervisor(dto: CreatePostSupervisorDto): Prisma.UserCreateInput
criarNovoPostResident(dto: CreatePostResidentDto): Prisma.UserCreateInput

// Métodos privados
private hashPasswordDoUser(password: string): string
```

## 🎮 Controllers

### 📋 **UsersController**
```typescript
// Endpoints de busca
@Get() obterTodosOsUsers(@Query('page') page: string, @Query('limit') limit: string)
@Get(':id') obterUserPorId(@Param('id') id: string)

// Endpoints de criação
@Post('platform-admin') criarNovoPlatformAdmin(@Body() dto: CreatePlatformAdminDto)
@Post('admin') criarNovoAdmin(@Body() dto: CreateAdminDto)
@Post('supervisor') criarNovoSupervisor(@Body() dto: CreateSupervisorDto)
@Post('guard') criarNovoGuard(@Body() dto: CreateGuardDto)
@Post('hr') criarNovoHR(@Body() dto: CreateHRDto)
@Post('post-supervisor') criarNovoPostSupervisor(@Body() dto: CreatePostSupervisorDto)
@Post('post-resident') criarNovoPostResident(@Body() dto: CreatePostResidentDto)

// Endpoints de atualização e exclusão
@Patch(':id') updateDadosDoUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto)
@Delete(':id') removeUserDoSistema(@Param('id') id: string)
@Post(':id/restore') restoreUserDeletado(@Param('id') id: string)
```

## 📊 Exemplos de Implementação

### ✅ **Exemplo Correto:**
```typescript
async buscarUserPorId(id: string) {
  this.validarPermissaoParaRead();
  const whereClause = this.construirWhereClauseComPermissao('read', { id });
  const user = await this.userRepository.buscarPrimeiroUser(whereClause);
  return this.validarResultadoDaBusca(user, 'User', 'id', id);
}

async updateUser(id: string, updateUserDto: UpdateUserDto) {
  this.validarPermissaoParaUpdate();
  const dadosParaUpdate = this.prepararDadosParaUpdate(updateUserDto);
  this.userPermissionService.validarPermissionsDosFields(dadosParaUpdate);
  return this.userRepository.updateUserExistente({ id }, dadosParaUpdate);
}
```

### ❌ **Exemplos Incorretos:**
```typescript
// ❌ Misturar idiomas inconsistentemente
buscarUsuarioPorId(id) // "Usuario" deveria ser "User"
validarSeEmpresaExiste(companyId) // "Empresa" deveria ser "Company"

// ❌ Usar nomes genéricos
getAll() // Deveria ser buscarTodosOsUsers()
update() // Deveria ser updateUser()

// ❌ Não seguir padrões estabelecidos
findUserById() // Deveria ser buscarUserPorId()
validateUserExists() // Deveria ser validarSeUserExiste()
```

## 🔄 Processo de Refatoração

### 📋 **Checklist para Refatoração:**
1. ✅ Identificar todos os métodos que precisam ser renomeados
2. ✅ Aplicar padrões estabelecidos neste documento
3. ✅ Atualizar todas as chamadas dos métodos
4. ✅ Atualizar documentação e comentários
5. ✅ Executar testes para garantir funcionamento
6. ✅ Revisar consistência em todo o módulo

### 🎯 **Ordem de Implementação:**
1. **BaseUserService** (métodos privados primeiro)
2. **UserPermissionService**
3. **UserQueryService**
4. **UserRepository**
5. **UserValidator**
6. **UserFactory**
7. **UsersController**
8. **Serviços específicos** (Admin, HR, etc.)

## 📚 Referências

- **NestJS Documentation**: https://docs.nestjs.com/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **CASL Documentation**: https://casl.js.org/

---

**Última atualização**: Dezembro 2025  
**Versão**: 1.0  
**Responsável**: Equipe de Desenvolvimento TEMPLATE_LOBOCODE 