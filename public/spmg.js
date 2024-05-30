const { fromEvent, range, withLatestFrom } = rxjs;
const { map, filter, pluck, scan } = rxjs.operators;

const canvas = document.getElementById('gameCanvas');
const button = document.getElementById('clickMe');
const ctx = canvas.getContext('2d');

const gridNumber = 10;
const cellSize = canvas.width / gridNumber;
const playerStartingPosition = { x: 0, y: 0 };

const socket = io('http://localhost:3000');

let goals = [];
let blocks = [];
let currentPlayerPosition = playerStartingPosition; // Track the current player position

function drawMap() {
    range(0, gridNumber * gridNumber).subscribe(
        val => {
            const x = (val % gridNumber) * cellSize;
            const y = Math.floor(val / gridNumber) * cellSize;
            ctx.strokeRect(x, y, cellSize, cellSize);
        });
}

function drawBlocks(blocks) {
    blocks.forEach(block => {
        ctx.fillStyle = 'brown';
        ctx.globalAlpha = 1;
        ctx.fillRect(block.x * cellSize, block.y * cellSize, cellSize, cellSize);
    });
}

function getRandomColor() {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgb(${red}, ${green}, ${blue})`;
}

function getDefaultColor() {
    const red = 50;
    const green = 10;
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
}

function drawPlayer(playerPosition) {
    ctx.beginPath();
    ctx.fillStyle = 'blue';
    ctx.arc(playerPosition.x * cellSize + (cellSize / 2), playerPosition.y * cellSize + (cellSize / 2), cellSize / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawGoals(goals) {
    goals.forEach(goal => {
        ctx.fillStyle = goal.color;
        ctx.globalAlpha = 1;
        ctx.fillRect(goal.x * cellSize, goal.y * cellSize, cellSize, cellSize);
    });
    ctx.globalAlpha = 1;
}

function isReached(playerPosition, goals) {
    for (let goal of goals) {
        if (goal.x === playerPosition.x && goal.y === playerPosition.y) {
            return true;
        }
    }
    return false;
}

function clearMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
}

const playerReady$ = fromEvent(button, 'click');

playerReady$.subscribe(() => {
    socket.emit('playerReady', 'Player is ready!');
});

socket.on('initializeGame', function (game_map) {
    console.log(game_map);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    goals = game_map.goals.map(goal => ({
        x: goal[0], y: goal[1], color: getDefaultColor(), opacity: 1
    }));
    blocks = game_map.blocks.map(block => ({
        x: block[0], y: block[1]
    }));
    console.log(blocks);
    console.log(goals);
    currentPlayerPosition = playerStartingPosition; // Reset to the starting position
    render(currentPlayerPosition);

    const subscription = action_position$.subscribe(({ action, position }) => {
        currentPlayerPosition = position; // Update the current player position
        render(position);
        console.log(position);
        if (isReached(position, goals)) {
            alert('Congratulations! You reached the goal! Click the Start Game button again to proceed to the next trial');
            clearMap();
            subscription.unsubscribe();
            goals.length = 0;
            blocks.length = 0;
        }
        socket.emit('updatePrior', { action, position });
    });
});

const movement$ = fromEvent(document, 'keydown').pipe(
    pluck('code'),
    filter(code => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)),
    map(code => {
        switch (code) {
            case 'ArrowLeft': return { x: -1, y: 0 };
            case 'ArrowRight': return { x: 1, y: 0 };
            case 'ArrowUp': return { x: 0, y: -1 };
            case 'ArrowDown': return { x: 0, y: 1 };
            default: return { x: 0, y: 0 };
        }
    })
);

const updatePlayerPos$ = movement$.pipe(
    scan((playerPosition, movement) => {
        let newPosition = {
            x: Math.max(0, Math.min(gridNumber - 1, playerPosition.x + movement.x)),
            y: Math.max(0, Math.min(gridNumber - 1, playerPosition.y + movement.y))
        };

        let isCollision = blocks.some(block => block.x === newPosition.x && block.y === newPosition.y);

        if (isCollision) {
            newPosition = playerPosition;
        }

        return newPosition;
    }, playerStartingPosition)
);

function render(playerPosition) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    drawPlayer(playerPosition);
    drawGoals(goals);
    drawBlocks(blocks);
}

const action_position$ = movement$.pipe(
    withLatestFrom(updatePlayerPos$),
    map(([action, newPosition]) => ({
        action: [action.x, action.y],
        position: newPosition
    }))
);

socket.on('updatePosterior', function (posterior) {
    console.log('Posterior:', posterior);
    
    // Update the redness based on posterior values
    goals[0].color = `rgb(${Math.floor(posterior.G1 * 255)}, 0, 0)`;
    goals[1].color = `rgb(${Math.floor(posterior.G2 * 255)}, 0, 0)`;
    goals[2].color = `rgb(${Math.floor(posterior.G3 * 255)}, 0, 0)`;

    render(currentPlayerPosition); // Redraw the canvas with the current player position
});
