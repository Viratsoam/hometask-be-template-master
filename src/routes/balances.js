const express = require('express');
const router = express.Router();
const { getProfile } = require('../middleware/getProfile');
const { Profile, Job, Contract } = require('../model');
const { Op } = require('sequelize');

/**
 * POST /balances/deposit/:userId
 * Deposits funds into a client's account.
 * Validation: Cannot deposit more than 25% of the total unpaid jobs.
 */
router.post('/deposit/:userId', getProfile, async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;
  const { profile } = req;

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  if (amount < 0) {
    return res.status(400).json({ error: 'Amount cannot be negative' });
  }

  if (profile.type !== 'client') {
    return res.status(403).json({ error: 'Only clients can deposit money' });
  }

  if (profile.id !== parseInt(userId)) {
    return res.status(403).json({ error: 'You can only deposit to your own account' });
  }

  // Calculate total of jobs to pay
  const jobsToPay = await Job.findAll({
    include: [{
      model: Contract,
      where: {
        ClientId: profile.id,
        status: 'in_progress'
      }
    }],
    where: {
      paid: false
    }
  });

  const totalToPay = jobsToPay.reduce((sum, job) => sum + parseFloat(job.price), 0);
  const maxDeposit = totalToPay * 0.25;

  if (amount > maxDeposit) {
    return res.status(400).json({ error: 'Cannot deposit more than 25% of jobs to pay' });
  }

  try {
    const updatedProfile = await profile.update({ 
      balance: parseFloat(profile.balance) + parseFloat(amount) 
    });
    res.json({ balance: updatedProfile.balance });
  } catch (error) {
    res.status(500).json({ error: 'Deposit failed' });
  }
});

module.exports = router;
