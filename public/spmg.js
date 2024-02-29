const {fromEvent, range} = rxjs;
const {map, filter, pluck, scan} = rxjs.operators;

const socket = io.connect('http://localhost:3000');
document.addEventListener('DOMContentLoaded', () => {
    socket.on('connect', () => {
        console.log('Connected to the server');
    });

    const button = document.querySelector('#clickMe')
    const buttonClick = fromEvent(button, 'click')
    buttonClick.subscribe(() => {
        const time = new Date().toISOString();
        socket.emit('ready', {time})        
    })

    const start = fromEvent(socket, 'start')  //after server emit 'start', how to render position?
    start.subscribe(message => {
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
        const playerPosition = message.playerPosition    
        const updatePlayerPos$ = movement$.pipe(
            scan((playerPosition, movement) => {
                return {
                    x: Math.max(0, Math.min(gridNumber - 1, playerPosition.x + movement.x)),
                    y: Math.max(0, Math.min(gridNumber - 1, playerPosition.y + movement.y))
                    };
                }, playerStartingPosition)
            );  

        updatePlayerPos$.subscribe(newPosition => {
                playerPosition = newPosition;
                socket.emit('update', newPosition)
                //render(newPosition);
                //checkIfGoalReached(playerPosition, goalPosition1, goalPosition2, goalPosition3);
            });            
    })


})

function render(playerPosition){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    drawPlayer(playerPosition); 
    drawGoals(goalPosition1, goalPosition2, goalPosition3);                
}

socket.on('updateState', (e) => {
    render(e)
})






