import { Router } from 'express';
import { body } from 'express-validator';
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

// Публичные маршруты (доступны всем)
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);

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

// ВАЖНО: экспортируем по умолчанию
export default router;