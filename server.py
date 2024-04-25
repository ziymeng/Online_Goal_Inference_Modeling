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
from enum import Enum, unique
import rx, random
from rx import operators as ops

app = Flask(__name__, static_url_path='', static_folder='public')
socketio = SocketIO(app)

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@socketio.on('connect')
def on_connect():
    print('A user connected')

@socketio.on('disconnect')
def on_disconnect():
    print('User disconnected')

def updatePrior(newActPos):
    return {
        'goal1': round(random.random(), 2),
        'goal2': round(random.random(), 2),
        'goal3': round(random.random(), 2),
    }

@socketio.on('updatePrior')
def handleNewAct(newActPos):
    updated_ActionPosition = {
        'action': tuple(newActPos['action']),
        'position': newActPos['position']
    }
    print(updated_ActionPosition)
    posterior = updatePrior(newActPos)
    emit('updatePosterior', posterior)

if __name__ == '__main__':
    PORT = 3000
    socketio.run(app, port=PORT, debug=True)