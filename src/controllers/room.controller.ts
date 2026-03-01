import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import Room from '../models/rooms';
import { AppError } from '../middleware/error.middleware';

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
}