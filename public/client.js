window.onload = function() {
    // Connect to the Socket.io server
    const socket = io();

    // Initialize the chessboard and game
    const board = Chessboard('board', {
        position: 'start',
        draggable: true,
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
    });

    let game = new Chess();

    function onDragStart(source, piece, position, orientation) {
        if (game.game_over() || (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q',
        });

        if (move === null) return 'snapback';

        socket.emit('move', move);
        board.position(game.fen());
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    socket.on('move', (move) => {
        game.move(move);
        board.position(game.fen());
    });
}
