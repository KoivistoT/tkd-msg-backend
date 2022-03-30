const { AllTasks } = require("../models/allTasks");
const { Room } = require("../models/room");
const { User } = require("../models/user");
const mongoose = require("mongoose");
const sendPushNotification = require("./sendPushNotification");
const { Message } = require("../models/message");
const { AllMessages } = require("../models/allMessages");

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
      console.log("disconnected");

      // console.log(connectedUsers);
      // console.log("disconnected", client.id);
      io.emit("users live", {
        connectedUsers,
      });
    });

    client.on("newChatMessage", async (data) => {
      const {
        currentUserId: postedByUser,
        message: messageBody,
        currentRoomId: roomId,
        messageType: type,
        imageURLs,
        replyMessageId,
        documentDownloadURL,
        documentDbName,
      } = data;
      console.log(documentDownloadURL, documentDbName, "tulii");

      try {
        const message = await Message.create({
          messageBody,
          roomId,
          postedByUser,
          replyMessageId,
          type,
          imageURLs: imageURLs || null,
          documentData: { documentDownloadURL, documentDbName },
        });

        const socketId = getUserSocketIdByUserId(postedByUser);
        io.to(socketId).emit("currentUserMessage", message);

        ioUpdateToByRoomId([roomId], "msg", "new message", message);

        const latestMessage = {
          createdAt: message.createdAt,
          messageBody: message.messageBody,
          postedByUser: message.postedByUser,
          roomId,
        };

        ioUpdateToByRoomId(
          [roomId],
          "room",
          "roomLatestMessageChanged",
          latestMessage
        );

        //tähänkin varmistus, eli tuon updaten alle

        Room.findOneAndUpdate(
          { _id: roomId },
          {
            latestMessage,
            $inc: { messageSum: 1 },
          },

          { new: true }
        )
          .lean()
          .exec();

        AllMessages.updateOne(
          { _id: roomId },
          { $addToSet: { messages: message } }
        ).exec();
      } catch (error) {
        console.log(error, "code 72766551");
      }
      // io.emit("users live", {
      //   connectedUsers,
      // });
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
      // console.log("identity tuli");
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

      checkUserTasks(userId);
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
      // console.log("lähti", roomId);
    });

    client.on("subscribe_read_at", async (roomId) => {
      client.join(roomId);
      // console.log("tuli read at", roomId);
    });
    client.on("unsubscribe_read_at", (roomId) => {
      client.leave(roomId);
      // console.log("lähti read at", roomId);
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

async function checkUserTasks(currentUserId) {
  const data = await AllTasks.findById(currentUserId);

  //voiko jo poistaa ???
  // AllTasks.findOneAndUpdate(
  //   { _id: currentUserId },
  //   { tasks: [] },
  //   { new: true }
  // )
  //   .lean()
  //   .exec();

  const roomRemovedGroup = [];
  const roomAddedGroup = [];
  const msgGroup = [];
  const roomGroup = [];
  const userGroup = [];

  try {
    if (data.tasks.length > 0) {
      data.tasks.forEach((task) => {
        const { taskGroupType } = task;
        if (taskGroupType === "roomAdded") {
          roomAddedGroup.push(task);
        }
        if (taskGroupType === "roomRemoved") {
          roomRemovedGroup.push(task);
        }
        if (taskGroupType === "msg") {
          msgGroup.push(task);
        }
        if (taskGroupType === "room") {
          roomGroup.push(task);
        }
        if (taskGroupType === "user") {
          userGroup.push(task);
        }
      });

      const latestTask = data.tasks.reduce((a, b) =>
        a.taskId > b.taskId ? a : b
      );
      const latestTaskId = latestTask.taskId;

      const taskGroups = {
        latestTaskId,
        data: [
          { taskGroupType: "roomAdded", data: roomAddedGroup },
          { taskGroupType: "roomRemoved", data: roomRemovedGroup },
          { taskGroupType: "room", data: roomGroup },
          { taskGroupType: "user", data: userGroup },
          { taskGroupType: "msg", data: msgGroup },
        ],
      };

      // tee niin, että aina roomAdded ekana
      const socketId = getUserSocketIdByUserId(currentUserId);
      console.log("lähettää taskit");
      io.to(socketId).emit("updates", taskGroups);
    }
  } catch (error) {
    console.log(error, "code 8772772");
  }
}
function ioUpdateByUserId(targetUsers, taskGroupType, action, data) {
  try {
    targetUsers.forEach((currentUserId) => {
      const socketId = getUserSocketIdByUserId(currentUserId);
      sendDataToUser(currentUserId, socketId, taskGroupType, action, data);
    });
  } catch (error) {
    console.log(error, "code 992iii2i");
  }
}

async function ioUpdateToAllUsers(taskGroupType, action, data) {
  const activeUsers = await User.aggregate([
    { $match: { status: "active" } },
    { $project: { _id: 1 } },
  ]);

  activeUsers.map((activeUser) => {
    const currentUserId = activeUser._id.toString();
    const socketId = getUserSocketIdByUserId(currentUserId);
    sendDataToUser(currentUserId, socketId, taskGroupType, action, data);
  });
}

async function ioUpdateToByRoomId(rooms, taskGroupType, action, data) {
  rooms.map(async (roomId) => {
    const { members } = await Room.findById(roomId).lean().exec();

    members.map((currentUserId) => {
      const socketId = getUserSocketIdByUserId(currentUserId);
      if (action === "new message" && currentUserId === data.postedByUser)
        return;

      sendDataToUser(currentUserId, socketId, taskGroupType, action, data);
    });
    if (action === "new message") {
      sendPushNotification(members, data);
    }
  });
}
async function ioUpdateToMessageSender(postedByUser, action, data) {
  const socketId = getUserSocketIdByUserId(postedByUser);
  io.to(socketId).emit(action, data);
  //   postedByUser,
  //   taskGroupType,
  //   action,
  //   data
  // ) {
  //   const socketId = getUserSocketIdByUserId(postedByUser);
  //   io.to(socketId).emit(
  //     "updates",

  //     {
  //       latestTaskId: null,
  //       data: [
  //         {
  //           taskGroupType: taskGroupType,
  //           data: [{ taskType: action, data }],
  //         },
  //       ],
  //     }
  //   );
}

async function sendDataToUser(
  currentUserId,
  socketId,
  taskGroupType,
  taskType,
  data
) {
  try {
    // console.log(socketId);
    // const taskId = Date.now();
    if (socketId) {
      io.to(socketId).emit(
        "updates",

        {
          latestTaskId: null,
          data: [
            {
              taskGroupType: taskGroupType,
              data: [{ taskType, data, taskId: null }],
            },
          ],
        }
      );
      // console.log("ei tee ", action, currentUserId);
    }
    // else {
    //   console.log("tekee buckettiin", action, currentUserId, bucketId);
    //   ChangeBucket.updateOne(
    //     { _id: currentUserId },
    //     { $addToSet: { changes: { type: action, data } } }
    //   ).exec();
    // }
    // else {
    const taskId = Date.now();

    const isAlreadyCurrentRoomLatestMessageChanged = await AllTasks.aggregate([
      {
        $match: {
          $and: [
            { _id: new mongoose.Types.ObjectId(currentUserId) },
            { "tasks.taskType": "roomLatestMessageChanged" },
            { "tasks.data.roomId": data.roomId },
          ],
        },
      },
      {
        $project: {
          tasks: {
            $filter: {
              input: "$tasks",
              as: "tasks",
              cond: {
                $and: [
                  {
                    $eq: ["$$tasks.data.roomId", data.roomId],
                    $eq: ["$$tasks.taskType", "roomLatestMessageChanged"],
                  },
                ],
              },
            },
          },
          _id: 0,
        },
      },
    ]);
    // console.log(isAlreadyCurrentRoomLatestMessageChanged[0].tasks[0].taskId);
    //ota tuon ticket id ja poista se
    if (isAlreadyCurrentRoomLatestMessageChanged.length !== 0) {
      await AllTasks.findByIdAndUpdate(
        {
          _id: currentUserId,
        },
        {
          $pull: {
            tasks: {
              taskId:
                isAlreadyCurrentRoomLatestMessageChanged[0].tasks[0].taskId,
            },
          },
        },

        { new: true }
      )
        .lean()
        .exec();
    }

    await AllTasks.updateOne(
      { _id: currentUserId },
      { $addToSet: { tasks: { taskGroupType, taskType, data, taskId } } }
    ).exec();
    // }
  } catch (error) {
    console.log(error, "code 9fi3r3ffe");
  }
}

function getUserSocketIdByUserId(userId) {
  try {
    const index = connectedUsers.findIndex((user) => user.userId === userId);
    return index === -1 ? false : connectedUsers[index].socketId;
  } catch (error) {
    console.log(error, "code 2888282");
  }
}

module.exports.WebSockets = new WebSockets();
module.exports.ioUpdateByUserId = ioUpdateByUserId;
module.exports.ioUpdateToAllUsers = ioUpdateToAllUsers;
module.exports.ioUpdateToByRoomId = ioUpdateToByRoomId;
module.exports.ioUpdateToMessageSender = ioUpdateToMessageSender;
