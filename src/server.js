const app = require('./app');
const { sequelize } = require('./model');

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await sequelize.sync();
    console.log('Database synced successfully');

    let server;
    let currentPort = PORT;
    let maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        server = app.listen(currentPort, () => {
          console.log(`Express App Listening on Port ${currentPort}`);
        });
        break;
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}`);
          currentPort++;
          attempts++;
        } else {
          throw error;
        }
      }
    }

    if (!server) {
      throw new Error(`Could not find an available port after ${maxAttempts} attempts`);
    }

    server.on('error', (error) => {
      console.error('Server error:', error);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        sequelize.close();
      });
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        sequelize.close();
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}
