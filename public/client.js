window.onload = function() {
    const socket = io();
    let playerColor = null; // Store the player's color
    let capturedPieces = { 'w': [], 'b': [] };

    const board = Chessboard('board', {
        position: 'start',
        draggable: true,
        pieceTheme: '/chessboardjs-master/website/img/chesspieces/wikipedia/{piece}.png',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
    });

    let game = new Chess();

    socket.on('color', (color) => {
        playerColor = color;
        document.getElementById('player-color').textContent = playerColor === 'w' ? 'White' : 'Black';
        board.orientation(playerColor === 'w' ? 'white' : 'black');
    });

    function onDragStart(source, piece, position, orientation) {
        if (game.game_over() || game.turn() !== playerColor || piece.search(new RegExp('^' + playerColor)) === -1) {
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
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    function updateCapturedPieces(move) {
        if (move.captured) {
            capturedPieces[move.color === 'w' ? 'b' : 'w'].push(move.captured);
            updateCapturedPiecesUI();
        }
    }

    function updateCapturedPiecesUI() {
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
        updateCapturedPieces(move);
    });

    socket.on('move-rejected', (move) => {
        // Handle move rejection by reverting to the previous position
        board.position(game.fen());
    });
}
