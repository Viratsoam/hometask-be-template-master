const request = require('supertest');
const { sequelize } = require('../src/model');
const app = require('../src/app');
const { Profile, Contract, Job } = require('../src/model');

let clientProfile;
let contractorProfile;
let contract;
let job;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  await require('../scripts/seedDb')();

  // Create test profiles
  clientProfile = await Profile.create({
    firstName: 'Test',
    lastName: 'Client',
    profession: 'Tester',
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
    ContractId: contract.id,
    paid: false
  });
});

afterAll(async () => {
  await job.destroy();
  await contract.destroy();
  await clientProfile.destroy();
  await contractorProfile.destroy();
  await sequelize.close();
});

describe('Jobs', () => {
  describe('GET /jobs/unpaid', () => {
    it('should return unpaid jobs for client', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/unpaid')
        .set('profile_id', clientProfile.id);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(job.id);
    });

    it('should return unpaid jobs for contractor', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/unpaid')
        .set('profile_id', contractorProfile.id);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(job.id);
    });

    it('should return 401 if profile_id is not set', async () => {
      const response = await request(app)
        .get('/api/v1/jobs/unpaid');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /jobs/:job_id/pay', () => {
    it('should pay for a job', async () => {
      const response = await request(app)
        .post(`/api/v1/jobs/${job.id}/pay`)
        .set('profile_id', clientProfile.id);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('paid', true);
      expect(response.body).toHaveProperty('paymentDate');
    });

    it('should return 404 if job does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/jobs/99999/pay')
        .set('profile_id', clientProfile.id);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 if profile_id is not set', async () => {
      const response = await request(app)
        .post(`/api/v1/jobs/${job.id}/pay`);
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 if job belongs to another client', async () => {
      // Create another client
      const anotherClient = await Profile.create({
        firstName: 'Another',
        lastName: 'Client',
        profession: 'Tester',
        balance: 0,
        type: 'client'
      });
      const response = await request(app)
        .post(`/api/v1/jobs/${job.id}/pay`)
        .set('profile_id', anotherClient.id);
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
      await anotherClient.destroy();
    });

    it('should return 400 if client has insufficient balance', async () => {
      // Create a client with insufficient balance
      const poorClient = await Profile.create({
        firstName: 'Poor',
        lastName: 'Client',
        profession: 'Tester',
        balance: 0,
        type: 'client'
      });
      const response = await request(app)
        .post(`/api/v1/jobs/${job.id}/pay`)
        .set('profile_id', poorClient.id);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Insufficient balance');
      await poorClient.destroy();
    });
  });
});
