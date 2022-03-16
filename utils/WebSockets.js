const { ChangeBucket } = require("../models/changeBucket");
const { Room } = require("../models/room");
const { User } = require("../models/user");

connectedUsers = [];
liveUsers = [];
class WebSockets {
  connection(client) {
    console.log(`[${client.id}] socket connected`);
    // console.log(users);
    // client.join("1111");
    // io.to("1111").emit("some event");

    // console.log(client.server.engine.clients);
    client.on("chat message", ({ msg, roomId }) => {
      console.log("täällä hei on joo juu");
      // console.log("tämä kyl käy");
      // console.log("message: " + msg);
      // client.emit("chat message", msg);
      // global.io.sockets.emit("new message", {
      //   message: msg,
      //   roomId: roomId,
      // });
      // console.log(roomId, msg);
      // global.io.sockets.in(roomId).emit("new message", { message: msg });
      // client.broadcast.to('my room').emit('hello', msg);
      //tämä toimii, mut global ei
      //tässä ei ehkä tiedä kuka lähettää?
      //kuitenkin siinä esimerkissä se toimii globalin kautta
      // console.log(roomId);
      // client.to(roomId).emit("new message", {
      //   message: msg,
      //   roomId: roomId,
      // });
      // client.broadcast.in(roomId).emit("new message", {
      //   message: msg,
      //   roomId: roomId,
      // });
      // client.broadcast.emit(/* ... */);
      // console.log(roomId);
      // client.broadcast.to(roomId).emit("new message", {
      //   message: msg,
      //   roomId: roomId,
      // });
      // global.io.sockets.broadcast
      //tee index uusiksi
      //tee index uusiksi
      //tee index uusiksi
      //tee index uusiksi
      //tee index uusiksi
      //tee index uusiksi
      //tee index uusiksi
      //tee index uusiksi
      //tee index uusiksi
      //tee index uusiksi
      //tee index uusiksi
      //tee index uusiksi
      // console.log(client.id, "tämä lähettää");
      // console.log(users, "tässä käyttäjät");
      // console.log(roomId, "room id johon lähettää");
      // global.io.sockets.to(roomId).emit("new message", {
      //   message: msg,
      //   roomId: roomId,
      // });
    });

    // event fired when the chat room is disconnected
    client.on("disconnect", () => {
      connectedUsers = connectedUsers.filter(
        (user) => user.socketId !== client.id
      );

      // console.log(connectedUsers);
      // console.log("disconnected", client.id);
      io.emit("users live", {
        connectedUsers,
      });
    });
    // // add identity of user mapped to the socket id
    client.on("userOnline", (userId) => {
      const index = liveUsers.findIndex((user) => user === userId);
      // console.log(index);
      if (index === -1) {
        liveUsers.push(userId);
      }

      // console.log(liveUsers);
      io.emit("userOnline", liveUsers);
    });
    client.on("userOffline", (userId) => {
      // console.log(userId, "offlineen meni");
      liveUsers = liveUsers.filter((user) => user !== userId);

      io.emit("userOnline", liveUsers);
    });
    // client.on("id connect", (data) => {
    //   console.log("täällä on nyt");
    //   data.users.forEach((userId) => {
    //     const index = users.findIndex((user) => user.userId === userId);
    //     if (index !== -1) {
    //       const socketId = users[index].socketId;
    //       console.log(socketId, "Tässä kyseisen socket Id");

    //       io.to(socketId).emit("updates", "roomRemoved", {
    //         roomId: data.roomId,
    //       });
    //     } else {
    //       console.log("ei ole nyt yhteydessä");
    //     }
    //   });
    // });

    client.on("identity", (userId, accountType) => {
      // console.log(connectedUsers);
      const index = connectedUsers.findIndex((user) => user.userId === userId);

      if (index === -1) {
        connectedUsers.push({
          socketId: client.id,
          userId: userId,
          accountType,
        });
      } else {
        // console.log(client.id, "tämä on uusi");

        connectedUsers[index].socketId = client.id;
        // console.log(connectedUsers[index].socketId, "pitäisi löytyä täältä");
        // console.log(connectedUsers, "Tässä kaikki käyttäjät");
      }

      // console.log(users, "tässä käyttäjät");
    });
    // subscribe person to chat & other user as well
    // client.on("login", ({ name, roomId }, callback) => {
    //   // const { user, error } = addUser(socket.id, name, room);
    //   // if (error) return callback(error);
    //   // const error = "nyt meni pieleen"
    //   // return callback(error)

    //   client.join(roomId);
    //   // console.log(
    //   //   "katso saako tämän niin, että ei lähetä ollenkaan lähettäjälle tieota. Tee ensin erikseen yksinkertaisesti"
    //   // );
    //   global.io.sockets.in(roomId).emit("notification", {
    //     title: "Someone's here",
    //     description: `"tähän muuttuja" just entered the room`,
    //   });

    //   // global.io.in(room).emit("users", "ljjowiejfiwjelfij");
    //   callback();
    // });

    client.on("subscribe", async (roomId, otherUserId = "") => {
      // subscribeOtherUser(roomId, otherUserId);
      // console.log(global.io.sockets, "täältä tää");

      client.join(roomId);

      // const socketsInARoomInSomeNamespace = io
      //   .of("/")
      //   .in("/" + roomId)
      //   .fetchSockets()
      //   .then((room) => {
      //     console.log("clients in this room: ", room.length);
      //   });

      // const sockets = await client.in(roomId).fetchSockets();

      // console.log(roomId, "huone id, join");
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
  const userSockets = connectedUsers.filter(
    (user) => user.userId === otherUserId
  );
  // console.log(userSockets);
  userSockets.map((userInfo) => {
    const socketConn = global.io.sockets.connected(userInfo.socketId);
    if (socketConn) {
      socketConn.join(roomId);
    }
  });
};

function ioUpdateByUserId(targetUsers, action, data) {
  targetUsers.forEach((currentUserId) => {
    const socketId = getUserSocketIdByUserId(currentUserId);
    sendDataToUser(currentUserId, socketId, action, data);
  });
}

async function ioUpdateToAllUsers(action, data) {
  const activeUsers = await User.aggregate([
    { $match: { status: "active" } },
    { $project: { _id: 1 } },
  ]);

  activeUsers.map((activeUser) => {
    const currentUserId = activeUser._id.toString();
    const socketId = getUserSocketIdByUserId(currentUserId);
    sendDataToUser(currentUserId, socketId, action, data);
  });
}

async function ioUpdateToByRoomId(rooms, action, data) {
  rooms.map(async (roomId) => {
    const { members } = await Room.findById(roomId).lean().exec();

    members.map((currentUserId) => {
      const socketId = getUserSocketIdByUserId(currentUserId);
      sendDataToUser(currentUserId, socketId, action, data);
    });
  });
}

function sendDataToUser(currentUserId, socketId, action, data) {
  try {
    // console.log(socketId);
    if (socketId) {
      io.to(socketId).emit("updates", action, data);
      console.log("ei tee ", action, currentUserId);
    } else {
      console.log("tekee buckettiin", action, currentUserId);
      ChangeBucket.updateOne(
        { _id: currentUserId },
        { $addToSet: { changes: { type: action, data } } }
      ).exec();
    }
  } catch (error) {
    console.log(error, "code 9fi3r3ffe");
  }
}

function getUserSocketIdByUserId(userId) {
  const index = connectedUsers.findIndex((user) => user.userId === userId);
  return index === -1 ? false : connectedUsers[index].socketId;
}

module.exports.WebSockets = new WebSockets();
module.exports.ioUpdateByUserId = ioUpdateByUserId;
module.exports.ioUpdateToAllUsers = ioUpdateToAllUsers;
module.exports.ioUpdateToByRoomId = ioUpdateToByRoomId;
