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
        self.allMaps = [
            
            {
                'playerPosition': (0, 0),
                'goals': [(0, 9), (9,5), (9,9)],
                'blocks': [(0,3),(1,3),(2,3),(3,3),(3,6),(3,7),(3,8),(3,9),(7,2),(7,3),(7,4),(7,5),(7,6),(7,7)]
            },
            {
                'playerPosition': (0, 0),
                'goals': [(0, 9), (9,5), (9,9)],
                'blocks': [(0,3),(1,3),(2,3),(3,3),(3,6),(3,7),(3,8),(3,9),(7,4),(7,4),(7,6)]
            },
            {
                'playerPosition': (0, 0),
                'goals': [(9, 0), (9, 5), (9, 9)],
                'blocks': [(0,5),(1,5),(2,5),(3,5),(7,1),(7,2),(7,3),(7,4),(2,7),(3,7),(4,7),(5,7),(6,7),(7,7)]
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
        self.updatePosterior = UpdatePosteriorClass(game_map)
        emit('initializeGame', game_map)

    def handleUpdatePrior(self, newActPos):
        state = (newActPos['position']['x'], newActPos['position']['y'])
        action = tuple(newActPos['action'])
        print(state)
        print(action)
        posterior = self.updatePosterior(state, action)
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