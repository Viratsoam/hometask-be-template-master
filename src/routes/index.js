const express = require('express');
const router = express.Router();

const contractsRouter = require('./contracts');
const jobsRouter = require('./jobs');
const balancesRouter = require('./balances');
const adminRouter = require('./admin');

router.use('/contracts', contractsRouter);
router.use('/jobs', jobsRouter);
router.use('/balances', balancesRouter);
router.use('/admin', adminRouter);

module.exports = router; 