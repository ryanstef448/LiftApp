const request = require('supertest');
const app = require('./index');

describe('Auth & Profiles API', () => {
  const uniqueUsername = `testrunner_${Date.now()}`;

  it('POST /api/auth/test-login - logs in directly as test account', async () => {
    const res = await request(app).post('/api/auth/test-login');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toEqual('testuser');
    expect(res.body.user.is_test_account).toEqual(1);
    expect(res.body).toHaveProperty('token');
  });

  it('GET /api/auth/users - lists existing profiles', async () => {
    const res = await request(app).get('/api/auth/users');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(u => u.username === 'testuser')).toBe(true);
  });

  it('POST /api/auth/register - creates a new user profile', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: uniqueUsername,
      password: 'password123',
      display_name: 'Test Runner',
      calorie_goal: 2500,
      protein_goal: 190,
      weight_goal: 170,
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body.user.username).toEqual(uniqueUsername);
    expect(res.body.user.display_name).toEqual('Test Runner');
    expect(res.body.user.calorie_goal).toEqual(2500);
  });

  it('POST /api/auth/login - logs into the created profile', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: uniqueUsername,
      password: 'password123',
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.user.username).toEqual(uniqueUsername);
  });

  it('PUT /api/auth/profile - updates current user goals', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      username: uniqueUsername,
      password: 'password123',
    });
    const userId = loginRes.body.user.id;

    const res = await request(app)
      .put('/api/auth/profile')
      .set('x-user-id', String(userId))
      .send({
        display_name: 'Updated Runner',
        calorie_goal: 2600,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.display_name).toEqual('Updated Runner');
    expect(res.body.calorie_goal).toEqual(2600);
  });
});
