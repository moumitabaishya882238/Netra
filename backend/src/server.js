require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const http = require('http');
const socketUtil = require('./utils/socket');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
const io = socketUtil.init(server);

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

startServer();
