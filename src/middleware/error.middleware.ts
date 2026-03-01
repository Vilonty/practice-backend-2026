import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public errors?: any[];

  constructor(message: string, statusCode: number = 500, errors?: any[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.stack);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // Ошибки валидации Sequelize
  if (err.name === 'SequelizeValidationError') {
    res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
      errors: (err as any).errors.map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    });
    return;
  }

  // Ошибки уникальности Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({
      success: false,
      message: 'Такой ресурс уже существует',
      errors: (err as any).errors.map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    });
    return;
  }

  // Неизвестная ошибка
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера',
  });
};