// File: app.js
const express = require('express');
const { sequelize, Profile, Contract, Job } = require('./model');
const { getProfile } = require('./middleware/getProfile');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Parse JSON bodies
app.use(express.json());

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// API versioning
const v1Router = express.Router();

// Apply authentication middleware to all routes
v1Router.use(getProfile);

// Set models in app instance
app.set('models', { Profile, Contract, Job });

// Import routes
const contractsRouter = require('./routes/contracts');
const jobsRouter = require('./routes/jobs');
const balancesRouter = require('./routes/balances');
const adminRouter = require('./routes/admin');

// Mount routes
v1Router.use('/contracts', contractsRouter);
v1Router.use('/jobs', jobsRouter);
v1Router.use('/balances', balancesRouter);
v1Router.use('/admin', adminRouter);

// Mount v1 API
app.use('/api/v1', v1Router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    status: 404
  });
});

module.exports = app;
