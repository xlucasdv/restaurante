import { Request, Response, NextFunction } from 'express';

export const roleMiddleware = (permitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.perfil || !permitidos.includes(req.user.perfil)) {
      return res.status(403).json({ error: { code: 'ACESSO_NEGADO', message: `Perfil "${req.user?.perfil}" não tem permissão para esta ação` } });
    }
    next();
  };
};