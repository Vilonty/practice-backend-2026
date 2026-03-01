import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Валидация для регистрации
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Введите корректный email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен быть не менее 6 символов'),
  body('name')
    .notEmpty()
    .withMessage('Имя обязательно')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Имя должно быть от 2 до 50 символов'),
];

// Валидация для входа
const loginValidation = [
  body('email').isEmail().withMessage('Введите корректный email').normalizeEmail(),
  body('password').notEmpty().withMessage('Введите пароль'),
];

// Маршруты
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', authenticate, authController.getMe);

export default router;