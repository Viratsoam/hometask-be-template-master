const request = require('supertest');
const app = require('../src/app');
const { Profile, Contract, Job } = require('../src/model');
const { sequelize } = require('../src/model');

describe('Balances', () => {
  let clientProfile;
  let contractorProfile;
  let contract;
  let job;

  beforeAll(async () => {
    // Create test profiles
    clientProfile = await Profile.create({
      firstName: 'Test',
      lastName: 'Client',
      profession: 'Developer',
      balance: 1000,
      type: 'client'
    });

    contractorProfile = await Profile.create({
      firstName: 'Test',
      lastName: 'Contractor',
      profession: 'Developer',
      balance: 0,
      type: 'contractor'
    });

    // Create test contract
    contract = await Contract.create({
      terms: 'Test contract',
      status: 'in_progress',
      ClientId: clientProfile.id,
      ContractorId: contractorProfile.id
    });

    // Create test job
    job = await Job.create({
      description: 'Test job',
      price: 100,
      ContractId: contract.id
    });
  });

  afterAll(async () => {
    await Job.destroy({ where: {} });
    await Contract.destroy({ where: {} });
    await Profile.destroy({ where: {} });
    await sequelize.close();
  });

  describe('POST /balances/deposit/:userId', () => {
    it('should successfully deposit money to client balance', async () => {
      const response = await request(app)
        .post(`/api/v1/balances/deposit/${clientProfile.id}`)
        .set('profile_id', clientProfile.id)
        .send({ amount: 50 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('balance');
      expect(response.body.balance).toBe(1050);
    });

    it('should return 400 if amount is negative', async () => {
      const response = await request(app)
        .post(`/api/v1/balances/deposit/${clientProfile.id}`)
        .set('profile_id', clientProfile.id)
        .send({ amount: -50 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if amount exceeds 25% of unpaid jobs', async () => {
      const response = await request(app)
        .post(`/api/v1/balances/deposit/${clientProfile.id}`)
        .set('profile_id', clientProfile.id)
        .send({ amount: 1000 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 if profile_id is not set', async () => {
      const response = await request(app)
        .post(`/api/v1/balances/deposit/${clientProfile.id}`)
        .send({ amount: 50 });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 if trying to deposit to another user', async () => {
      const response = await request(app)
        .post(`/api/v1/balances/deposit/${contractorProfile.id}`)
        .set('profile_id', clientProfile.id)
        .send({ amount: 50 });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 if user does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/balances/deposit/999999')
        .set('profile_id', clientProfile.id)
        .send({ amount: 50 });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 