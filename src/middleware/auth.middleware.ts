import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import User from '../models/user';

interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      throw new AppError('Требуется авторизация', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    
    // Проверяем, что пользователь существует
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AppError('Пользователь не найден', 401);
    }

    // Добавляем пользователя в request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
      name: user.name
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Недействительный токен', 401));
    } else {
      next(error);
    }
  }
};

export const authorizeAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    next(new AppError('Требуются права администратора', 403));
  }
  next();
};