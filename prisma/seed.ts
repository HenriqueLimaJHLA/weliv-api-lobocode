import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Roles, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export async function runSeed() {
    try {
        const existingCompany = await prisma.company.findFirst({
            where: {
                name: 'Weliv',
            },
        });

        if (existingCompany) {
            console.log('Company already exists:', existingCompany.name);
            return;
        }

        const company = await prisma.company.create({
            data: {
                name: 'Weliv',
            },
        });

        console.log('Company created:', company.name);

        const userAdmin = await prisma.user.create({
            data: {
                email: 'admin@weliv.com',
                login: 'adminWeliv',
                name: 'Admin Weliv',
                password: await hashPassword('AdminWeliv123'),
                role: Roles.SYSTEM_ADMIN,
                status: UserStatus.ACTIVE,
                cpf: '000.000.000-00',
                companyId: company.id,
            },
        });

        const userProfessional = await prisma.user.create({
            data: {
                email: 'ana.silva@clinica.com',
                login: 'ana.silva@clinica.com',
                name: 'Ana Silva',
                password: await hashPassword('AnaSilva123'),
                role: Roles.PROFESSIONAL,
                status: UserStatus.ACTIVE,
                cpf: '222.333.444-55',
                companyId: company.id,
            },
        });

        const userPatient = await prisma.user.create({
            data: {
                email: 'joao.santos@email.com',
                login: 'joao.santos@email.com',
                name: 'João Santos',
                password: await hashPassword('JoaoSantos123'),
                role: Roles.PATIENT,
                status: UserStatus.ACTIVE,
                cpf: '111.222.333-44',
            },
        });

        console.log('User Admin created:', userAdmin.email);
        console.log('User Professional created:', userProfessional.email);
        console.log('User Patient created:', userPatient.email);
    } catch (error) {
        console.error('Error creating user:', error);
    }
};