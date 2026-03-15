import request from 'supertest';
import app from '../app';

describe('Admin Access', () => {
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // Логин как пользователь
    const userLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@example.com',
        password: 'user123'
      });
    userToken = userLogin.body.data.token;

    // Логин как админ
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });
    adminToken = adminLogin.body.data.token;
  });

  it('should allow admin to access admin routes', async () => {
    const res = await request(app)
      .get('/api/v1/bookings/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.statusCode).toBe(200);
  });

  it('should deny user access to admin routes', async () => {
    const res = await request(app)
      .get('/api/v1/bookings/admin/all')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(403);
  });
});