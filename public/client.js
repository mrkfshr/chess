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
        'w': [],
        'b': []
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

        if (move.captured) {
            capturedPieces[move.color === 'w' ? 'b' : 'w'].push(move.captured);
        }
        socket.emit('move', move);
        board.position(game.fen());
        updateUI();
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    function updateUI() {
        // Update the UI for the captured pieces
        ['w', 'b'].forEach(color => {
            const capturedContainer = document.getElementById(color + '-captured');
            capturedContainer.innerHTML = ''; // Clear the container
            capturedPieces[color].forEach(piece => {
                const pieceImage = document.createElement('img');
                pieceImage.src = '/chessboardjs-master/website/img/chesspieces/wikipedia/' + color + piece.toUpperCase() + '.png';
                capturedContainer.appendChild(pieceImage);
            });
        });
    }

    socket.on('move', (move) => {
        game.move(move);
        board.position(game.fen());
        if (move.captured) {
            capturedPieces[move.color === 'w' ? 'b' : 'w'].push(move.captured);
        }
        updateUI();
    });
}
