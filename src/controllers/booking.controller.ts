import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import bookingService from '../services/booking.service';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class BookingController {
   
   // Создание бронирования
   
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Ошибка валидации', 400, errors.array());
      }

      // Проверяем, что пользователь авторизован
      if (!req.user) {
        throw new AppError('Не авторизован', 401);
      }

      const { roomId, date, startTime, endTime } = req.body;
      const userId = req.user.id;

      const booking = await bookingService.createBooking(
        userId,
        roomId,
        date,
        startTime,
        endTime
      );

      res.status(201).json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }


   // Отмена бронирования
   
  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        
      if (!req.user) {
        throw new AppError('Не авторизован', 401);
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('Некорректный ID бронирования', 400);
      }

      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const booking = await bookingService.cancelBooking(id, userId, isAdmin);

      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  
    // Получение бронирований текущего пользователя
  
  async getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
 
      if (!req.user) {
        throw new AppError('Не авторизован', 401);
      }

      const { status, fromDate, toDate } = req.query;
      
      const bookings = await bookingService.getUserBookings(req.user.id, {
        status: status as string,
        fromDate: fromDate as string,
        toDate: toDate as string
      });

      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  }

  
   // Получение всех бронирований (только для админа)
  
  async getAllBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      if (!req.user) {
        throw new AppError('Не авторизован', 401);
      }

      const { status, roomId, userId, fromDate, toDate } = req.query;

      const bookings = await bookingService.getAllBookings({
        status: status as string,
        roomId: roomId ? parseInt(roomId as string) : undefined,
        userId: userId ? parseInt(userId as string) : undefined,
        fromDate: fromDate as string,
        toDate: toDate as string
      });

      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  }

 
   // Получение расписания комнаты
  
  async getRoomSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomId = parseInt(req.params.roomId);
      if (isNaN(roomId)) {
        throw new AppError('Некорректный ID комнаты', 400);
      }

      const { date } = req.query;
      if (!date) {
        throw new AppError('Не указана дата', 400);
      }

      const schedule = await bookingService.getRoomSchedule(roomId, date as string);

      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      next(error);
    }
  }

  
   // Поиск свободных комнат

  async findAvailableRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, startTime, endTime, capacity, roomType } = req.query;

      if (!date || !startTime || !endTime) {
        throw new AppError('Не указаны дата и время', 400);
      }

      const rooms = await bookingService.findAvailableRooms(
        date as string,
        startTime as string,
        endTime as string,
        capacity ? parseInt(capacity as string) : undefined,
        roomType as string
      );

      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      next(error);
    }
  }
}