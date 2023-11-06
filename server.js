const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public')); // Serve static files from the 'public' directory

let players = { white: null, black: null };
let game = new Chess();

io.on('connection', (socket) => {
  console.log('New client connected');

  // Assign a color to the player if not already assigned
  if (!players.white) {
    players.white = socket.id;
    socket.emit('color', 'w');
  } else if (!players.black) {
    players.black = socket.id;
    socket.emit('color', 'b');
  }

  socket.on('move', (move) => {
    // Validate move
    let moveObj = game.move(move);
    if (moveObj === null) {
      // If move is not valid, emit an event to revert the move on the client-side
      socket.emit('move-rejected', move);
    } else {
      // If move is valid, broadcast it to all clients
      io.emit('move', move);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Remove the player from the players object
    if (players.white === socket.id) {
      players.white = null;
    } else if (players.black === socket.id) {
      players.black = null;
    }
  });
});

server.listen(3000, () => {
  console.log('Listening on *:3000');
});
