# const express = require('express');
# const http = require('http');
# const socketIo = require('socket.io');

# const app = express();
# const server = http.createServer(app);
# const io = socketIo(server);

# app.use(express.static('public'))

# io.on('connection', (socket) => {
#     console.log('A user connected');

#     socket.on('disconnect', () => {
#         console.log('User disconnected');
#     });

#     socket.on('playerPosition', (position) => {
#         console.log('Player Position:', position);
#         // You can also emit events back to the client if needed
#     });

#     socket.on('newAct', (action) => {
#         console.log('Player Action:', action)
#     });
# });

# const PORT = 3000;
# server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit
from inference import UpdatePosteriorClass

class GameServer:
    def __init__(self):
        self.app = Flask(__name__, static_url_path='', static_folder='public')
        self.socketio = SocketIO(self.app)
        self.updatePosterior = UpdatePosteriorClass()
        self.allMaps = [
            {
                'playerPosition': (0, 0),
                'goals': [(8, 1), (7, 3), (1, 9)],
                'blocks': []
            },
            {
                'playerPosition': (0, 0),
                'goals': [(5, 4), (5, 7), (2, 7)],
                'blocks': [(2,1),(2,2),(2,3),(4,3),(1,5),(3,5),(4,5),(1,6)]
            },
            {
                'playerPosition': (0, 0),
                'goals': [(10, 1), (10, 5), (10, 10)],
                'blocks': [(5,1),(5,2),(8,2),(5,4),(5,5),(8,5),(8,6),(7,7),(7,8),(7,9)]
            }
        ]

        self.app.add_url_rule('/', 'index', self.index)
        self.socketio.on_event('connect', self.onConnect)
        self.socketio.on_event('disconnect', self.onDisconnect)
        self.socketio.on_event('playerReady', self.handlePlayerReady)
        self.socketio.on_event('updatePrior', self.handleUpdatePrior)

    def index(self):
        return send_from_directory('public', 'index.html')

    def onConnect(self):
        print('A user connected')

    def onDisconnect(self):
        print('User disconnected')

    def handlePlayerReady(self, button):
        print('player ready')
        game_map = self.onDisplayReady()
        emit('initializeGame', game_map)

    def handleUpdatePrior(self, newActPos):
        action = tuple(newActPos['action'])
        print(action)
        posterior = self.updatePosterior(action)
        emit('updatePosterior', posterior)

    def onDisplayReady(self):
        if self.allMaps:
            return self.allMaps.pop(0)
        else:
            return {'error': 'No more maps available'}

    def start(self, host='0.0.0.0', port=3000):
        self.socketio.run(self.app, host=host, port=port, debug=True)

if __name__ == '__main__':
    server = GameServer()
    server.start()