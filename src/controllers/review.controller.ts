import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Review, User, Room } from '../models';
import { AppError } from '../middleware/error.middleware';
import { getPaginationParams, getPaginationMeta, getSortingParams } from '../utils/query.utils';
import sequelize from '../config/database';

export class ReviewController {
    
  // Создание отзыва
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError('Ошибка валидации', 400, errors.array());
      }

      if (!req.user) {
        throw new AppError('Не авторизован', 401);
      }

      const { roomId, rating, comment } = req.body;

      const room = await Room.findByPk(roomId);
      if (!room) {
        throw new AppError('Комната не найдена', 404);
      }

      const existingReview = await Review.findOne({
        where: {
          user_id: req.user.id,
          room_id: roomId
        }
      });

      if (existingReview) {
        throw new AppError('Вы уже оставили отзыв на эту комнату', 400);
      }

      const review = await Review.create({
        user_id: req.user.id,
        room_id: roomId,
        rating,
        comment
      });

      // Получаем созданный отзыв с данными пользователя
      const reviewWithUser = await Review.findByPk(review.id, {
        include: [{
          model: User,
          as: 'user', // Добавляем алиас
          attributes: ['id', 'name']
        }]
      });

      res.status(201).json({
        success: true,
        data: reviewWithUser
      });
    } catch (error) {
      next(error);
    }
  }

  // Получение отзывов для комнаты (с пагинацией)
  public async getRoomReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roomId = parseInt(req.params.roomId);
      if (isNaN(roomId)) {
        throw new AppError('Некорректный ID комнаты', 400);
      }

      const { page, limit } = getPaginationParams(req.query);
      const offset = (page - 1) * limit;
      const order = getSortingParams(req.query, [['created_at', 'DESC']]);

      const { count, rows } = await Review.findAndCountAll({
        where: { room_id: roomId },
        include: [{
          model: User,
          as: 'user', // Добавляем алиас
          attributes: ['id', 'name']
        }],
        limit,
        offset,
        order
      });

      // Вычисляем средний рейтинг
      const averageRatingResult = await Review.findAll({
        where: { room_id: roomId },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating']
        ],
        raw: true
      });

      let averageRating = 0;
      if (averageRatingResult && averageRatingResult.length > 0) {
        const avgValue = (averageRatingResult[0] as any).averageRating;
        if (avgValue) {
          averageRating = Math.round(parseFloat(avgValue) * 10) / 10;
        }
      }

      res.json({
        success: true,
        data: rows,
        averageRating,
        pagination: getPaginationMeta(count, page, limit)
      });
    } catch (error) {
      next(error);
    }
  }

  // Получение отзывов пользователя
  public async getMyReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Не авторизован', 401);
      }

      const { page, limit } = getPaginationParams(req.query);
      const offset = (page - 1) * limit;
      const order = getSortingParams(req.query, [['created_at', 'DESC']]);

      const { count, rows } = await Review.findAndCountAll({
        where: { user_id: req.user.id },
        include: [{
          model: Room,
          as: 'room', // Добавляем алиас
          attributes: ['id', 'name', 'room_number']
        }],
        limit,
        offset,
        order
      });

      res.json({
        success: true,
        data: rows,
        pagination: getPaginationMeta(count, page, limit)
      });
    } catch (error) {
      next(error);
    }
  }

  // Обновление отзыва
  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('Некорректный ID', 400);
      }

      if (!req.user) {
        throw new AppError('Не авторизован', 401);
      }

      const review = await Review.findByPk(id);
      if (!review) {
        throw new AppError('Отзыв не найден', 404);
      }

      if (review.user_id !== req.user.id && req.user.role !== 'admin') {
        throw new AppError('Нет прав на редактирование этого отзыва', 403);
      }

      const { rating, comment } = req.body;
      await review.update({ rating, comment });

      const updatedReview = await Review.findByPk(id, {
        include: [{
          model: User,
          as: 'user', // Добавляем алиас
          attributes: ['id', 'name']
        }]
      });

      res.json({
        success: true,
        data: updatedReview
      });
    } catch (error) {
      next(error);
    }
  }

  // Удаление отзыва
  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw new AppError('Некорректный ID', 400);
      }

      if (!req.user) {
        throw new AppError('Не авторизован', 401);
      }

      const review = await Review.findByPk(id);
      if (!review) {
        throw new AppError('Отзыв не найден', 404);
      }

      if (review.user_id !== req.user.id && req.user.role !== 'admin') {
        throw new AppError('Нет прав на удаление этого отзыва', 403);
      }

      await review.destroy();

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}