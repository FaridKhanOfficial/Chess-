const socket = io();

socket.emit('newGame');
socket.on('newGameMove', function(){  
    console.log('New Game Move detected');
}); 