const request = require('supertest');
const { sequelize } = require('../src/model');
const app = require('../src/app');

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await require('../scripts/seedDb')();
});

afterAll(async () => {
  await sequelize.close();
});

describe('App', () => {
  it('should start the server and set models', () => {
    expect(app.get('models')).toBeDefined();
  });
});

describe('GET /api/v1/contracts/:id', () => {
  it('should return contract if user is client or contractor', async () => {
    const response = await request(app)
      .get('/api/v1/contracts/1')
      .set('profile_id', '1');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });

  it('should return 403 if user does not belong to contract', async () => {
    const response = await request(app)
      .get('/api/v1/contracts/1')
      .set('profile_id', '5');
    expect(response.status).toBe(403);
  });
});