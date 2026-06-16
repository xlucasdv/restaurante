import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema de validação para criação de produto
const createProdutoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  preco: z.number().positive('Preço deve ser maior que zero'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  disponivel: z.boolean().optional().default(true),
  unidadeId: z.string().min(1, 'ID da unidade é obrigatório'),
});

// Schema de validação para atualização de produto
const updateProdutoSchema = z.object({
  nome: z.string().min(3).optional(),
  descricao: z.string().min(10).optional(),
  preco: z.number().positive().optional(),
  categoria: z.string().min(1).optional(),
  disponivel: z.boolean().optional(),
  unidadeId: z.string().min(1).optional(),
});

export const produtoController = {
  // LISTAR TODOS OS PRODUTOS (público)
  async index(req: Request, res: Response) {
    try {
      const { categoria, disponivel, unidadeId } = req.query;

      const filtros: any = {};

      if (categoria) {
        filtros.categoria = String(categoria);
      }

      if (disponivel !== undefined) {
        filtros.disponivel = disponivel === 'true';
      }

      if (unidadeId) {
        filtros.unidadeId = String(unidadeId);
      }

      const produtos = await prisma.produto.findMany({
        where: filtros,
        include: {
          unidade: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          nome: 'asc',
        },
      });

      return res.status(200).json({
        success: true,
        data: produtos,
        count: produtos.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao listar produtos',
        message: error instanceof Error ? error.message : 'Erro interno do servidor',
      });
    }
  },

  // BUSCAR PRODUTO POR ID (público)
  async show(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const produto = await prisma.produto.findUnique({
        where: { id: String(id) },
        include: {
          unidade: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      if (!produto) {
        return res.status(404).json({
          success: false,
          error: 'Produto não encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        data: produto,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar produto',
        message: error instanceof Error ? error.message : 'Erro interno do servidor',
      });
    }
  },

  // CRIAR PRODUTO (apenas GERENTE)
  async store(req: Request, res: Response) {
    try {
      // Validar dados de entrada com Zod
      const validatedData = createProdutoSchema.parse(req.body);

      // Extrair unidadeId e separar os dados
      const { unidadeId, ...produtoData } = validatedData;

      // Criar produto conectando à unidade
      const produto = await prisma.produto.create({
        data: {
          ...produtoData,
          unidade: {
            connect: { id: unidadeId },
          },
        },
        include: {
          unidade: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Produto criado com sucesso',
        data: produto,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao criar produto',
        message: error instanceof Error ? error.message : 'Erro interno do servidor',
      });
    }
  },

  // ATUALIZAR PRODUTO (apenas GERENTE)
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validatedData = updateProdutoSchema.parse(req.body);

      // Verificar se produto existe
      const produtoExistente = await prisma.produto.findUnique({
        where: { id: String(id) },
      });

      if (!produtoExistente) {
        return res.status(404).json({
          success: false,
          error: 'Produto não encontrado',
        });
      }

      // Extrair unidadeId se existir
      const { unidadeId, ...updateData } = validatedData;

      // Preparar dados para update
      const data: any = { ...updateData };

      if (unidadeId) {
        data.unidade = {
          connect: { id: unidadeId },
        };
      }

      // Atualizar produto
      const produtoAtualizado = await prisma.produto.update({
        where: { id: String(id) },
        data,
        include: {
          unidade: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Produto atualizado com sucesso',
        data: produtoAtualizado,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar produto',
        message: error instanceof Error ? error.message : 'Erro interno do servidor',
      });
    }
  },

  // DELETAR PRODUTO (apenas GERENTE)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Verificar se produto existe
      const produto = await prisma.produto.findUnique({
        where: { id: String(id) },
      });

      if (!produto) {
        return res.status(404).json({
          success: false,
          error: 'Produto não encontrado',
        });
      }

      // Deletar produto
      await prisma.produto.delete({
        where: { id: String(id) },
      });

      return res.status(200).json({
        success: true,
        message: 'Produto excluído com sucesso',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir produto',
        message: error instanceof Error ? error.message : 'Erro interno do servidor',
      });
    }
  },
};