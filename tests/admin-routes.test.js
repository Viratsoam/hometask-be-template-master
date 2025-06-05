const request = require('supertest');
const app = require('../src/app');
const { Profile, Contract, Job, sequelize } = require('../src/model');

let clientProfile;
let contractorProfile;
let contract;
let job;

beforeAll(async () => {
  // Create test profiles
  clientProfile = await Profile.create({
    firstName: 'Admin',
    lastName: 'Client',
    profession: 'Tester',
    balance: 1000,
    type: 'client'
  });
  contractorProfile = await Profile.create({
    firstName: 'Admin',
    lastName: 'Contractor',
    profession: 'Tester',
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
    paid: true,
    paymentDate: new Date(),
    ContractId: contract.id
  });
});

afterAll(async () => {
  await job.destroy();
  await contract.destroy();
  await clientProfile.destroy();
  await contractorProfile.destroy();
});

describe('Admin Routes', () => {
  describe('GET /admin/best-profession', () => {
    it('should return 401 if profile_id is not set', async () => {
      const response = await request(app)
        .get('/api/v1/admin/best-profession')
        .query({
          start: '2019-12-31',
          end: '2025-12-30'
        });
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if date range is not provided', async () => {
      const response = await request(app)
        .get('/api/v1/admin/best-profession')
        .set('profile_id', '1');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /admin/best-clients', () => {
    it('should return 401 if profile_id is not set', async () => {
      const response = await request(app)
        .get('/api/v1/admin/best-clients')
        .query({
          start: '2019-12-31',
          end: '2025-12-30',
          limit: 2
        });
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if date range is not provided', async () => {
      const response = await request(app)
        .get('/api/v1/admin/best-clients')
        .set('profile_id', '1')
        .query({ limit: 2 });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should use default limit of 2 if not provided', async () => {
      const response = await request(app)
        .get('/api/v1/admin/best-clients')
        .set('profile_id', '1')
        .query({
          start: '2019-12-31',
          end: '2025-12-30'
        });
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(2);
    });
  });
});
