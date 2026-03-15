import request from 'supertest';
import app from '../app';
import { sequelize, User, Room } from '../models';

describe('Booking Controller', () => {
  let token: string;
  let adminToken: string;
  let roomId: number;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    // Создаем тестовые данные
    const room = await Room.create({
      name: 'Test Room',
      room_number: '999',
      room_type: 'standard',
      capacity: 2,
      is_active: true
    });
    roomId = room.id;

    // Получаем токен
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'user123'
      });
    token = loginRes.body.data.token;
  });

  describe('POST /api/v1/bookings', () => {
    it('should create booking with auth', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomId,
          date: '2025-01-20',
          startTime: '10:00',
          endTime: '12:00'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should not create booking without auth', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .send({
          roomId,
          date: '2025-01-20',
          startTime: '10:00',
          endTime: '12:00'
        });
      
      expect(res.statusCode).toBe(401);
    });

    it('should not create booking for same time', async () => {
      // Первое бронирование
      await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomId,
          date: '2025-01-21',
          startTime: '14:00',
          endTime: '16:00'
        });

      // Второе бронирование на то же время
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          roomId,
          date: '2025-01-21',
          startTime: '15:00',
          endTime: '17:00'
        });
      
      expect(res.statusCode).toBe(409);
    });
  });
});