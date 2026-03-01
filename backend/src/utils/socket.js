let io;

module.exports = {
    init: (server) => {
        io = require('socket.io')(server, {
            cors: {
                origin: 'http://localhost:5173',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
            }
        });

        io.on('connection', (socket) => {
            // Join a hospital-specific room
            socket.on('joinHospital', (hospitalId) => {
                socket.join(hospitalId);
                console.log(`Socket ${socket.id} joined hospital room: ${hospitalId}`);
            });

            socket.on('disconnect', () => {
                console.log('User disconnected');
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }
        return io;
    }
};
