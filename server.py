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
from flask_socketio import SocketIO
from enum import Enum, unique
import rx
from rx import operators as ops

app = Flask(__name__, static_url_path='', static_folder='public')
socketio = SocketIO(app)

# @unique
# class Direction(Enum):
#     RIGHT = (1, 0)
#     LEFT = (-1, 0)
#     UP = (0, 1)
#     DOWN = (0, -1)

@app.route('/')
def index():
    return send_from_directory('public', 'index.html')

@socketio.on('connect')
def on_connect():
    print('A user connected')

@socketio.on('disconnect')
def on_disconnect():
    print('User disconnected')

#@socketio.on('playerPosition')
#def handle_player_position(position):
    #print('Player Position:', position)
    # Calculate the likelihood based on position
   # likelihoods = calculate_likelihood(position)
    # Emit the likelihood back to the client
    # emit('posterior', likelihoods)

#def calculate_likelihood(position):
    # Dummy function to calculate likelihood based on the position
    # You might want to replace this with actual logic based on 'position'
    #return {'goal1': 0.7, 'goal2': 0.2, 'goal3': 0.1}

# def dict_to_tuple(coord_dict):
#     # Assuming the dictionary always contains the keys 'x' and 'y'
#     return (coord_dict['x'], coord_dict['y'])

def getPosterior(currentPriors, action, likelihoods):
    posterior = {goal: likelihoods[goal][action] * currentPriors[goal] for goal in currentPriors}
    total = sum(posterior.values())
    normalizedPosterior = {goal: posterior[goal] / total for goal in posterior}
    return normalizedPosterior

goals = {'G1', 'G2', 'G3'}
InitialPriors = {'G1': 1/3, 'G2': 1/3, 'G3': 1/3}
likelihoods = {
    'G1': { (1,0): 0.94, (0,-1): 0.01, (1,0): 0.03, (0,1):0.02},
    'G2': { (1,0): 0.03, (0,-1): 0.03, (1,0): 0.94, (0,1):0.02},
    'G3': { (1,0): 0.01, (0,-1): 0.94, (1,0): 0.03, (0,1):0.02}
}

@socketio.on('newAct')
def handle_new_act(action):
    observableActions=[]
    print('Player Action:', action)
    action_tuple = tuple(action)
    # convert the list of observed actions into an RxPy observable
    observableActions.append(action_tuple)
    observableActions = rx.from_([action], scheduler=ImmediateScheduler())
    computePosteriorGivenAction= lambda currentPriors,action: getPosterior(currentPriors,action,likelihoods)
    # create a data processing pipeline
    updatedPriors = observableActions.pipe(
        ops.scan(lambda currentPriors, action: computePosteriorGivenAction(currentPriors,action), InitialPriors)
    )
    print("this is a test")
    updatedPriors.subscribe(
        on_next=lambda x: print("Updated Priors:", x)
    )
    

if __name__ == '__main__':
    PORT = 3000
    socketio.run(app, port=PORT, debug=True)