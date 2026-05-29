import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Roles, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export async function runSeed() {
    try {
        const company = await prisma.company.upsert({
            where: { id: 'seed-company-weliv' },
            update: {},
            create: {
                id: 'seed-company-weliv',
                name: 'Weliv',
            },
        });

        console.log('Company upserted:', company.name);

        const users = [
            {
                email: 'admin@weliv.com',
                login: 'adminWeliv',
                name: 'Admin Weliv',
                password: await hashPassword('AdminWeliv123'),
                role: Roles.SYSTEM_ADMIN,
                status: UserStatus.ACTIVE,
                cpf: '000.000.000-00',
                companyId: company.id,
            },
            {
                email: 'gestor@weliv.com',
                login: 'gestorWeliv',
                name: 'Gestor Clínica Weliv',
                password: await hashPassword('GestorWeliv123'),
                role: Roles.ADMIN,
                status: UserStatus.ACTIVE,
                cpf: '999.888.777-66',
                companyId: company.id,
            },
            {
                email: 'ana.silva@clinica.com',
                login: 'ana.silva@clinica.com',
                name: 'Ana Silva',
                password: await hashPassword('AnaSilva123'),
                role: Roles.PROFESSIONAL,
                status: UserStatus.ACTIVE,
                cpf: '222.333.444-55',
                companyId: company.id,
            },
            {
                email: 'joao.santos@email.com',
                login: 'joao.santos@email.com',
                name: 'João Santos',
                password: await hashPassword('JoaoSantos123'),
                role: Roles.PATIENT,
                status: UserStatus.ACTIVE,
                cpf: '111.222.333-44',
                companyId: null,
            },
        ];

        for (const user of users) {
            const { companyId, ...data } = user;
            const created = await prisma.user.upsert({
                where: { login: user.login },
                update: {},
                create: {
                    ...data,
                    ...(companyId ? { companyId } : {}),
                },
            });
            console.log(`User upserted [${created.role}]:`, created.email);
        }
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runSeed();
