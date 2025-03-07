const express = require('express');
const app = express();
const socket = require('socket.io');
const http = require('http');
const {Chess} = require('chess.js');
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'public')));

const server = http.createServer(app);
const io = socket(server);  // socket.io server

const chess = new Chess();

let players = {};
let currentPlayer = 'w'

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', function(socket){
    console.log('A user connected');
    // socket.on('newGame', function(){
    //     io.emit('newGameMove');
    // });

    socket.on('disconnect', function(){
        console.log('A user disconnected');
    })
})

server.listen(3000, () => { 
    console.log('Server is running on port 3000');
});
