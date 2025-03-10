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
    //     io.emit('newGameMove');{
    // });

    
    if (!players.white) {
        players.white = socket.id;
        socket.emit('playerRole', 'w');
        
    }
    else if(!players.black){
        players.black = socket.id;
        socket.emit('playerRole', 'b');
    }

    else{
        socket.emit('spectatorRole');
    }

    socket.on('disconnect', function(){
        if(socket.id === players.white){
            delete players.white;
        }
        else if(socket.id === players.black){
            delete players.black;
        }
    })

    socket.on('move', (move)=>{
        try{
            if(chess.turn() === 'w' && socket.id !== players.white) return;
            if(chess.turn() === 'b' && socket.id !== players.white) return;
            
            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen());
            }

            else{
                console.log('Invalid Move ' + move);
                socket.emit('invalidMove', move);
            }
        }
        catch(err){
            console.log(err);
            socket.emit('invalidMove', move);
        }
    })
})

server.listen(3000, () => { 
    console.log('Server is running on port 3000');
});
