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
  
    socket.on('move', (move) => {
      game.move(move);
      board.position(game.fen());
      updateCapturedPieces();
    });
  
    socket.on('move-rejected', () => {
      board.position(game.fen());
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
  
      if (move === null) return 'snapback';
      socket.emit('move', move);
    }
  
    function onSnapEnd() {
      board.position(game.fen());
    }
  
    function updateCapturedPieces() {
      // Update the display of captured pieces here
    }
  };
  