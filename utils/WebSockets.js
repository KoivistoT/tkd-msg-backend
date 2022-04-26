const { AllTasks } = require("../models/allTasks");
const { Room } = require("../models/room");
const { User } = require("../models/user");
const mongoose = require("mongoose");
const sendPushNotification = require("./sendPushNotification");
const { Message } = require("../models/message");
const { AllMessages } = require("../models/allMessages");
const removeItemFromArray = require("./removeItemFromArray");

connectedUsers = [];
liveUsers = [];
typers = [];
class WebSockets {
  connection(client) {
    client.on("disconnect", () => {
      connectedUsers = connectedUsers.filter(
        (user) => user.socketId !== client.id
      );

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
        documentDisplayName,
      } = data;

      try {
        const message = await Message.create({
          messageBody,
          roomId,
          postedByUser,
          replyMessageId,
          type,
          imageURLs: imageURLs || null,
          documentData: { documentDownloadURL, documentDisplayName },
        });

        const socketId = getUserSocketIdByUserId(postedByUser);
        io.to(socketId).emit("currentUserMessage", message);

        ioUpdateByRoomId([roomId], "msg", "new message", message);

        const latestMessage = {
          createdAt: message.createdAt,
          messageBody: message.messageBody,
          postedByUser: message.postedByUser,
        };

        const room = await Room.findOneAndUpdate(
          { _id: roomId },
          {
            latestMessage,
            $inc: { messageSum: 1 },
          },

          { new: true }
        )
          .lean()
          .exec();

        const latestMessage2 = {
          createdAt: message.createdAt,
          messageBody: message.messageBody,
          postedByUser: message.postedByUser,
          roomId,
          messageSum: room.messageSum,
        };

        ioUpdateByRoomId(
          [roomId],
          "room",
          "roomLatestMessageChanged",
          latestMessage2
        );

        AllMessages.updateOne(
          { _id: roomId },
          { $addToSet: { messages: message } }
        ).exec();
      } catch (error) {
        console.log(error, "code 72766551");
      }
    });

    client.on("userOnline", (userId) => {
      const index = liveUsers.findIndex((user) => user === userId);

      if (index === -1) {
        liveUsers.push(userId);
      }

      io.emit("userOnline", liveUsers);
    });

    client.on("identity", (userId, accountType) => {
      const index = connectedUsers.findIndex((user) => user.userId === userId);

      if (index === -1) {
        connectedUsers.push({
          socketId: client.id,
          userId: userId,
          accountType,
        });
      } else {
        connectedUsers[index].socketId = client.id;
      }

      io.emit("typers", typers);
      checkUserTasks(userId);
    });

    client.on("subscribe", async (roomId, otherUserId = "") => {
      client.join(roomId);
    });

    client.on("unsubscribe", (roomId) => {
      client.leave(roomId);
    });

    client.on("subscribe_read_at", async (roomId) => {
      client.join(roomId);
    });

    client.on("unsubscribe_read_at", (roomId) => {
      client.leave(roomId);
    });

    client.on("userOffline", (userId) => {
      liveUsers = liveUsers.filter((user) => user !== userId);
      io.emit("userOnline", liveUsers);
    });

    client.on("isTyping", (roomId, userId) => {
      typers.push({ roomId, userId });
      io.emit("typers", typers);
    });

    client.on("notTyping", (userId) => {
      typers = typers.filter((typer) => typer.userId !== userId);
      io.emit("typers", typers);
    });
  }
}

async function checkUserTasks(currentUserId) {
  const data = await AllTasks.findById(currentUserId);

  const roomRemovedGroup = [];
  const roomAddedGroup = [];
  const msgGroup = [];
  const messageUpdated = [];
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
        if (taskGroupType === "messageUpdated") {
          messageUpdated.push(task);
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
          { taskGroupType: "messageUpdated", data: messageUpdated },
        ],
      };

      const socketId = getUserSocketIdByUserId(currentUserId);
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

async function ioUpdateToAllUsers(taskGroupType, action, data, currentUserId) {
  const activeUsers = await User.aggregate([
    { $match: { status: "active" } },
    { $project: { _id: 1 } },
  ]);

  activeUsers.map((activeUser) => {
    if (activeUser._id.toString() === currentUserId) return;

    const userId = activeUser._id.toString();
    const socketId = getUserSocketIdByUserId(userId);
    sendDataToUser(userId, socketId, taskGroupType, action, data);
  });
}

async function ioUpdateByRoomId(
  rooms,
  taskGroupType,
  action,
  data,
  currentUserId
) {
  rooms.map(async (roomId) => {
    const room = await Room.findById(roomId).lean().exec();

    if (!room) return;

    const members = removeItemFromArray(currentUserId, room.members);

    members.map((userId) => {
      const socketId = getUserSocketIdByUserId(userId);
      if (action === "new message" && userId === data.postedByUser) return;

      sendDataToUser(userId, socketId, taskGroupType, action, data);
    });

    if (action === "new message") {
      sendPushNotification(members, data);
    }
  });
}

async function ioUpdateToMessageSender(postedByUser, action, data) {
  const socketId = getUserSocketIdByUserId(postedByUser);
  io.to(socketId).emit(action, data);
}

async function sendDataToUser(
  currentUserId,
  socketId,
  taskGroupType,
  taskType,
  data
) {
  try {
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
    } else {
      const taskId = Date.now();

      const isAlreadyCurrentRoomLatestMessageChangedTask =
        await AllTasks.aggregate([
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

      if (isAlreadyCurrentRoomLatestMessageChangedTask.length !== 0) {
        await AllTasks.findByIdAndUpdate(
          {
            _id: currentUserId,
          },
          {
            $pull: {
              tasks: {
                taskId:
                  isAlreadyCurrentRoomLatestMessageChangedTask[0].tasks[0]
                    .taskId,
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
    }
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
module.exports.ioUpdateByRoomId = ioUpdateByRoomId;
module.exports.ioUpdateToMessageSender = ioUpdateToMessageSender;
