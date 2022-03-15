const { ChangeBucket } = require("../models/changeBucket");
const { Room } = require("../models/room");

users = [];
liveUsers = [];
class WebSockets {
  connection(client) {
    // console.log(`[${client.id}] socket connected`);

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
      users = users.filter((user) => user.socketId !== client.id);
      // console.log("lähti pois", client.id);
      io.emit("users live", {
        users,
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
      const index = users.findIndex((user) => user.userId === userId);
      if (index !== -1) return;

      users.push({
        socketId: client.id,
        userId: userId,
        accountType,
      });
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
  const userSockets = users.filter((user) => user.userId === otherUserId);
  console.log(userSockets);
  userSockets.map((userInfo) => {
    const socketConn = global.io.sockets.connected(userInfo.socketId);
    if (socketConn) {
      socketConn.join(roomId);
    }
  });
};

function ioUpdateById(targetUsers, action, data) {
  //tee niin, että ne, jotka vain pääkäyttäjille, menee vain nille, eli on tunniste, jonka avulla lähettää nille, ja muuttuja, johon voi määrittää, sendOnlyProUsers
  //tee niin, että ne, jotka vain pääkäyttäjille, menee vain nille, eli on tunniste, jonka avulla lähettää nille, ja muuttuja, johon voi määrittää, sendOnlyProUsers
  //tee niin, että ne, jotka vain pääkäyttäjille, menee vain nille, eli on tunniste, jonka avulla lähettää nille, ja muuttuja, johon voi määrittää, sendOnlyProUsers

  targetUsers.forEach((userId) => {
    const userSocketId = getUserSocketIdByUserId(userId);

    if (!userSocketId) return; // user is not connected
    // console.log("tässä muodossa", targetUsers, action, data);
    try {
      io.to(userSocketId).emit("updates", action, data);
    } catch (error) {
      console.log(error, "code ikjif92");
    }
  });
}

function ioUpdateToAllActiveUsers(
  action,
  data,
  onlyForAdmins = false,
  byPass = false
) {
  //tee niin, että ne, jotka vain pääkäyttäjille, menee vain nille, eli on tunniste, jonka avulla lähettää nille, ja muuttuja, johon voi määrittää, sendOnlyProUsers
  //tee niin, että ne, jotka vain pääkäyttäjille, menee vain nille, eli on tunniste, jonka avulla lähettää nille, ja muuttuja, johon voi määrittää, sendOnlyProUsers
  //tee niin, että ne, jotka vain pääkäyttäjille, menee vain nille, eli on tunniste, jonka avulla lähettää nille, ja muuttuja, johon voi määrittää, sendOnlyProUsers
  // console.log(users, "tässä idt");
  users.forEach((user) => {
    // console.log(user.socketId, "tässä yksi id");
    if (!user.socketId) return; // user is not connected
    if (user.userId === byPass) return;
    if (onlyForAdmins === true && user.accountType !== "admin") return;

    try {
      io.to(user.socketId).emit("updates", action, data);
    } catch (error) {
      console.log(error, "code 9fiffe");
    }
  });
}

async function ioUpdateToByRoomId(rooms, action, data) {
  await Promise.all(
    rooms.map(async (roomId) => {
      const { members } = await Room.findById(roomId).lean().exec();
      // console.log(
      //   "tämän saa varmaankin niin, että on ainoastaan yksi io update functio"
      // );
      //pitäisikö alla alempana, if lauseess, ettei viivettä, jos tilanne muuttuukin. Teen joo niin
      io.to(roomId).emit("updates", action, data);

      members.map((currentUserId) => {
        // if (users.includes(userId)) console.log("ei ole livenä", userId);

        if (!liveUsers.includes(currentUserId)) {
          // console.log("ei ole livenä", currentUserId);
          // console.log(action, data)
          ChangeBucket.updateOne(
            { _id: currentUserId },
            { $addToSet: { changes: { type: action, data } } }
          ).exec();
        }
      });
    })
  );

  // rooms.forEach((roomId) => {
  //   try {
  //     // console.log(users, "tässä käyttäjät");

  //     io.to(roomId).emit("updates", action, data);
  //   } catch (error) {
  //     console.log(error, "code 9fiiie");
  //   }
  // });
}

function getUserSocketIdByUserId(userId) {
  const index = users.findIndex((user) => user.userId === userId);
  return index === -1 ? false : users[index].socketId;
}

module.exports.WebSockets = new WebSockets();
module.exports.ioUpdateById = ioUpdateById;
module.exports.ioUpdateToAllActiveUsers = ioUpdateToAllActiveUsers;
module.exports.ioUpdateToByRoomId = ioUpdateToByRoomId;
