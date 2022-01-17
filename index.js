const { WebSockets } = require("./utils/WebSockets.js");
const { Socket } = require("dgram");
const express = require("express");
const socketIO = require("socket.io");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

require("./startup/routes")(app);
// require("./startup/socket")(app);
require("./startup/db")();

// const server = http.createServer(app);

io = new Server(server);
io.on("connection", WebSockets.connection);
// io.on("connection", (socket) => {
//   console.log(`[${socket.id}] socket connected`);

//   socket.on("disconnect", (reason) => {
//     console.log(`[${socket.id}] socket disconnected - ${reason}`);
//   });
//   socket.on("chat message", (msg) => {
//     console.log("message: " + msg);
//     socket.emit("chat message", msg);
//   });
// });

const port = process.env.PORT || 3000;

server.listen(port, () => console.log(`Listening on port: ${port}`));
