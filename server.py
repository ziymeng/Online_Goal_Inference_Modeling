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

import socketio
from flask import Flask, send_from_directory
from inference import UpdatePosteriorClass
import eventlet
import eventlet.wsgi

class GameServer:
    def __init__(self):
        self.sio = socketio.Server()
        self.app = Flask(__name__, static_url_path='', static_folder='public')
        self.wsgi_app = socketio.WSGIApp(self.sio, self.app)
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
            # Add more maps as required
        ]

        # Register Flask route
        self.app.add_url_rule('/', 'index', self.index)

        # Register event handlers
        self.sio.on('connect', self.on_connect)
        self.sio.on('disconnect', self.on_disconnect)
        self.sio.on('playerReady', self.handle_player_ready)
        self.sio.on('updatePrior', self.handle_update_prior)

    def index(self):
        return send_from_directory('public', 'index.html')

    def on_connect(self, sid, environ):
        print('A user connected')

    def on_disconnect(self, sid):
        print('User disconnected')

    def handle_player_ready(self, sid, button):
        print('player ready')
        game_map = self.onDisplayReady()
        self.sio.emit('initializeGame', game_map, room=sid)

    def handle_update_prior(self, sid, newActPos):
        action = tuple(newActPos['action'])
        print(action)
        posterior = self.updatePosterior(action)
        self.sio.emit('updatePosterior', posterior, room=sid)

    def onDisplayReady(self):
        # Check if there are maps available
        if self.allMaps:
            return self.allMaps.pop(0)
        else:
            return {'error': 'No more maps available'}

    def start(self, host='0.0.0.0', port=3000):
        eventlet.wsgi.server(eventlet.listen((host, port)), self.wsgi_app)

if __name__ == '__main__':
    server = GameServer()
    server.start()
