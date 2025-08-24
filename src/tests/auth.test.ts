import request from 'supertest';
import app from '../app.js';

const email = `user${Date.now()}@example.com`;
const password = 'password123';

describe('Auth', () => {
  it('registers and logs in', async () => {
    const reg = await request(app).post('/api/auth/register').send({ email, password, name: 'Tester' });
    expect(reg.status).toBe(200);
    expect(reg.body.token).toBeTruthy();

    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeTruthy();
  });
});
