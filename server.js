const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


app.use(express.static('public'))

io.on('connect', (socket) => {
  console.log('A user connected' + socket.id);

  socket.on('ready', (e) => {
    console.log(socket.id, " is ready at ", e.time)
    initializeGame()
  })  

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const gridNumber = 10;
  const cellSize = canvas.width / gridNumber; 

  function getRandomPosition(){ //moved from client side
    return{
        x: Math.floor(Math.random() *gridNumber),
        y: Math.floor(Math.random() *gridNumber)
    }
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

  function drawMap(){
    //other range function for repeating the code
    range(0, gridNumber * gridNumber).subscribe(
        val => {
            const x = (val%gridNumber) *cellSize;
            const y = Math.floor(val/gridNumber) *cellSize;
            ctx.strokeRect(x,y,cellSize, cellSize);
        })
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

  function drawPlayer(playerPosition){
    ctx.beginPath();
    ctx.fillStyle = 'blue';
    ctx.arc(playerPosition.x*cellSize + (cellSize / 2),playerPosition.y*cellSize + (cellSize / 2),cellSize/2,0,Math.PI*2);
    ctx.fill();
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
    io.emit('start', {playerStartingPosition, goalPosition1, goalPosition2, goalPosition3})
  }

 // let {playerStartingPosition, goalPosition1, goalPosition2, goalPosition3} = initializeGame(); 

  socket.on('update', newPosition => {
    console.log(newPosition)
    io.emit('updateState', newPosition)
  })

  function checkIfGoalReached(playerPosition, goalPosition1, goalPosition2, goalPosition3){
    if (playerPosition.x === goalPosition1.x && playerPosition.y === goalPosition1.y
                || playerPosition.x === goalPosition2.x && playerPosition.y === goalPosition2.y 
                || playerPosition.x === goalPosition3.x && playerPosition.y === goalPosition3.y ) {
                alert('Congratulations! You reached the goal!');}
  }

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});