import { Router } from 'express';
import { authMiddleware } from './middlewares/auth';
import { roleMiddleware } from './middlewares/role';
import { errorHandler } from './middlewares/errorHandler';
import { produtoController } from './controllers/produtoController';
import { pedidoController } from './controllers/pedidoController';

const router = Router();

// Rotas de produtos
router.get('/produtos', produtoController.index);
router.get('/produtos/:id', produtoController.show);
router.post('/produtos', authMiddleware, roleMiddleware(['GERENTE']), produtoController.store);
router.put('/produtos/:id', authMiddleware, roleMiddleware(['GERENTE']), produtoController.update);
router.delete('/produtos/:id', authMiddleware, roleMiddleware(['GERENTE']), produtoController.delete);

// Rotas de pedidos
router.post('/pedidos', authMiddleware, pedidoController.criar);
router.get('/pedidos', authMiddleware, pedidoController.listar);
router.get('/pedidos/:id', authMiddleware, pedidoController.buscar);
router.patch('/pedidos/:id/status', authMiddleware, roleMiddleware(['COZINHA', 'GERENTE']), pedidoController.atualizarStatus);

// Middleware de erro global (DEVE SER O ÚLTIMO)
router.use(errorHandler);

export { router };