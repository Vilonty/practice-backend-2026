import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ReviewController } from '../controllers/review.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();
const reviewController = new ReviewController();

// Валидация для отзыва
const reviewValidation = [
  body('roomId').isInt({ min: 1 }).withMessage('ID комнаты должен быть числом'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Рейтинг должен быть от 1 до 5'),
  body('comment').optional().isString().trim().isLength({ max: 1000 })
];

// Публичные маршруты
router.get(
  '/room/:roomId',
  param('roomId').isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['created_at', 'rating']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  reviewController.getRoomReviews
);

// Защищенные маршруты
router.use(authenticate);

router.post('/', reviewValidation, reviewController.create);
router.get('/my', reviewController.getMyReviews);
router.put(
  '/:id',
  param('id').isInt(),
  reviewValidation,
  reviewController.update
);
router.delete(
  '/:id',
  param('id').isInt(),
  reviewController.delete
);

export default router;