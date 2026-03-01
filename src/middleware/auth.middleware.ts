import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt.utils';
import { AppError } from './error.middleware';

// Расширяем тип Request, чтобы добавить user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Проверка, что пользователь авторизован
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Требуется авторизация', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      throw new AppError('Недействительный или просроченный токен', 401);
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

// Проверка, что пользователь - админ
export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    throw new AppError('Требуются права администратора', 403);
  }
  next();
};

// Проверка, что пользователь - владелец ресурса или админ
export const authorizeOwner = (resourceUserId: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.user?.role === 'admin') {
      return next();
    }
    
    if (req.user?.id !== resourceUserId) {
      throw new AppError('У вас нет прав на это действие', 403);
    }
    
    next();
  };
};