const express = require('express');
const router = express.Router();
const { getProfile } = require('../middleware/getProfile');
const { Job, Contract, Profile, sequelize } = require('../model');
const { Op } = require('sequelize');

/**
 * GET /jobs/unpaid
 * Returns all unpaid jobs for the logged-in user (client or contractor) in active contracts.
 */
router.get('/unpaid', getProfile, async (req, res) => {
  const { profile } = req;

  const jobs = await Job.findAll({
    include: [{
      model: Contract,
      where: {
        status: 'in_progress',
        [profile.type === 'client' ? 'ClientId' : 'ContractorId']: profile.id
      }
    }],
    where: {
      paid: false
    }
  });

  res.json(jobs);
});

/**
 * POST /jobs/:job_id/pay
 * Pay for a job. Transfers balance from client to contractor.
 */
router.post('/:job_id/pay', getProfile, async (req, res) => {
  const { job_id } = req.params;
  const { profile } = req;

  if (profile.type !== 'client') {
    return res.status(403).json({ error: 'Only clients can pay for jobs' });
  }

  const job = await Job.findOne({
    include: [{
      model: Contract,
      where: {
        ClientId: profile.id,
        status: 'in_progress'
      },
      include: [{
        model: Profile,
        as: 'Contractor'
      }]
    }],
    where: {
      id: job_id,
      paid: false
    }
  });

  if (!job) {
    return res.status(404).json({ error: 'Job not found or not available for payment' });
  }

  if (profile.balance < job.price) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  const contractor = job.Contract.Contractor;

  try {
    await sequelize.transaction(async (t) => {
      await profile.update({ balance: profile.balance - job.price }, { transaction: t });
      await contractor.update({ balance: contractor.balance + job.price }, { transaction: t });
      await job.update({
        paid: true,
        paymentDate: new Date()
      }, { transaction: t });
    });

    // Return the updated job with paid status and payment date
    const updatedJob = await Job.findByPk(job_id);
    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ error: 'Payment failed' });
  }
});

module.exports = router;
