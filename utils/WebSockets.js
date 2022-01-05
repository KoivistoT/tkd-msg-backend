users = [];
class WebSockets {
  connection(client) {
    console.log(`[${client.id}] socket connected`);

    // client.join("1111");
    // io.to("1111").emit("some event");

    client.on("chat message", (msg) => {
      // console.log("tämä kyl käy");
      // console.log("message: " + msg);

      client.emit("chat message", msg);
    });

    // event fired when the chat room is disconnected
    // client.on("disconnect", () => {
    //   this.users = this.users.filter((user) => user.socketId !== client.id);
    // });
    // // add identity of user mapped to the socket id
    // client.on("identity", (userId) => {
    //   this.users.push({
    //     socketId: client.id,
    //     userId: userId,
    //   });
    // });
    // subscribe person to chat & other user as well
    client.on("login", ({ name, room }, callback) => {
      // const { user, error } = addUser(socket.id, name, room);
      // if (error) return callback(error);
      // const error = "nyt meni pieleen"
      // return callback(error)
      client.join(room);
      console.log(
        "katso saako tämän niin, että ei lähetä ollenkaan lähettäjälle tieota. Tee ensin erikseen yksinkertaisesti"
      );
      global.io.sockets.in(room).emit("notification", {
        title: "Someone's here",
        description: `"tähän muuttuja" just entered the room`,
      });

      // global.io.in(room).emit("users", "ljjowiejfiwjelfij");
      callback();
    });

    client.on("subscribe", (room, otherUserId = "") => {
      subscribeOtherUser(room, otherUserId);
      console.log("käy täällä");
      console.log(room, "huone id, join");
      client.join(room);
    });
    // mute a chat room
    client.on("unsubscribe", (room) => {
      client.leave(room);
    });
  }
}

const subscribeOtherUser = (room, otherUserId) => {
  const userSockets = users.filter((user) => user.userId === otherUserId);
  userSockets.map((userInfo) => {
    const socketConn = global.io.sockets.connected(userInfo.socketId);
    if (socketConn) {
      socketConn.join(room);
    }
  });
};
module.exports.WebSockets = new WebSockets();
