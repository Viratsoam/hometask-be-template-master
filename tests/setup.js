process.env.DB_PATH = ':memory:';
const { sequelize } = require('../src/model');
const seedDb = require('../scripts/seedDb');
const fs = require('fs');
const path = require('path');

beforeAll(async () => {
  // Sync database and seed before all tests
  await sequelize.sync({ force: true });
  await seedDb();
});

afterAll(async () => {
  // Close database connection after all tests
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
});

// Increase timeout for all tests
jest.setTimeout(30000);

async function setupTestDatabase() {
  // Delete the SQLite database file if it exists
  const dbPath = path.join(__dirname, '../database.sqlite3');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  try {
    await sequelize.sync({ force: true });
    await seedDb();
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

async function teardownTestDatabase() {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Failed to teardown test database:', error);
    throw error;
  }
}

module.exports = {
  setupTestDatabase,
  teardownTestDatabase
}; 