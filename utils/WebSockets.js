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
    client.on("disconnect", () => {
      users = users.filter((user) => user.socketId !== client.id);
      console.log("lähti pois", client.id);
    });
    // // add identity of user mapped to the socket id
    client.on("identity", (userId) => {
      users.push({
        socketId: client.id,
        userId: userId,
      });
    });
    // subscribe person to chat & other user as well
    client.on("login", ({ name, roomId }, callback) => {
      // const { user, error } = addUser(socket.id, name, room);
      // if (error) return callback(error);
      // const error = "nyt meni pieleen"
      // return callback(error)

      client.join(roomId);
      // console.log(
      //   "katso saako tämän niin, että ei lähetä ollenkaan lähettäjälle tieota. Tee ensin erikseen yksinkertaisesti"
      // );
      global.io.sockets.in(roomId).emit("notification", {
        title: "Someone's here",
        description: `"tähän muuttuja" just entered the room`,
      });

      // global.io.in(room).emit("users", "ljjowiejfiwjelfij");
      callback();
    });

    client.on("subscribe", async (roomId, otherUserId = "") => {
      subscribeOtherUser(roomId, otherUserId);
      // console.log(global.io.sockets, "täältä tää");

      client.join(roomId);

      // const socketsInARoomInSomeNamespace = io
      //   .of("/")
      //   .in("/" + roomId)
      //   .fetchSockets()
      //   .then((room) => {
      //     console.log("clients in this room: ", room.length);
      //   });

      const sockets = await client.in(roomId).fetchSockets();

      console.log(roomId, "huone id, join");
    });

    // mute a chat room
    client.on("unsubscribe", (roomId) => {
      client.leave(roomId);
      console.log("lähti", roomId);
    });
  }
}

function listSocketsProperty(myProperty) {
  let sck = global.io.sockets.sockets;
  const mapIter = sck.entries();
  while (1) {
    let en = mapIter.next().value?.[0];
    if (en) console.log(sck.get(en)[myProperty]);
    else break;
  }
}

const subscribeOtherUser = (roomId, otherUserId) => {
  // console.log(users);
  const userSockets = users.filter((user) => user.userId === otherUserId);

  userSockets.map((userInfo) => {
    const socketConn = global.io.sockets.connected(userInfo.socketId);
    if (socketConn) {
      socketConn.join(roomId);
    }
  });
};
module.exports.WebSockets = new WebSockets();
