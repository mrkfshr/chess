const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Chess } = require('chess.js');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const session = require('express-session'); // Include express-session

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// PostgreSQL pool setup (configure with your credentials)
const pool = new Pool({
  user: 'mrk', // Replace with your username
  host: '192.168.1.19',
  database: 'chessusers',
  password: '8sapenny', // Replace with your password
  port: 5432, // Default PostgreSQL port
});

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Session middleware setup
app.use(session({
  secret: process.env.SESSION_SECRET, // The secret key from your .env file
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true, // Helps prevent cross-site scripting (XSS)
    sameSite: 'strict' // Helps prevent cross-site request forgery (CSRF)
  }
}));

app.get('/register', (req, res) => {
    res.sendFile('register.html', { root: './public' });
});

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
  } else {
    // If both colors are already assigned, don't allow a third player
    socket.emit('full', 'Game is full');
    socket.disconnect();
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
    // Reset the game and notify the other player
    if (playerSockets.white === socket) {
      playerSockets.white = null;
      if (playerSockets.black) {
        playerSockets.black.emit('opponent-disconnected');
      }
    } else if (playerSockets.black === socket) {
      playerSockets.black = null;
      if (playerSockets.white) {
        playerSockets.white.emit('opponent-disconnected');
      }
    }
    game.reset();
  });
});

// User registration endpoint
app.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).send('Username and password are required');
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      // Assuming the default rank is 0 or any other default value you choose
      const defaultRank = 100;
      const result = await pool.query(
        'INSERT INTO players(username, password, rank) VALUES($1, $2, $3) RETURNING id, username',
        [username, hashedPassword, defaultRank]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  });

server.listen(3000, () => {
  console.log('Listening on *:3000');
});
