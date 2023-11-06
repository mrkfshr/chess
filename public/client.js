window.onload = function() {
    // Connect to the Socket.io server
    const socket = io();

    // Initialize the chessboard and game
    const board = Chessboard('board', {
        position: 'start',
        draggable: true,
        pieceTheme: '/chessboardjs-master/website/img/chesspieces/wikipedia/{piece}.png', // Set the path to your chess piece images
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
    });

    let game = new Chess();

    function onDragStart(source, piece, position, orientation) {
        // Do not pick up pieces if the game is over or if it's not that side's turn
        if (game.game_over() || (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        // See if the move is legal
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q', // NOTE: always promote to a queen for example simplicity
        });

        // Illegal move
        if (move === null) return 'snapback';

        // Emit the move to the server
        socket.emit('move', move);
        board.position(game.fen());
    }

    function onSnapEnd() {
        // Update the board position after the piece snap
        // for castling, en passant, pawn promotion
        board.position(game.fen());
    }

    // Update the board position after a move from the server
    socket.on('move', (move) => {
        game.move(move);
        board.position(game.fen());
    });
}
