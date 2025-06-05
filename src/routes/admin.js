const express = require('express');
const router = express.Router();
const { getProfile } = require('../middleware/getProfile');
const { Profile, Job, Contract } = require('../model');
const { Op } = require('sequelize');
const { sequelize } = require('../model');

/**
 * GET /admin/best-profession?start=<date>&end=<date>
 * Returns the profession that earned the most money within the given time range
 */
router.get('/best-profession', getProfile, async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates are required' });
  }

  const result = await Job.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('price')), 'totalEarned'],
      [sequelize.col('Contract.Contractor.profession'), 'profession']
    ],
    include: [{
      model: Contract,
      include: [{
        model: Profile,
        as: 'Contractor',
        attributes: ['profession']
      }]
    }],
    where: {
      paid: true,
      paymentDate: {
        [Op.between]: [start, end]
      }
    },
    group: [sequelize.col('Contract.Contractor.profession')],
    order: [[sequelize.fn('SUM', sequelize.col('price')), 'DESC']],
    limit: 1
  });

  if (!result.length) {
    return res.status(404).json({ error: 'No data found for the specified period' });
  }

  res.json({
    profession: result[0].Contract.Contractor.profession,
    totalEarned: result[0].dataValues.totalEarned
  });
});

/**
 * GET /admin/best-clients?start=<date>&end=<date>&limit=<integer>
 * Returns clients who paid the most for jobs within the specified period
 */
router.get('/best-clients', getProfile, async (req, res) => {
  const { start, end, limit = 2 } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'Start and end dates are required' });
  }

  const results = await Job.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('price')), 'paid'],
      [sequelize.col('Contract.Client.id'), 'id'],
      [sequelize.col('Contract.Client.firstName'), 'firstName'],
      [sequelize.col('Contract.Client.lastName'), 'lastName']
    ],
    include: [{
      model: Contract,
      include: [{
        model: Profile,
        as: 'Client',
        attributes: ['id', 'firstName', 'lastName']
      }]
    }],
    where: {
      paid: true,
      paymentDate: {
        [Op.between]: [start, end]
      }
    },
    group: [sequelize.col('Contract.Client.id')],
    order: [[sequelize.fn('SUM', sequelize.col('price')), 'DESC']],
    limit: parseInt(limit)
  });

  if (!results.length) {
    return res.status(404).json({ error: 'No data found for the specified period' });
  }

  const clients = results.map(result => ({
    id: result.Contract.Client.id,
    fullName: `${result.Contract.Client.firstName} ${result.Contract.Client.lastName}`,
    paid: result.dataValues.paid
  }));

  res.json(clients);
});

module.exports = router;
