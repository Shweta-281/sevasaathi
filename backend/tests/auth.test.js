import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/lib/prisma.js';

const app = createApp();
const email = `auth${Date.now()}@test.local`;

describe('Auth', () => {
  it('registers a new customer', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email, password: 'password123', fullName: 'Test User' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email, role: 'CUSTOMER' });
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email, password: 'password123' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('logs in and returns access + refresh', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.headers['set-cookie'].join(';')).toContain('refreshToken=');
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email, password: 'wrong' });
    expect(res.status).toBe(401);
  });


  afterAll(async () => { await prisma.$disconnect(); });
});
