const express = require('express');
const app = express();
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js');
const path = require('path');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = socket(server); // Initialize socket.io

const chess = new Chess();
let players = { white: null, black: null };
let currentPlayer = 'w';

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', function (socket) {
    console.log(`A user connected: ${socket.id}`);

    // Assign player roles (white, black, or spectator)
    if (!players.white) {
        players.white = socket.id;
        socket.emit('playerRole', 'w');
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit('playerRole', 'b');
    } else {
        socket.emit('spectatorRole');
    }

    // Send the latest board state to the new connection
    socket.emit('boardState', chess.fen());

    // Handle player moves
    socket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && socket.id !== players.white) return;
            if (chess.turn() === 'b' && socket.id !== players.black) return;

            const result = chess.move(move);
            if (result) {
                currentPlayer = chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen());

                if (chess.isGameOver()) {
                    let gameResult = "Game Over - ";
                    if (chess.isCheckmate()) gameResult += `Checkmate! ${currentPlayer === 'w' ? "Black" : "White"} Wins!`;
                    else if (chess.isStalemate()) gameResult += "Stalemate!";
                    else if (chess.isDraw()) gameResult += "Draw!";
                    io.emit('gameOver', gameResult);
                }
            } else {
                console.log('Invalid Move:', move);
                socket.emit('invalidMove', move);
            }
        } catch (err) {
            console.error('Error processing move:', err);
            socket.emit('invalidMove', move);
        }
    });

    // Handle player disconnect
    socket.on('disconnect', function () {
        console.log(`User disconnected: ${socket.id}`);
        if (socket.id === players.white) {
            players.white = null;
            resetGame();
        } else if (socket.id === players.black) {
            players.black = null;
            resetGame();
        }
    });

    // Reset game when a player disconnects
    function resetGame() {
        if (!players.white && !players.black) {
            chess.reset();
            io.emit('boardState', chess.fen());
            io.emit('resetGame');
            console.log("Game has been reset.");
        }
    }
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
