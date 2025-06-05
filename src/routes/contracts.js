const express = require('express');
const router = express.Router();
const { getProfile } = require('../middleware/getProfile');
const { Contract } = require('../model');
const { Op } = require('sequelize');

// Get contract by id
router.get('/:id', getProfile, async (req, res) => {
  const { id } = req.params;
  const { profile } = req;

  const contract = await Contract.findOne({
    where: { id }
  });

  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const hasAccess = profile.type === 'client' 
    ? contract.ClientId === profile.id 
    : contract.ContractorId === profile.id;

  if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

  res.json(contract);
});

// Get all non-terminated contracts
router.get('/', getProfile, async (req, res) => {
  const { profile } = req;

  const contracts = await Contract.findAll({
    where: {
      [profile.type === 'client' ? 'ClientId' : 'ContractorId']: profile.id,
      status: {
        [Op.ne]: 'terminated'
      }
    }
  });

  res.json(contracts);
});

module.exports = router;
