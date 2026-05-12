import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'NAO_AUTENTICADO', message: 'Token não fornecido ou formato inválido' } });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string; perfil: string };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: { code: 'TOKEN_INVALIDO', message: 'Token inválido ou expirado' } });
  }
};