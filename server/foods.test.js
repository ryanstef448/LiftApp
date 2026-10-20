const request = require('supertest');
const app = require('./index');
const db = require('./db');

describe('Nutrition & Foods API', () => {
  let createdFoodId;
  let createdLogId;
  const testDate = '2026-09-15';

  it('GET /api/foods - returns an array of foods', async () => {
    const res = await request(app).get('/api/foods');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/foods - creates a new food item in library', async () => {
    const newFood = {
      name: 'Chicken Breast (Test)',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      serving_unit: '100g',
    };
    const res = await request(app).post('/api/foods').send(newFood);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual(newFood.name);
    expect(res.body.calories).toEqual(newFood.calories);
    createdFoodId = res.body.id;
  });

  it('GET /api/foods/:id - returns the created food', async () => {
    const res = await request(app).get(`/api/foods/${createdFoodId}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toEqual(createdFoodId);
    expect(res.body.name).toEqual('Chicken Breast (Test)');
  });

  it('POST /api/logs - quick-adds a known food to the daily log with 2 servings', async () => {
    const logPayload = {
      food_id: createdFoodId,
      date: testDate,
      servings: 2,
    };
    const res = await request(app).post('/api/logs').send(logPayload);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.date).toEqual(testDate);
    expect(res.body.servings).toEqual(2);
    expect(res.body.calories).toEqual(330); // 165 * 2
    expect(res.body.protein).toEqual(62); // 31 * 2
    createdLogId = res.body.id;
  });

  it('GET /api/logs?date=... - returns daily logs and totals', async () => {
    const res = await request(app).get(`/api/logs?date=${testDate}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.date).toEqual(testDate);
    expect(Array.isArray(res.body.entries)).toBe(true);
    expect(res.body.entries.length).toBeGreaterThanOrEqual(1);
    expect(res.body.totals.totalCalories).toBeGreaterThanOrEqual(330);
    expect(res.body.totals.totalProtein).toBeGreaterThanOrEqual(62);
  });

  it('GET /api/logs/stats - returns daily aggregated trends for charting', async () => {
    const res = await request(app).get(`/api/logs/stats?startDate=${testDate}&endDate=${testDate}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('days');
    expect(res.body).toHaveProperty('averages');
    expect(Array.isArray(res.body.days)).toBe(true);
    expect(res.body.days.length).toBeGreaterThanOrEqual(1);
  });

  it('DELETE /api/logs/:id - removes the log entry', async () => {
    const res = await request(app).delete(`/api/logs/${createdLogId}`);
    expect(res.statusCode).toEqual(204);
  });

  it('DELETE /api/foods/:id - removes the food from library', async () => {
    const res = await request(app).delete(`/api/foods/${createdFoodId}`);
    expect(res.statusCode).toEqual(204);
  });
});
