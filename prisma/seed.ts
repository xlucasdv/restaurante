import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Hash real das senhas com bcrypt
  const senhaHash = await bcrypt.hash('123456', 10);
  console.log('🔐 Hash de senha gerado com bcrypt');

  // 1. Unidade
  const unidade = await prisma.unidade.upsert({
    where: { id: 'unidade-1' },
    update: {},
    create: {
      id: 'unidade-1',
      nome: 'Matriz',
      endereco: 'Av. Principal, 100',
      ativo: true
    }
  });
  console.log('✅ Unidade criada:', unidade.nome);

  // 2. Produtos com estoque
  const produtos = await prisma.produto.createMany({
  data: [
    { 
      id: 'produto-1', 
      unidadeId: unidade.id, 
      nome: 'X-Burger', 
      preco: 25.00,
      descricao: 'Hambúrguer artesanal com queijo e salada',
      categoria: 'LANCHE'
    },
    { 
      id: 'produto-2', 
      unidadeId: unidade.id, 
      nome: 'Batata Frita', 
      preco: 12.00,
      descricao: 'Porção de batatas fritas crocantes',
      categoria: 'ACOMPANHAMENTO'
    },
    { 
      id: 'produto-3', 
      unidadeId: unidade.id, 
      nome: 'Refrigerante', 
      preco: 6.00,
      descricao: 'Lata 350ml',
      categoria: 'BEBIDA'
    }
  ]
});
  console.log('✅ Produtos criados:', produtos.count);

  await prisma.estoque.createMany({
    data: [
      { produtoId: 'produto-1', qtdAtual: 50 },
      { produtoId: 'produto-2', qtdAtual: 100 },
      { produtoId: 'produto-3', qtdAtual: 80 }
    ]
  });
  console.log('✅ Estoque inicializado');

  // 3. Usuários com diferentes perfis
  const cliente = await prisma.usuario.upsert({
    where: { id: 'cliente-1' },
    update: {},
    create: {
      id: 'cliente-1',
      nome: 'Cliente Teste',
      email: 'cliente@teste.com',
      senhaHash: senhaHash,
      perfil: 'CLIENTE',
      fidelidade: {
        create: { pontos: 150, consentimento: true }
      }
    }
  });
  console.log('✅ Cliente criado:', cliente.email);

  const atendente = await prisma.usuario.upsert({
    where: { id: 'atendente-1' },
    update: {},
    create: {
      id: 'atendente-1',
      nome: 'Atendente Teste',
      email: 'atendente@teste.com',
      senhaHash: senhaHash,
      perfil: 'ATENDENTE'
    }
  });
  console.log('✅ Atendente criado:', atendente.email);

  const cozinha = await prisma.usuario.upsert({
    where: { id: 'cozinha-1' },
    update: {},
    create: {
      id: 'cozinha-1',
      nome: 'Cozinha Teste',
      email: 'cozinha@teste.com',
      senhaHash: senhaHash,
      perfil: 'COZINHA'
    }
  });
  console.log('✅ Cozinha criado:', cozinha.email);

  const gerente = await prisma.usuario.upsert({
    where: { id: 'gerente-1' },
    update: {},
    create: {
      id: 'gerente-1',
      nome: 'Gerente Teste',
      email: 'gerente@teste.com',
      senhaHash: senhaHash,
      perfil: 'GERENTE'
    }
  });
  console.log('✅ Gerente criado:', gerente.email);

  console.log('\n🎉 Seed concluído com sucesso!');
  console.log('\n📋 Usuários para teste:');
  console.log('   - cliente@teste.com / 123456');
  console.log('   - atendente@teste.com / 643125');
  console.log('   - cozinha@teste.com / 134652');
  console.log('   - gerente@teste.com / 654321');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });