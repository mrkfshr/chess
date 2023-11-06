window.onload = function() {
    const socket = io();

    const board = Chessboard('board', {
        draggable: true,
        dropOffBoard: 'trash',
        sparePieces: true,
        position: 'start',
        pieceTheme: '/chessboardjs-master/website/img/chesspieces/wikipedia/{piece}.png'
    });

    const game = new Chess();

    // Function to update the display of captured pieces
    function updateCapturedPieces(capturedPiece) {
        var color = capturedPiece.color;
        var piece = capturedPiece.type;

        // Convert piece to uppercase if it's white for the image file name
        var pieceImage = (color === 'w' ? piece.toUpperCase() : piece) + '.png';

        // Add the captured piece to the appropriate list
        var capturedList = document.getElementById(color === 'w' ? 'black-captured-pieces' : 'white-captured-pieces');
        var img = document.createElement('img');
        img.src = '/chessboardjs-master/website/img/chesspieces/wikipedia/' + pieceImage;
        capturedList.appendChild(img);
    }

    function onDragStart(source, piece, position, orientation) {
        if (game.game_over() || (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        // See if the move is a capture
        var capturedPiece = game.get(target);

        // Make the move on the game object
        var move = game.move({
            from: source,
            to: target,
            promotion: 'q' // NOTE: always promote to a queen for simplicity
        });

        // If the move is illegal, snapback
        if (move === null) return 'snapback';

        // If a piece was captured, update the captured pieces display
        if (capturedPiece) {
            updateCapturedPieces(capturedPiece);
        }

        // Emit the move to the server
        socket.emit('move', move);
        board.position(game.fen());
    }

    function onSnapEnd() {
        board.position(game.fen());
    }

    board.start();

    socket.on('move', function(msg) {
        game.move(msg);
        board.position(game.fen());
    });
}
