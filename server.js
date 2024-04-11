const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'))

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('playerPosition', (position) => {
        console.log('Player Position:', position);
        // You can also emit events back to the client if needed
    });

    socket.on('newAct', (action) => {
        console.log('Player Action:', action)
    });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));