window.onload = function() {
    const socket = io();
    let playerColor = null;
    let game = new Chess();

    const boardConfig = {
        draggable: true,
        position: 'start',
        pieceTheme: '/chessboardjs-master/website/img/chesspieces/wikipedia/{piece}.png',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    };
    let board = Chessboard('board', boardConfig);

    socket.on('color', (color) => {
        playerColor = color;
        board.orientation(color === 'w' ? 'white' : 'black');
        document.getElementById('player-color').textContent = color === 'w' ? 'White' : 'Black';
    });

    socket.on('full', (message) => {
        alert(message);
    });

    socket.on('opponent-disconnected', () => {
        alert('Your opponent has disconnected. The game will reset.');
        game.reset();
        board.start();
        updateCapturedPieces();
        updateTurnIndicator();
    });

    socket.on('move-rejected', () => {
        board.position(game.fen());
    });

    socket.on('move', (move) => {
        game.move(move);
        board.position(game.fen());
        updateCapturedPieces(); // Update captured pieces after a move from the server
        updateTurnIndicator(); // Update turn indicator after a move from the server
        updateGameStatus(); // Update game status after a move from the server
    });

    function onDragStart(source, piece, position, orientation) {
        if (game.game_over() === true ||
            (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
            game.turn() !== playerColor) {
            return false;
        }
    }

    function onDrop(source, target) {
    let move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for simplicity
    });

    // If the move is invalid, show an alert and snap the piece back
    if (move === null) {
        alert('Invalid move!');
        return 'snapback';
    }

    socket.emit('move', move);
    updateCapturedPieces(); // Update captured pieces after a local move
    updateTurnIndicator(); // Update turn indicator after a local move
    updateGameStatus(); // Update game status after a local move
}

    function onSnapEnd() {
        board.position(game.fen());
    }

    function updateCapturedPieces() {
        // ... (existing code for updating captured pieces)
    }

    function displayCapturedPieces(elementId, pieces) {
        // ... (existing code for displaying captured pieces)
    }

    function updateTurnIndicator() {
        // ... (existing code for updating turn indicator)
    }

    function updateGameStatus() {
        let status = '';
    
        if (game.in_checkmate()) {
            status = 'Checkmate - ' + (game.turn() === 'b' ? 'White' : 'Black') + ' wins!';
        } else if (game.in_draw()) {
            status = 'Draw - 50-move rule, threefold repetition, or insufficient material!';
        } else if (game.in_stalemate()) {
            status = 'Stalemate - No legal moves available!';
        } else if (game.in_threefold_repetition()) {
            status = 'Draw - Threefold repetition!';
        } else if (game.insufficient_material()) {
            status = 'Draw - Insufficient material to continue!';
        } else {
            status = 'Game in progress - ' + (game.turn() === 'w' ? 'White' : 'Black') + '\'s turn';
        }
    
        // Display the status
        document.getElementById('status').textContent = status;
    }
    
};
