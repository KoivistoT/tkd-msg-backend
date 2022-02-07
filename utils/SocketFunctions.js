const { socketUsers } = require("./WebSockets");

module.exports.ioUpdate = function (users, action, roomId) {
  users.forEach((userId) => {
    const userSocketId = getUserSocketId(userId);
    console.log(action, userSocketId);
    if (!userSocketId) return;

    io.to(userSocketId).emit("updates", action, {
      roomId: roomId,
    });
  });
};

function getUserSocketId(userId) {
  const index = socketUsers.findIndex((user) => user.userId === userId);
  return index === -1 ? false : socketUsers[index].socketId;
}
