import { Router } from 'express';
import { body, query, param } from 'express-validator';
import { BookingController } from '../controllers/booking.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();
const bookingController = new BookingController();

// Валидация для создания бронирования
const createBookingValidation = [
  body('roomId')
    .isInt({ min: 1 })
    .withMessage('ID комнаты должен быть положительным числом'),
  body('date')
    .isDate()
    .withMessage('Некорректная дата')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Формат даты должен быть YYYY-MM-DD'),
  body('startTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Формат времени должен быть HH:MM'),
  body('endTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Формат времени должен быть HH:MM')
];

// Все маршруты требуют аутентификации
router.use(authenticate);

// Пользовательские маршруты
router.post(
  '/',
  createBookingValidation,
  bookingController.create
);

router.get(
  '/my',
  bookingController.getMyBookings
);

router.put(
  '/:id/cancel',
  param('id').isInt().withMessage('ID должен быть числом'),
  bookingController.cancel
);

// Публичные маршруты (доступны всем авторизованным)
router.get(
  '/rooms/:roomId/schedule',
  param('roomId').isInt().withMessage('ID комнаты должен быть числом'),
  query('date').isDate().withMessage('Некорректная дата'),
  bookingController.getRoomSchedule
);

router.get(
  '/available',
  [
    query('date').isDate().withMessage('Некорректная дата'),
    query('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Формат времени HH:MM'),
    query('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Формат времени HH:MM'),
    query('capacity').optional().isInt({ min: 1 }).withMessage('Вместимость должна быть числом'),
    query('roomType').optional().isIn(['standard', 'deluxe', 'suite', 'family'])
  ],
  bookingController.findAvailableRooms
);

// Административные маршруты
router.get(
  '/admin/all',
  authorizeAdmin,
  bookingController.getAllBookings
);

// Административные маршруты
router.get(
  '/admin/all',
  authorizeAdmin,
  bookingController.getAllBookings
);

// НОВЫЕ маршруты для админа
router.get(
  '/admin/search',
  authorizeAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('fromDate').optional().isDate(),
    query('toDate').optional().isDate(),
    query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'completed']),
    query('minDuration').optional().isInt({ min: 1 }),
    query('maxDuration').optional().isInt({ min: 1 })
  ],
  bookingController.searchBookings
);

router.get(
  '/admin/stats',
  authorizeAdmin,
  [
    query('fromDate').optional().isDate(),
    query('toDate').optional().isDate()
  ],
  bookingController.getStats
);

export default router;