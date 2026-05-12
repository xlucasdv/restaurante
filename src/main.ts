// ✅ CRÍTICO: Carrega variáveis de ambiente ANTES de qualquer outro import
import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { prisma } from './infrastructure/prisma';
import { authMiddleware } from './api/middlewares/auth';
import { roleMiddleware } from './api/middlewares/role';
import { pedidoController } from './api/controllers/pedidoController';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(helmet());
app.use(express.json());

// ==================== ROTAS PÚBLICAS ====================
app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({ 
        error: { code: 'CAMPOS_OBRIGATORIOS', message: 'email e senha são obrigatórios' } 
      });
    }
    
    // Mock: aceita qualquer credencial para desenvolvimento
    const usuario = { id: 'user_mock_123', email, perfil: 'CLIENTE' };
    
    // JWT: garantindo tipos seguros
    const secret = process.env.JWT_SECRET || 'fallback_secret_min_32_characters_here_12345';
    const expiresIn = process.env.JWT_EXPIRES_IN || '15m';
    
    const accessToken = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      secret,
      { expiresIn }
    );
    
    return res.status(200).json({
      accessToken,
      expiresIn: 900,
      user: { id: usuario.id, email: usuario.email, perfil: usuario.perfil }
    });
  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({ error: { code: 'ERRO_INTERNO', message: 'Falha na autenticação' } });
  }
});

// ==================== ROTAS PROTEGIDAS ====================

// Pedidos
app.post('/pedidos', authMiddleware, pedidoController.criar);
app.get('/pedidos', authMiddleware, pedidoController.listar);

// Buscar pedido por ID (rota simples inline para evitar erro se não existir no controller)
app.get('/pedidos/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { itens: { include: { produto: true } }, pagamento: true }
    });
    
    if (!pedido) {
      return res.status(404).json({ error: { code: 'NAO_ENCONTRADO', message: 'Pedido não encontrado' } });
    }
    
    // Se for cliente, só pode ver seus próprios pedidos
    if (req.user?.perfil === 'CLIENTE' && pedido.clienteId !== req.user.id) {
      return res.status(403).json({ error: { code: 'ACESSO_NEGADO', message: 'Você só pode visualizar seus próprios pedidos' } });
    }
    
    return res.status(200).json(pedido);
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'ERRO_INTERNO', message: error.message } });
  }
});

app.patch('/pedidos/:id/status', authMiddleware, roleMiddleware(['COZINHA', 'GERENTE']), pedidoController.atualizarStatus);

// Pagamento Mock
app.post('/pagamentos/mock', authMiddleware, roleMiddleware(['GERENTE', 'ATENDENTE']), pedidoController.pagar);

// Fidelidade
app.get('/fidelidade/saldo', authMiddleware, async (req: Request, res: Response) => {
  try {
    const fidelidade = await prisma.fidelidade.findUnique({ where: { clienteId: req.user!.id } });
    
    if (!fidelidade) {
      return res.status(404).json({ error: { code: 'NAO_ENCONTRADO', message: 'Programa de fidelidade não ativado' } });
    }
    
    return res.status(200).json({ 
      pontos: fidelidade.pontos, 
      consentimentoLGPD: fidelidade.consentimento 
    });
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'ERRO_INTERNO', message: error.message } });
  }
});

// Swagger/OpenAPI (rota simples para documentação)
app.get('/api-docs', (req: Request, res: Response) => {
  res.json({
    message: 'Documentação da API',
    endpoints: [
      { method: 'POST', path: '/auth/login', description: 'Autenticação' },
      { method: 'POST', path: '/pedidos', description: 'Criar pedido' },
      { method: 'GET', path: '/pedidos', description: 'Listar pedidos' },
      { method: 'GET', path: '/pedidos/:id', description: 'Buscar pedido' },
      { method: 'PATCH', path: '/pedidos/:id/status', description: 'Atualizar status' },
      { method: 'POST', path: '/pagamentos/mock', description: 'Mock de pagamento' },
      { method: 'GET', path: '/fidelidade/saldo', description: 'Saldo de fidelidade' }
    ],
    hint: 'Use o Insomnia com o arquivo openapi.yaml para testes completos'
  });
});

// ==================== ERROR HANDLER GLOBAL ====================
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err);
  
  // Erros conhecidos do Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({ error: { code: 'CONFLITO', message: 'Recurso já existe' } });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: { code: 'NAO_ENCONTRADO', message: 'Recurso não encontrado' } });
  }
  
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'ERRO_INTERNO';
  const message = err.message || 'Falha interna no servidor';
  
  res.status(status).json({ error: { code, message, details: err.details || null } });
});

// ==================== INICIALIZAÇÃO ====================
async function start() {
  try {
    // Testa conexão com o banco
    await prisma.$connect();
    console.log('✅ Banco de dados conectado');
    
    app.listen(PORT, () => {
      console.log(`🚀 API rodando em http://localhost:${PORT}`);
      console.log(`📖 Documentação: http://localhost:${PORT}/api-docs`);
    });
  } catch (error: any) {
    console.error('❌ Falha ao conectar no banco:', error?.message || error);
    console.error('\n💡 Dica: Verifique se:');
    console.error('   1. O arquivo .env existe na raiz do projeto');
    console.error('   2. DATABASE_URL está configurado corretamente');
    console.error('   3. O banco de dados está rodando e acessível');
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔌 Encerrando aplicação...');
  await prisma.$disconnect();
  console.log('✅ Banco desconectado. Até logo!');
  process.exit(0);
});