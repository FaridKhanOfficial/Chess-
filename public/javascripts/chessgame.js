const socket = io();
const chess = new Chess();
let boardElement = document.querySelector('.chessboard');
let draggedPiece = null;
let sourceSquare = null;
let playerRole = 'w'; // Assume white starts

const getPieceUnicode = (piece) => {
    const pieceMap = {
        'p': '♙', 'r': '♖', 'n': '♘', 'b': '♗', 'q': '♕', 'k': '♔', // White pieces
        'P': '♟', 'R': '♜', 'N': '♞', 'B': '♝', 'Q': '♛', 'K': '♚'  // Black pieces
    };
    return pieceMap[piece] || '';
};

const renderBoard = () => {
    boardElement.innerHTML = '';
    const board = chess.board();

    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square', (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark');
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerText = getPieceUnicode(square.type);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
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
                if (draggedPiece) {
                    const targetSquare = { row: parseInt(squareElement.dataset.row), col: parseInt(squareElement.dataset.col) };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (from, to) => {
    const move = chess.move({
        from: `${String.fromCharCode(97 + from.col)}${8 - from.row}`, 
        to: `${String.fromCharCode(97 + to.col)}${8 - to.row}`
    });

    if (move) {
        renderBoard();
        socket.emit('move', move);
    } else {
        console.log('Invalid move');
    }
};

// Receive move from the server
socket.on('move', (move) => {
    chess.move(move);
    renderBoard();
});

renderBoard();
