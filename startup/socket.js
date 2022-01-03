const http = require("http");
const { Server } = require("socket.io");

module.exports = function (app) {
  const server = http.createServer(app);
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("a user connected");
  });
};
