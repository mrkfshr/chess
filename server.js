const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Chess } = require('chess.js');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const session = require('express-session'); // Include express-session
const cors = require('cors');

// Load environment variables from .env file
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(cors());

// PostgreSQL pool setup (configure with your credentials)
const pool = new Pool({
  user: 'mrk', // Replace with your username
  host: '192.168.1.18',
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

// Serve the homepage
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: './public' });
});

//Serve the registration page
app.get('/register', (req, res) => {
    res.sendFile('register.html', { root: './public' });
});

// Serve the login page
app.get('/login', (req, res) => {
    res.sendFile('login.html', { root: './public' });
});

// Serve the game.html file when the '/game' endpoint is accessed
app.get('/game', (req, res) => {
    res.sendFile('game.html', { root: './public' });
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

// User login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required' });
        }

        // Check if user exists
        const userResult = await pool.query('SELECT id, username, password FROM players WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'User does not exist' });
        }

        // Check if password is correct
        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Password is incorrect' });
        }

        // Set user session
        req.session.userId = user.id;

        res.status(200).json({ success: true, id: user.id, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Start the server
server.listen(3000, () => {
  console.log('Listening on *:3000');
});