const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public')); // Serve static files from the 'public' directory

let game = new Chess();
let playerSockets = { white: null, black: null };

io.on('connection', (socket) => {
  console.log('New client connected');

  // Assign a color to the player if not already assigned
  if (!playerSockets.white) {
    playerSockets.white = socket;
    socket.emit('color', 'w');
  } else if (!playerSockets.black) {
    playerSockets.black = socket;
    socket.emit('color', 'b');
  }

  socket.on('move', (move) => {
    let moveObj = game.move(move);
    if (moveObj === null) {
      socket.emit('move-rejected');
    } else {
      io.emit('move', moveObj);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (playerSockets.white === socket) {
      playerSockets.white = null;
    } else if (playerSockets.black === socket) {
      playerSockets.black = null;
    }
    game.reset();
  });
});

server.listen(3000, () => {
  console.log('Listening on *:3000');
});
