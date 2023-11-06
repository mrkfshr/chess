window.onload = function() {
    const socket = io();
    const board = Chessboard('board', {
        position: 'start',
        draggable: true,
        pieceTheme: '/chessboardjs-master/website/img/chesspieces/wikipedia/{piece}.png',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
    });

    let game = new Chess();
    let capturedPieces = {
        'w': { 'P': 0, 'R': 0, 'N': 0, 'B': 0, 'Q': 0 },
        'b': { 'P': 0, 'R': 0, 'N': 0, 'B': 0, 'Q': 0 }
    };

    function onDragStart(source, piece, position, orientation) {
        if (game.game_over() || (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        let move = game.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        updateCapturedPieces(move);
        socket.emit('move', move);
        board.position(game.fen());
        updateUI();
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    function updateCapturedPieces(move) {
        if (move.captured) {
            capturedPieces[move.color === 'w' ? 'b' : 'w'][move.captured.toUpperCase()]++;
        }
    }

    function updateUI() {
        // Update the UI for the captured pieces
        for (const color in capturedPieces) {
            for (const piece in capturedPieces[color]) {
                const elementId = color + piece;
                const count = capturedPieces[color][piece];
                const element = document.getElementById(elementId);
                if (element) {
                    element.textContent = count > 0 ? count : '';
                }
            }
        }
    }

    socket.on('move', (move) => {
        game.move(move);
        board.position(game.fen());
        updateCapturedPieces(move);
        updateUI();
    });
}
