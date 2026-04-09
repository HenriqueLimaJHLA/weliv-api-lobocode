const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testando conexão com o banco...');
    await prisma.$connect();
    console.log('✅ Conectado com sucesso!');
    
    console.log('📊 Verificando dados existentes...');
    const userCount = await prisma.user.count();
    console.log(`👥 Usuários: ${userCount}`);
    
    const companyCount = await prisma.company.count();
    console.log(`🏢 Empresas: ${companyCount}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
