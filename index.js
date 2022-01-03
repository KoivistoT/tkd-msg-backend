const express = require("express");

const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

require("./startup/routes")(app);
// require("./startup/socket")(app);
require("./startup/db")();

// const server = http.createServer(app);

const io = new Server(server);

io.on("connection", (socket) => {
  console.log(`[${socket.id}] socket connected`);

  socket.on("disconnect", (reason) => {
    console.log(`[${socket.id}] socket disconnected - ${reason}`);
  });
});

const port = process.env.PORT || 3000;

server.listen(port, () => console.log(`Listening on port: ${port}`));
