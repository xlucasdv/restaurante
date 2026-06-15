import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

// Interface para erros personalizados
export interface AppError {
  statusCode: number;
  message: string;
  code?: string;
}

// Classe de erro personalizado
export class CustomError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

// Middleware de tratamento de erro global
export const errorHandler = (
  err: Error | CustomError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Erro Zod (validação)
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Erro Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint failed
        return res.status(409).json({
          success: false,
          error: 'Conflito de dados',
          code: 'UNIQUE_CONSTRAINT',
          message: 'Já existe um registro com esses dados',
        });

      case 'P2025': // Record not found
        return res.status(404).json({
          success: false,
          error: 'Recurso não encontrado',
          code: 'NOT_FOUND',
          message: 'O recurso solicitado não existe',
        });

      case 'P2003': // Foreign key constraint failed
        return res.status(400).json({
          success: false,
          error: 'Violação de chave estrangeira',
          code: 'FOREIGN_KEY_CONSTRAINT',
          message: 'A referência informada não existe',
        });

      default:
        return res.status(500).json({
          success: false,
          error: 'Erro no banco de dados',
          code: 'DATABASE_ERROR',
          message: 'Ocorreu um erro ao processar sua solicitação',
        });
    }
  }

  // Erro personalizado (CustomError)
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code || 'CUSTOM_ERROR',
    });
  }

  // Erro genérico não tratado
  return res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Tente novamente mais tarde',
  });
};

// Helper functions para criar erros comuns
export const errors = {
  notFound: (resource: string = 'Recurso') => 
    new CustomError(404, `${resource} não encontrado`, 'NOT_FOUND'),
  
  unauthorized: (message: string = 'Não autorizado') => 
    new CustomError(401, message, 'UNAUTHORIZED'),
  
  forbidden: (message: string = 'Acesso negado') => 
    new CustomError(403, message, 'FORBIDDEN'),
  
  badRequest: (message: string = 'Requisição inválida') => 
    new CustomError(400, message, 'BAD_REQUEST'),
  
  conflict: (message: string = 'Conflito de dados') => 
    new CustomError(409, message, 'CONFLICT'),
};