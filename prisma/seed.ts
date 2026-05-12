import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // 1. Unidade
  const unidade = await prisma.unidade.create({
    data: {
      id: 'unidade_mock_123',
      nome: 'Matriz',
      endereco: 'Av. Principal, 100',
      ativo: true
    }
  });

  // 2. Produtos com estoque
  await prisma.produto.createMany({
    data: [
      { id: 'prod_1', unidadeId: unidade.id, nome: 'X-Burger', preco: 25.00 },
      { id: 'prod_2', unidadeId: unidade.id, nome: 'Batata Frita', preco: 12.00 },
      { id: 'prod_3', unidadeId: unidade.id, nome: 'Refrigerante', preco: 6.00 }
    ]
  });

  await prisma.estoque.createMany({
    data: [
      { produtoId: 'prod_1', qtdAtual: 50 },
      { produtoId: 'prod_2', qtdAtual: 100 },
      { produtoId: 'prod_3', qtdAtual: 80 }
    ]
  });

  // 3. Usuário + Fidelidade
  await prisma.usuario.create({
    data: {
      id: 'user_mock_123',
      nome: 'Cliente Teste',
      email: 'cliente@teste.com',
      senhaHash: 'hash_mock_seguro',
      perfil: 'CLIENTE',
      fidelidade: {
        create: { pontos: 150, consentimento: true }
      }
    }
  });

  console.log('✅ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });