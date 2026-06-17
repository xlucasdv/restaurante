import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt, { SignOptions } from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { Perfil } from '@prisma/client';
import { prisma } from './infrastructure/prisma';
import { authMiddleware } from './api/middlewares/auth';
import { roleMiddleware } from './api/middlewares/role';
import { pedidoController } from './api/controllers/pedidoController';
import { produtoController } from './api/controllers/produtoController';
import { errorHandler } from './api/middlewares/errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        perfil: Perfil;
      };
    }
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

try {
  const swaggerDocument = YAML.load(path.resolve(__dirname, '../openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('📖 Swagger UI disponível em http://localhost:' + PORT + '/api-docs');
} catch (error) {
  console.warn('⚠️  Swagger não configurado:', error);
}

app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    
    console.log('🔐 Tentativa de login:', email);
    
    if (!email || !senha) {
      return res.status(400).json({ 
        error: { code: 'CAMPOS_OBRIGATORIOS', message: 'email e senha são obrigatórios' } 
      });
    }
    
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });
    
    if (!usuario) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({ 
        error: { code: 'CREDENCIAIS_INVALIDAS', message: 'Email ou senha inválidos' } 
      });
    }
    
    console.log('✅ Usuário encontrado:', usuario.email);
    
    const secret = process.env.JWT_SECRET || 'fallback_secret_min_32_characters_here_12345';
    const expiresInValue = (process.env.JWT_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'];
    
    const signOptions: SignOptions = { 
      expiresIn: expiresInValue 
    };
    
    const accessToken = jwt.sign(
      { id: usuario.id, perfil: usuario.perfil },
      secret,
      signOptions
    );
    
    console.log('✅ Token gerado com sucesso');
    
    return res.status(200).json({
      token: accessToken,
      expiresIn: 900,
      usuario: { 
        id: usuario.id, 
        email: usuario.email, 
        nome: usuario.nome,
        perfil: usuario.perfil 
      }
    });
  } catch (error: any) {
    console.error('❌ [Login Error]', error);
    console.error('❌ Stack:', error.stack);
    return res.status(500).json({ 
      error: { 
        code: 'ERRO_INTERNO', 
        message: 'Falha na autenticação',
        details: error.message 
      } 
    });
  }
});

app.get('/produtos', produtoController.index);
app.get('/produtos/:id', produtoController.show);

app.post('/produtos', authMiddleware, roleMiddleware(['GERENTE']), produtoController.store);
app.put('/produtos/:id', authMiddleware, roleMiddleware(['GERENTE']), produtoController.update);
app.delete('/produtos/:id', authMiddleware, roleMiddleware(['GERENTE']), produtoController.delete);

app.post('/pedidos', authMiddleware, pedidoController.criar);
app.get('/pedidos', authMiddleware, pedidoController.listar);

app.get('/pedidos/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { itens: { include: { produto: true } }, pagamento: true }
    });
    
    if (!pedido) {
      return res.status(404).json({ error: { code: 'NAO_ENCONTRADO', message: 'Pedido não encontrado' } });
    }
    
    if (req.user?.perfil === 'CLIENTE' && pedido.clienteId !== req.user.id) {
      return res.status(403).json({ error: { code: 'ACESSO_NEGADO', message: 'Você só pode visualizar seus próprios pedidos' } });
    }
    
    return res.status(200).json(pedido);
  } catch (error: any) {
    return res.status(500).json({ error: { code: 'ERRO_INTERNO', message: error.message } });
  }
});

app.patch('/pedidos/:id/status', authMiddleware, roleMiddleware(['COZINHA', 'GERENTE']), pedidoController.atualizarStatus);

app.post('/pagamentos/mock', authMiddleware, roleMiddleware(['GERENTE', 'ATENDENTE']), pedidoController.pagar);

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

app.use(errorHandler);

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Banco de dados conectado');
    
    app.listen(PORT, () => {
      console.log(`🚀 API rodando em http://localhost:${PORT}`);
      console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`📦 Produtos: http://localhost:${PORT}/produtos`);
      console.log(`🛒 Pedidos: http://localhost:${PORT}/pedidos`);
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

process.on('SIGINT', async () => {
  console.log('\n🔌 Encerrando aplicação...');
  await prisma.$disconnect();
  console.log('✅ Banco desconectado. Até logo!');
  process.exit(0);
});
