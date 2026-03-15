import { Router } from 'express';
import { body, query } from 'express-validator'; // Добавьте query
import { RoomController } from '../controllers/room.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();
const roomController = new RoomController();

// Валидация для создания/обновления номера
const roomValidation = [
  body('name').notEmpty().withMessage('Название обязательно').trim(),
  body('room_number').notEmpty().withMessage('Номер комнаты обязателен').trim(),
  body('room_type')
    .isIn(['standard', 'deluxe', 'suite', 'family'])
    .withMessage('Тип комнаты должен быть: standard, deluxe, suite, family'),
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Вместимость должна быть не менее 1'),
  body('has_air_conditioner').optional().isBoolean(),
  body('description').optional().trim(),
];

// ВАЖНО: Специфичные маршруты должны быть ПЕРЕД динамическими (/search перед /:id)
router.get(
  '/search',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
    query('roomType').optional().isIn(['standard', 'deluxe', 'suite', 'family']),
    query('capacity').optional().isInt({ min: 1 }).toInt(),
    query('hasAirConditioner').optional().isBoolean().toBoolean(),
    query('sortBy').optional().isIn(['id', 'capacity', 'name']),
    query('sortOrder').optional().isIn(['ASC', 'DESC']).toUpperCase()
  ],
  roomController.searchRooms
);

// Публичные маршруты (доступны всем)
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);  // Динамический маршрут должен быть ПОСЛЕ специфичных

// Маршруты только для админа
router.post(
  '/',
  authenticate,
  authorizeAdmin,
  roomValidation,
  roomController.createRoom
);

router.put(
  '/:id',
  authenticate,
  authorizeAdmin,
  roomValidation,
  roomController.updateRoom
);

router.delete(
  '/:id',
  authenticate,
  authorizeAdmin,
  roomController.deleteRoom
);

export default router;