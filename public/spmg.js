const {fromEvent, range, withLatestFrom} = rxjs;
const {map, filter, pluck, scan} = rxjs.operators;

const canvas = document.getElementById('gameCanvas');
const button = document.getElementById('clickMe');
const ctx = canvas.getContext('2d');

const gridNumber = 10;
const cellSize = canvas.width / gridNumber; 
const playerStartingPosition = {x:0, y:0}; 


const socket = io('http://localhost:3000')

let goals = [];
let blocks = [];

function drawMap(){
    range(0, gridNumber * gridNumber).subscribe(
        val => {
            const x = (val%gridNumber) *cellSize;
            const y = Math.floor(val/gridNumber) *cellSize;
            ctx.strokeRect(x,y,cellSize, cellSize);
        })}

function drawBlocks(blocks)
{
    blocks.forEach(block => {
        ctx.fillStyle = 'brown';
        ctx.globalAlpha = 1;
        ctx.fillRect(block.x * cellSize, block.y *cellSize, cellSize, cellSize);
    });
    ctx.globalAlpha = 1; 
}
// function getRandomPosition(){
//     let x = 0;
//     let y = 0; 
//         while (x === 0 & y === 0){
//             x = Math.floor(Math.random() *gridNumber);
//             y = Math.floor(Math.random() *gridNumber);
//         }
//     return{ x, y }
// }

function getRandomColor() {
    // Generate a random integer between 0 and 255 for each color component
    const red = Math.floor(Math.random() * 256);   // Red component
    const green = Math.floor(Math.random() * 256); // Green component
    const blue = Math.floor(Math.random() * 256);  // Blue component

    // Construct an RGB color string
    return `rgb(${red}, ${green}, ${blue})`;
}

function drawPlayer(playerPosition){
    ctx.beginPath();
    ctx.fillStyle = 'blue';
    ctx.arc(playerPosition.x*cellSize + (cellSize / 2),playerPosition.y*cellSize + (cellSize / 2),cellSize/2,0,Math.PI*2);
    ctx.fill();
}

function drawGoals(goals)
{
    goals.forEach(goal => {
        ctx.fillStyle = goal.color;
        ctx.globalAlpha = goal.opacity;
        ctx.fillRect(goal.x * cellSize, goal.y *cellSize, cellSize, cellSize);
    });
    ctx.globalAlpha = 1;  
}

function isReached(playerPosition, goals){
    goals.forEach( goal => {
        if(goal.x === playerPosition.x && goal.y === playerPosition.y)
        {
            alert('Congratulation! You reached the goal! Click the Start Game button again to proceed to the next trial')
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawMap();
            return true;
        }}
    )
}
function isReachedBlock(playerPosition, blocks)
{
    blocks.forEach(block => {
        if(block.x === playerPosition.x && block.y === playerPosition.y)
        {
            return true;
        }})
}


const playerReady$ = fromEvent(button, 'click')

playerReady$.subscribe((button) => {
    socket.emit('playerReady', 'Player is ready!')
})

socket.on('initializeGame', function(game_map) {
    console.log(game_map)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let i = 0; i<game_map.goals.length; i++)
    {
        goals.push({x: game_map.goals[i][0], y:game_map.goals[i][1], color: getRandomColor(), opacity: 50});
    }
    for (let j = 0; j< game_map.blocks.length; j++ )
    {
        blocks.push({x: game_map.blocks[j][0], y:game_map.blocks[j][1]});
    }
    console.log(blocks);
    console.log(goals);
    render(playerStartingPosition);
    return {playerStartingPosition};                                                                                                           
})                                                                                                                                                                                         

const movement$ = fromEvent(document, 'keydown').pipe(
    pluck('code'),
    filter(code => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)),
    map(code => {
        switch(code){
            case 'ArrowLeft': return { x: -1, y: 0 };
            case 'ArrowRight': return { x: 1, y: 0 };
            case 'ArrowUp': return { x: 0, y: -1 };
            case 'ArrowDown': return { x: 0, y: 1 };
            default: return { x: 0, y: 0 };
        }
    }))

const updatePlayerPos$ = movement$.pipe(
    scan((playerPosition, movement) => {

        let newPosition = {
            x: Math.max(0, Math.min(gridNumber - 1, playerPosition.x + movement.x)),
            y: Math.max(0, Math.min(gridNumber - 1, playerPosition.y + movement.y))
        };

        // Check for collision with blocks
        let isCollision = blocks.some(block => block.x === newPosition.x && block.y === newPosition.y);

        // If there is a collision, revert to the old position
        if (isCollision) {
            newPosition = playerPosition;
        }

        // Return the new position
        return newPosition;
    }, playerStartingPosition));

function render(playerPosition)
    {
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
    
// Subscribe to the combined observable
action_position$.subscribe(({ action, position }) => {
    render(position);
    console.log(position);
    playerPosition = position;
    isReached(playerPosition, goals);
    socket.emit('updatePrior', { action, position });
    });

// Assuming the socket connection is already established
socket.on('updatePosterior', function(posterior) {
    console.log('Posterior:', posterior);
    goals[0].opacity = posterior.goal1;
    goals[1].opacity = posterior.goal2;
    goals[2].opacity = posterior.goal3;
    // Additional client-side logic based on the response
});
        
    