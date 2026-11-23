import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { hashPassword } from '../src/utils/password.js';

const app = createApp();
const email = `req${Date.now()}@test.local`;
let accessToken;
let serviceId;

describe('Request lifecycle', () => {
  beforeAll(async () => {
    const s = await prisma.service.create({
      data: {
        slug: `test-${Date.now()}`,
        name: 'Test Service',
        category: 'Test',
        description: 'Test service description',
        feePaise: 5000,
        requiredDocuments: JSON.stringify(['AADHAAR']),
        formSchema: JSON.stringify({
          fields: [
            { name: 'fullName', type: 'string', required: true, min: 2 },
            { name: 'aadhaar', type: 'aadhaar', required: true },
          ],
        }),
        active: true,
      },
    });
    serviceId = s.id;
    await prisma.user.create({
      data: { email, passwordHash: await hashPassword('password123'), role: 'CUSTOMER' },
    });
    const login = await request(app).post('/api/auth/login').send({ email, password: 'password123' });
    accessToken = login.body.accessToken;
  });

  it('creates a request with dynamic form + masked Aadhaar', async () => {
    const res = await request(app).post('/api/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ serviceId, formData: { fullName: 'Test', aadhaar: '123456789012' }, consent: true });
    expect(res.status).toBe(201);
    expect(res.body.trackingNumber).toMatch(/^AS-\d{4}-\d{6}$/);
    expect(res.body.formData.aadhaar).toBe('XXXX XXXX 9012');
  });

  it('rejects invalid form data', async () => {
    const res = await request(app).post('/api/requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ serviceId, formData: { aadhaar: 'bad' }, consent: true });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_FORM_DATA');
  });

  it('lists my requests', async () => {
    const res = await request(app).get('/api/requests/mine')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await prisma.service.delete({ where: { id: serviceId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });
});