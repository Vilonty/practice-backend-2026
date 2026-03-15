import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op, WhereOptions } from 'sequelize';
import Room from '../models/rooms';
import { Review } from '../models';
import { AppError } from '../middleware/error.middleware';
import { 
  getPaginationParams, 
  getPaginationMeta, 
  getSortingParams 
} from '../utils/query.utils';
import sequelize from '../config/database';

// Создаем интерфейс для условий поиска
interface RoomWhereConditions {
  is_active: boolean;
  room_type?: string;
  capacity?: { [Op.gte]: number };
  has_air_conditioner?: boolean;
  [Op.or]?: Array<{
    [key: string]: { [Op.iLike]: string };
  }>;
}

export class RoomController {

  public async getAllRooms(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rooms = await Room.findAll({
        where: { is_active: true },
        order: [['id', 'ASC']],
      });
      
      res.json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getRoomById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const idParam = Array.isArray(req.params.id) 
        ? req.params.id[0] 
        : req.params.id;
      
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        throw new AppError('Некорректный ID', 400);
      }

      const room = await Room.findByPk(id);
      
      if (!room) {
        throw new AppError('Номер не найден', 404);
      }
      
      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  // Создать номер
  public async createRoom(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Ошибка валидации', 400, errors.array());
      }

      const room = await Room.create({
        ...req.body,
        is_active: true,
      });
      
      res.status(201).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  // Обновить номер
  public async updateRoom(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const idParam = Array.isArray(req.params.id) 
        ? req.params.id[0] 
        : req.params.id;
      
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        throw new AppError('Некорректный ID', 400);
      }

      const room = await Room.findByPk(id);
      
      if (!room) {
        throw new AppError('Номер не найден', 404);
      }
      
      await room.update(req.body);
      
      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  // Удалить номер
  public async deleteRoom(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const idParam = Array.isArray(req.params.id) 
        ? req.params.id[0] 
        : req.params.id;
      
      const id = parseInt(idParam);
      
      if (isNaN(id)) {
        throw new AppError('Некорректный ID', 400);
      }

      const room = await Room.findByPk(id);
      
      if (!room) {
        throw new AppError('Номер не найден', 404);
      }
      
      await room.update({ is_active: false });
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Поиск комнат с фильтрацией и пагинацией
  public async searchRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Получаем параметры пагинации
      const { page, limit } = getPaginationParams(req.query);
      const offset = (page - 1) * limit;
      
      // Получаем параметры сортировки
      const order = getSortingParams(req.query, [['id', 'ASC']]);

      // Создаем условие WHERE с правильной типизацией
      const whereClause: any = { 
        is_active: true 
      };

      // Фильтры
      if (req.query.roomType) {
        whereClause.room_type = req.query.roomType;
      }

      if (req.query.capacity) {
        whereClause.capacity = { 
          [Op.gte]: parseInt(req.query.capacity as string) 
        };
      }

      if (req.query.hasAirConditioner === 'true') {
        whereClause.has_air_conditioner = true;
      }

      // Поиск по тексту - используем любой тип для обхода проверки TypeScript
      if (req.query.search) {
        const searchTerm = `%${req.query.search}%`;
        whereClause[Op.or] = [
          { name: { [Op.iLike]: searchTerm } },
          { description: { [Op.iLike]: searchTerm } },
          { room_number: { [Op.iLike]: searchTerm } }
        ];
      }

      // Выполняем поиск с пагинацией
      const { count, rows } = await Room.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order
      });

      // Добавляем средний рейтинг для каждой комнаты
      const roomsWithRating = await Promise.all(
        rows.map(async (room) => {
          // Получаем средний рейтинг
          const avgRatingResult = await Review.findAll({
            where: { room_id: room.id },
            attributes: [
              [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
            ],
            raw: true
          });

          // Получаем количество отзывов
          const reviewCount = await Review.count({
            where: { room_id: room.id }
          });

          // Безопасно извлекаем средний рейтинг
          let averageRating = null;
          if (avgRatingResult && avgRatingResult.length > 0) {
            const avgValue = (avgRatingResult[0] as any).averageRating;
            if (avgValue) {
              averageRating = Math.round(parseFloat(avgValue) * 10) / 10;
            }
          }

          return {
            ...room.toJSON(),
            averageRating,
            reviewCount
          };
        })
      );

      // Отправляем ответ с пагинацией
      res.json({
        success: true,
        data: roomsWithRating,
        pagination: getPaginationMeta(count, page, limit)
      });
    } catch (error) {
      next(error);
    }
  }
}