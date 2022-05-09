const { WebSockets } = require("./utils/WebSockets.js");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
require("./startup/routes")(app);
require("./startup/db")();

global.io = new Server(server);
io.on("connection", WebSockets.connection);

const port = process.env.PORT || 3000;

server.listen(port, () => console.log(`Listening on port: ${port}`));
