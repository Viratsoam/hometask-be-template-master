const request = require('supertest');
const app = require('../src/app');
const { Profile, Contract, sequelize } = require('../src/model');

let clientProfile;
let contractorProfile;
let contract;
let terminatedContract;

beforeAll(async () => {
  // Create test profiles
  clientProfile = await Profile.create({
    firstName: 'Contract',
    lastName: 'Client',
    profession: 'Tester',
    balance: 100,
    type: 'client'
  });
  contractorProfile = await Profile.create({
    firstName: 'Contract',
    lastName: 'Contractor',
    profession: 'Tester',
    balance: 0,
    type: 'contractor'
  });
  // Create test contracts
  contract = await Contract.create({
    terms: 'Test contract',
    status: 'in_progress',
    ClientId: clientProfile.id,
    ContractorId: contractorProfile.id
  });
  terminatedContract = await Contract.create({
    terms: 'Terminated contract',
    status: 'terminated',
    ClientId: clientProfile.id,
    ContractorId: contractorProfile.id
  });
});

describe('Contracts', () => {
  describe('GET /contracts/:id', () => {
    it('should return contract by id for client', async () => {
      const response = await request(app)
        .get(`/api/v1/contracts/${contract.id}`)
        .set('profile_id', clientProfile.id);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', contract.id);
    });

    it('should return contract by id for contractor', async () => {
      const response = await request(app)
        .get(`/api/v1/contracts/${contract.id}`)
        .set('profile_id', contractorProfile.id);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', contract.id);
    });

    it('should return 404 if contract does not exist', async () => {
      const response = await request(app)
        .get('/api/v1/contracts/99999')
        .set('profile_id', clientProfile.id);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 if profile_id is not set', async () => {
      const response = await request(app)
        .get(`/api/v1/contracts/${contract.id}`);
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 if contract belongs to another client', async () => {
      // Create another client
      const anotherClient = await Profile.create({
        firstName: 'Another',
        lastName: 'Client',
        profession: 'Tester',
        balance: 0,
        type: 'client'
      });
      const response = await request(app)
        .get(`/api/v1/contracts/${contract.id}`)
        .set('profile_id', anotherClient.id);
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
      await anotherClient.destroy();
    });

    it('should return 403 if contract belongs to another contractor', async () => {
      // Create another contractor
      const anotherContractor = await Profile.create({
        firstName: 'Another',
        lastName: 'Contractor',
        profession: 'Tester',
        balance: 0,
        type: 'contractor'
      });
      const response = await request(app)
        .get(`/api/v1/contracts/${contract.id}`)
        .set('profile_id', anotherContractor.id);
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
      await anotherContractor.destroy();
    });
  });

  describe('GET /contracts', () => {
    it('should return non-terminated contracts for client', async () => {
      const response = await request(app)
        .get('/api/v1/contracts')
        .set('profile_id', clientProfile.id);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(contract.id);
    });

    it('should return non-terminated contracts for contractor', async () => {
      const response = await request(app)
        .get('/api/v1/contracts')
        .set('profile_id', contractorProfile.id);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(contract.id);
    });

    it('should return 401 if profile_id is not set', async () => {
      const response = await request(app)
        .get('/api/v1/contracts');
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should return empty array for new client', async () => {
      // Create a new client
      const newClient = await Profile.create({
        firstName: 'New',
        lastName: 'Client',
        profession: 'Tester',
        balance: 0,
        type: 'client'
      });
      const response = await request(app)
        .get('/api/v1/contracts')
        .set('profile_id', newClient.id);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
      await newClient.destroy();
    });

    it('should return empty array for new contractor', async () => {
      // Create a new contractor
      const newContractor = await Profile.create({
        firstName: 'New',
        lastName: 'Contractor',
        profession: 'Tester',
        balance: 0,
        type: 'contractor'
      });
      const response = await request(app)
        .get('/api/v1/contracts')
        .set('profile_id', newContractor.id);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
      await newContractor.destroy();
    });
  });
}); 