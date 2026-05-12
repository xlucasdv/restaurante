import { Request, Response } from 'express';
import { prisma } from '../../infrastructure/prisma';
import { paymentMockGateway } from '../../infrastructure/paymentMock';

export const pedidoController = {
  async criar(req: Request, res: Response) {
    try {
      const { canalPedido, unidadeId, itens, idempotenciaKey } = req.body;
      const clienteId = req.user!.id;

      // Validação obrigatória de canalPedido
      const canaisValidos = ['APP', 'TOTEM', 'BALCAO', 'PICKUP', 'WEB'];
      if (!canalPedido || !canaisValidos.includes(canalPedido)) {
        return res.status(422).json({ 
          error: { 
            code: 'CAMPO_INVALIDO', 
            message: 'canalPedido é obrigatório e deve ser um dos valores: APP, TOTEM, BALCAO, PICKUP ou WEB' 
          } 
        });
      }

      // Idempotência
      if (idempotenciaKey) {
        const existente = await prisma.pedido.findUnique({ where: { idempotenciaKey } });
        if (existente) return res.status(200).json(existente);
      }

      // Verifica unidade
      const unidade = await prisma.unidade.findUnique({ where: { id: unidadeId, ativo: true } });
      if (!unidade) {
        return res.status(404).json({ error: { code: 'UNIDADE_NAO_ENCONTRADA', message: 'Unidade inválida ou inativa' } });
      }

      let valorTotal = 0;
      const itensCriados = [];

      for (const item of itens) {
        const produto = await prisma.produto.findFirst({ where: { id: item.produtoId, unidadeId } });
        if (!produto) {
          return res.status(404).json({ error: { code: 'PRODUTO_NAO_ENCONTRADO', message: `Produto ${item.produtoId} não existe na unidade` } });
        }

        const estoque = await prisma.estoque.findUnique({ where: { produtoId: produto.id } });
        if (!estoque || estoque.qtdAtual < item.quantidade) {
          return res.status(409).json({ error: { code: 'ESTOQUE_INSUFICIENTE', message: `Estoque insuficiente para ${produto.nome}` } });
        }

        // Debita estoque
        await prisma.estoque.update({
          where: { produtoId: produto.id },
          data: { qtdAtual: { decrement: item.quantidade } }
        });

        valorTotal += Number(produto.preco) * item.quantidade;
        itensCriados.push({ produtoId: produto.id, quantidade: item.quantidade, precoUnitario: produto.preco });
      }

      // Cria pedido
      const pedido = await prisma.pedido.create({
        data: {
          clienteId, unidadeId, canalPedido, valorTotal, idempotenciaKey,
          itens: { create: itensCriados }
        },
        include: { itens: { include: { produto: true } } }
      });

      // Log de auditoria
      await prisma.logAuditoria.create({
        data: { 
          usuarioId: clienteId, 
          acao: 'CRIAR_PEDIDO', 
          entidade: 'Pedido', 
          entidadeId: pedido.id, 
          detalhes: JSON.stringify({ canalPedido, valorTotal, itens: itens.length }) 
        }
      });

      return res.status(201).json(pedido);
    } catch (err: any) {
      console.error('[CriarPedido]', err);
      return res.status(err.status || 500).json({ error: { code: err.code || 'ERRO_INTERNO', message: err.message } });
    }
  },

    async listar(req: Request, res: Response) {
    try {
      const { canalPedido, status, page = '1', limit = '20' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const where: any = {};
      
      if (canalPedido) where.canalPedido = canalPedido;
      if (status) where.status = status;
      if (req.user?.perfil === 'CLIENTE') where.clienteId = req.user.id;

      const [data, total] = await Promise.all([
        prisma.pedido.findMany({ 
          where, 
          skip, 
          take: Number(limit), 
          orderBy: { criadoEm: 'desc' },
          include: { 
            itens: { 
              select: { 
                quantidade: true, 
                precoUnitario: true, 
                produto: { select: { nome: true } } 
              } 
            } 
          }
        }),
        prisma.pedido.count({ where })
      ]);

      return res.status(200).json({ 
        data, 
        meta: { page: Number(page), limit: Number(limit), total } 
      });
    } catch (err: any) {
      return res.status(500).json({ error: { code: 'ERRO_INTERNO', message: err.message } });
    }
  },

  async buscar(req: Request, res: Response) {
    const { id } = req.params;
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { itens: { include: { produto: true } }, pagamento: true }
    });
    if (!pedido) {
      return res.status(404).json({ error: { code: 'NAO_ENCONTRADO', message: 'Pedido não encontrado' } });
    }
    return res.status(200).json(pedido);
  },

  async atualizarStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validos = ['PREPARANDO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];
      
      if (!validos.includes(status)) {
        return res.status(422).json({ error: { code: 'STATUS_INVALIDO', message: 'Status inválido' } });
      }

      const pedido = await prisma.pedido.update({
        where: { id },
        data: { status }
      });

      // Log de auditoria
      await prisma.logAuditoria.create({
        data: {
          usuarioId: req.user!.id,
          acao: 'ATUALIZAR_STATUS_PEDIDO',
          entidade: 'Pedido',
          entidadeId: id,
          detalhes: JSON.stringify({ statusAnterior: pedido.status, novoStatus: status })
        }
      });

      return res.status(200).json(pedido);
    } catch (err: any) {
      return res.status(400).json({ error: { code: 'FALHA_ATUALIZACAO', message: err.message } });
    }
  },

  async pagar(req: Request, res: Response) {
    try {
      const { pedidoId, simularStatus } = req.body;
      if (!['APROVADO', 'RECUSADO'].includes(simularStatus)) {
        return res.status(400).json({ error: { code: 'PARAMETRO_INVALIDO', message: 'simularStatus deve ser APROVADO ou RECUSADO' } });
      }
      
      const resultado = await paymentMockGateway.processar(pedidoId, simularStatus);
      return res.status(200).json(resultado);
    } catch (err: any) {
      return res.status(400).json({ error: { code: 'FALHA_PAGAMENTO', message: err.message } });
    }
  }
};