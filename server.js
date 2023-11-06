const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// Serve static files (e.g., HTML, CSS, JavaScript) from a 'public' folder
app.use(express.static('public'));

// Start the server on a specific port (e.g., 3000)
const port = 3000;
http.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
