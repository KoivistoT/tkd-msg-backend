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

        const room = await Room.updateLatestMessage(roomId, latestMessage);

        const latestMessageWithMessagesum = {
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
          latestMessageWithMessagesum
        );

        AllMessages.addNewMessage(roomId, message);
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
  const taskGroups = await AllTasks.getUserTasksById(currentUserId);

  if (taskGroups) {
    const socketId = getUserSocketIdByUserId(currentUserId);
    io.to(socketId).emit("updates", taskGroups);
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
  const activeUsers = await User.getActiveUsers();

  activeUsers.map((activeUser) => {
    const activeUserId = activeUser._id.toString();
    if (activeUserId === currentUserId) return;

    const socketId = getUserSocketIdByUserId(activeUserId);
    sendDataToUser(activeUserId, socketId, taskGroupType, action, data);
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
      io.to(socketId).emit("updates", {
        latestTaskId: null,
        data: [
          {
            taskGroupType: taskGroupType,
            data: [{ taskType, data, taskId: null }],
          },
        ],
      });
    } else {
      AllTasks.updateTasks(currentUserId, taskGroupType, taskType, data);
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
