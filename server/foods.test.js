const request = require('supertest');
const app = require('./index'); // Adjust the path to your app's entry point

describe('GET /api/foods', () => {
  it('should return an array of foods', async () => {
    const res = await request(app).get('/api/foods');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
