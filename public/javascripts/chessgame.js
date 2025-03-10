const socket = io();
const chess = new Chess();
let boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let gameOver = false;

// Piece Unicode Map
const pieceSymbols = {
    'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
    'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
};

// Render Chess Board
const renderBoard = () => {
    if (!boardElement) return;

    const board = chess.board();
    boardElement.innerHTML = '';

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark');
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerText = pieceSymbols[square.type]; 
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable && !gameOver) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: colIndex };
                        e.dataTransfer.setData('text/plain', '');
                    }
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => e.preventDefault());
            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedPiece && !gameOver) {
                    const targetSquare = { row: parseInt(squareElement.dataset.row), col: parseInt(squareElement.dataset.col) };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    // Flip board for black player
    if (playerRole === 'b') {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
};

// Handle Move
const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`
    };

    if (chess.move(move)) {
        socket.emit('move', move);
        renderBoard();
    } else {
        console.log("Invalid move!");
    }
};

// Handle Socket Events
socket.on('playerRole', (role) => {
    playerRole = role;
    renderBoard();
});

socket.on('move', (move) => {
    chess.move(move);
    renderBoard();
});

socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on('invalidMove', (move) => {
    alert("Invalid move: " + move.from + " to " + move.to);
});

socket.on('gameOver', (message) => {
    alert(message);
    gameOver = true;
});

socket.on('resetGame', () => {
    chess.reset();
    gameOver = false;
    renderBoard();
});

// Render board on initial load
document.addEventListener('DOMContentLoaded', renderBoard);
