const {fromEvent, range} = rxjs;
const {map, filter, pluck, scan} = rxjs.operators;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridNumber = 10;
const cellSize = canvas.width / gridNumber; 

const socket = io('http://localhost:3000');

function drawMap(){
    //other range function for repeating the code
    range(0, gridNumber * gridNumber).subscribe(
        val => {
            const x = (val%gridNumber) *cellSize;
            const y = Math.floor(val/gridNumber) *cellSize;
            ctx.strokeRect(x,y,cellSize, cellSize);
        })
}

function getRandomPosition(){
    return{
        x: Math.floor(Math.random() *gridNumber),
        y: Math.floor(Math.random() *gridNumber)
    }
}

function drawPlayer(playerPosition){
    ctx.beginPath();
    ctx.fillStyle = 'blue';
    ctx.arc(playerPosition.x*cellSize + (cellSize / 2),playerPosition.y*cellSize + (cellSize / 2),cellSize/2,0,Math.PI*2);
    ctx.fill();
}

function drawGoals(goalPosition1, goalPosition2, goalPosition3)
{
    //goal position 1
    ctx.fillStyle = 'red';
    ctx.fillRect(goalPosition1.x * cellSize, goalPosition1.y *cellSize, cellSize, cellSize);
    
    //goal position 2
    ctx.fillStyle = 'purple';
    ctx.fillRect(goalPosition2.x * cellSize, goalPosition2.y *cellSize, cellSize, cellSize);

    //goal position 3
    ctx.fillStyle = 'green';
    ctx.fillRect(goalPosition3.x * cellSize, goalPosition3.y *cellSize, cellSize, cellSize);

}

function correctInitialOverlap(goalPosition1, goalPosition2, goalPosition3){
    while(goalPosition1.x === 0 && goalPosition1.y ===0 ||
            goalPosition2.x === 0 && goalPosition2.y ===0 ||
            goalPosition3.x === 0 && goalPosition3.y ===0)
            {
                 goalPosition1 = getRandomPosition();
                 goalPosition2 = getRandomPosition();
                 goalPosition3 = getRandomPosition();
            }
    return { goalPosition1, goalPosition2, goalPosition3 };
}

function checkIfGoalReached(playerPosition, goalPosition1, goalPosition2, goalPosition3){
    if (playerPosition.x === goalPosition1.x && playerPosition.y === goalPosition1.y
                || playerPosition.x === goalPosition2.x && playerPosition.y === goalPosition2.y 
                || playerPosition.x === goalPosition3.x && playerPosition.y === goalPosition3.y ) {
                alert('Congratulations! You reached the goal!');}
}

function initializeGame()
{
    const playerStartingPosition = {x: 0, y:0}
    let goalPosition1 = getRandomPosition();
    let goalPosition2 = getRandomPosition();
    let goalPosition3 = getRandomPosition();
    ({ goalPosition1, goalPosition2, goalPosition3 } = correctInitialOverlap(goalPosition1, goalPosition2, goalPosition3));
    drawGoals(goalPosition1, goalPosition2, goalPosition3);
    drawMap();
    drawPlayer(playerStartingPosition);
    console.log(playerStartingPosition);
    return {playerStartingPosition, goalPosition1, goalPosition2, goalPosition3}
}

let {playerStartingPosition, goalPosition1, goalPosition2, goalPosition3} = initializeGame();

console.log(playerStartingPosition);
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
    // every time code emits, send back

    const updatePlayerPos$ = movement$.pipe(
        scan((playerPosition, movement) => {
            return {
                x: Math.max(0, Math.min(gridNumber - 1, playerPosition.x + movement.x)),
                y: Math.max(0, Math.min(gridNumber - 1, playerPosition.y + movement.y))
            };
        }, playerStartingPosition)

    // every time movement emits, send back
    );


function render(playerPosition)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMap();
        drawPlayer(playerPosition);
        drawGoals(goalPosition1, goalPosition2, goalPosition3);
    }

updatePlayerPos$.subscribe(newPosition => {
        playerPosition = newPosition;
        render(newPosition);
        checkIfGoalReached(playerPosition, goalPosition1, goalPosition2, goalPosition3);

        socket.emit('playerPosition', newPosition)
    });

movement$.subscribe(newAction => {
    let action = [newAction.x, newAction.y];
    socket.emit('newAct', action);
});
    