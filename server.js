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
    let moveObj = game.move(move
