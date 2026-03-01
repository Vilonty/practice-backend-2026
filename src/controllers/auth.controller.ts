import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/user';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateToken } from '../utils/jwt.utils';
import { AppError } from '../middleware/error.middleware';

export class AuthController {
  // Регистрация нового пользователя
  public async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Проверка валидации
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Ошибка валидации', 400, errors.array());
      }

      const { email, password, name } = req.body;

      // Проверка, существует ли пользователь
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('Пользователь с таким email уже существует', 400);
      }

      // Хеширование пароля
      const password_hash = await hashPassword(password);

      // Создание пользователя
      const user = await User.create({
        email,
        password_hash,
        name,
        role: 'user', // по умолчанию обычный пользователь
      });

      // Генерация токена
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      // Отправка ответа (без пароля)
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Вход в систему
  public async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Ошибка валидации', 400, errors.array());
      }

      const { email, password } = req.body;

      // Поиск пользователя
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new AppError('Неверный email или пароль', 401);
      }

      // Проверка пароля
      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new AppError('Неверный email или пароль', 401);
      }

      // Генерация токена
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Получение информации о текущем пользователе
  public async getMe(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await User.findByPk(req.user?.id, {
        attributes: { exclude: ['password_hash'] },
      });

      if (!user) {
        throw new AppError('Пользователь не найден', 404);
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}