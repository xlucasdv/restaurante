import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: { 
        code: 'NAO_AUTENTICADO', 
        message: 'Token não fornecido ou formato inválido' 
      } 
    });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // ✅ IMPORTANTE: Usar o MESMO secret do login
    const secret = process.env.JWT_SECRET || 'fallback_secret_min_32_characters_here_12345';
    
    const decoded = jwt.verify(token, secret) as { id: string; perfil: string };
    
    req.user = {
      id: decoded.id,
      perfil: decoded.perfil as any
    };
    
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error);
    return res.status(401).json({ 
      error: { 
        code: 'TOKEN_INVALIDO', 
        message: 'Token inválido ou expirado' 
      } 
    });
  }
};