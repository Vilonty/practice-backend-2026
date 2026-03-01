# API Endpoints

Базовый URL: `/api/v1`

## Аутентификация
- `POST /auth/register` - регистрация
- `POST /auth/login` - вход (получение JWT)
- `POST /auth/logout` - выход
- `GET /auth/me` - информация о текущем пользователе

## Ресурсы (только для админа: create, update, delete)
- `GET /resources` - список всех ресурсов (с фильтрацией)
- `GET /resources/:id` - детали ресурса
- `POST /resources` - создать ресурс (admin)
- `PUT /resources/:id` - обновить ресурс (admin)
- `DELETE /resources/:id` - удалить ресурс (admin)

## Бронирования (эндпоинт 3)
- `GET /bookings/my` - мои бронирования
- `POST /bookings` - создать бронирование
- `PUT /bookings/:id/cancel` - отменить бронирование
- `GET /resources/:id/schedule?date=...` - расписание ресурса
- `GET /resources/available?date=&start=&end=&capacity=...` - поиск свободных

## Отзывы (эндпоинт 4)
- `POST /reviews` - оставить отзыв
- `GET /resources/:id/reviews` - отзывы о ресурсе