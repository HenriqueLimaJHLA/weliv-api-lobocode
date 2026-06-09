import { PrismaClient, Roles, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function runSeed() {
  console.log('🌱 Iniciando seed do banco de dados...');
  try {
    await seedAdminUser();
    await seedRegularUser();
    console.log('✅ Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  }
}

async function seedAdminUser() {
  const email = 'admin@templatelobocode.com';
  const cpf = '000.000.000-00';
  const hashedPassword = await bcrypt.hash('Admin123@', 10);
  return upsertUserByEmailOrCpf({
    email,
    cpf,
    logName: 'admin',
    data: {
      name: 'Administrador do Sistema',
      email,
      password: hashedPassword,
      role: Roles.ADMIN,
      status: UserStatus.ACTIVE,
      phone: '(11) 99999-9999',
      cpf,
      city: 'São Paulo',
      state: 'SP',
    },
  });
}

async function seedRegularUser() {
  const email = 'user@templatelobocode.com';
  const cpf = '111.111.111-11';
  const hashedPassword = await bcrypt.hash('User123@', 10);
  return upsertUserByEmailOrCpf({
    email,
    cpf,
    logName: 'regular',
    data: {
      name: 'João Silva',
      email,
      password: hashedPassword,
      role: Roles.USER,
      status: UserStatus.ACTIVE,
      phone: '(11) 98888-8888',
      cpf,
      city: 'São Paulo',
      state: 'SP',
      address: 'Rua das Flores, 123',
      zipCode: '01234-567',
    },
  });
}

type SeedUserInput = {
  email: string;
  cpf: string;
  logName: string;
  data: {
    name: string;
    email: string;
    password: string;
    role: Roles;
    status: UserStatus;
    phone: string;
    cpf: string;
    city: string;
    state: string;
    address?: string;
    zipCode?: string;
  };
};

async function upsertUserByEmailOrCpf({
  email,
  cpf,
  logName,
  data,
}: SeedUserInput) {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { cpf }],
    },
  });

  if (existingUser) {
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
      data,
    });
    console.log(`ℹ️  Usuário ${logName} já existia, dados atualizados`);
    return updatedUser;
  }

  const createdUser = await prisma.user.create({ data });
  console.log(`✅ Usuário ${logName} criado: ${email}`);
  return createdUser;
}

if (require.main === module) {
  runSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
