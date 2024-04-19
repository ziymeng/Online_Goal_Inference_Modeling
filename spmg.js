const {fromEvent, range} = rxjs;
const {map, filter, pluck, scan} = rxjs.operators;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gridNumber = 15;
const cellSize = canvas.width / gridNumber; 
const goalNumber = 3;
const playerStartingPosition = {x:0, y:0}; 


//create a new data structure in a different line of code, it could a class/interface/ask gpt
// a function called new that allows you to create new object
//manually create each item in the array 
let goals = Array.from({ length: goalNumber }, () => ({
    coordinates: { x: null, y: null },
    color: null,
    opacity: null
}));

goals = [
    {
        coordinates : getRandomPosition(),
        color: getRandomColor(),
        opacity: Math.random()
    },
    {
        coordinates : getRandomPosition(),
        color: getRandomColor(),
        opacity: Math.random()
    },
    {
        coordinates : getRandomPosition(),
        color: getRandomColor(),
        opacity: Math.random()
    },
    ]

function drawMap(){
    //other range function for repeating the code
    range(0, gridNumber * gridNumber).subscribe(
        val => {
            const x = (val%gridNumber) *cellSize;
            const y = Math.floor(val/gridNumber) *cellSize;
            ctx.strokeRect(x,y,cellSize, cellSize);
        })}

//if x or y is equal to zero, sample again
function getRandomPosition(){
    let x = 0;
    let y = 0; 
        while (x === 0 & y === 0){
            x = Math.floor(Math.random() *gridNumber);
            y = Math.floor(Math.random() *gridNumber);
        }
    return{ x, y }
}

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
        ctx.fillRect(goal.coordinates.x * cellSize, goal.coordinates.y *cellSize, cellSize, cellSize);
    });
    ctx.globalAlpha = 1;  
}

//rejected sampling
//generate again 
//if you want to check, return a boolean
//have another function do alerting and kill the program/unsubscribe the observable
function isReached(playerPosition, goals){
    goals.forEach( goal => {
        if(goal.coordinates.x === playerPosition.x && goal.coordinates.y === playerPosition.y)
        {
            alert('Congratulation! You reached the goal!')
            return true;
        }}
    )
}

function initializeGame()
{
    goals.forEach(goal => {
        goal.coordinates = getRandomPosition();
        goal.color = getRandomColor(); 
    })
    drawGoals(goals);
    drawMap();
    drawPlayer(playerStartingPosition);
    console.log(playerStartingPosition);
    return {playerStartingPosition};
}


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
        console.log(playerPosition);
        return {
            x: Math.max(0, Math.min(gridNumber - 1, playerPosition.x + movement.x)),
            y: Math.max(0, Math.min(gridNumber - 1, playerPosition.y + movement.y))
        };
    }, playerStartingPosition));

function render(playerPosition)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMap();
        drawPlayer(playerPosition);
        drawGoals(goals);
    }

updatePlayerPos$.subscribe(newPosition => {
        playerPosition = newPosition;
        console.log(playerPosition);
        render(newPosition);
        isReached(playerPosition, goals);
    });