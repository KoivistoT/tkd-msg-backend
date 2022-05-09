const addObjectIds = require("../utils/addObjectIds");
const { check } = require("../utils/check");
const mongoose = require("mongoose");

const MESSAGE_TYPES = {
  TYPE_TEXT: "text",
  TYPE_IMAGE: "image",
  TYPE_DOCUMENT: "document",
  TYPE_REPLY: "reply",
};

const readByRecipientSchema = new mongoose.Schema(
  {
    readByUserId: String,
    readAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

const messageSchema = new mongoose.Schema(
  {
    postedByUser: { type: String },
    messageBody: {
      type: String,
    },
    roomId: { type: String },
    reactions: { type: Array },
    replyMessageId: { type: String },
    imageURLs: { type: Array },
    messageStatus: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    documentData: {
      documentDownloadURL: { type: String },
      documentDisplayName: { type: String },
    },
    type: {
      type: String,
      default: () => MESSAGE_TYPES.TYPE_TEXT,
    },
    readByRecipients: [readByRecipientSchema],
  },
  {
    timestamps: true,
    collection: "messages",
  }
);
const allMessagesSchema = new mongoose.Schema({
  messages: [messageSchema],
});

allMessagesSchema.statics.updateReactions = async function (
  roomId,
  messageId,
  reaction,
  currentUserId
) {
  try {
    const reactionObject = { reactionByUser: currentUserId, reaction };

    const item = await this.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $set: {
          message: {
            $filter: {
              input: "$messages",
              as: "m",
              cond: {
                $eq: ["$$m._id", new mongoose.Types.ObjectId(messageId)],
              },
            },
          },
        },
      },
      { $unwind: { path: "$message" } },

      {
        $project: { "message.reactions": 1, _id: 0 },
      },
    ]);

    let action = check.addOrPullReaction(
      item[0].message.reactions,
      reaction,
      currentUserId
    );

    await this.findOneAndUpdate(
      { _id: roomId },
      {
        [action]: {
          "messages.$[element].reactions": reactionObject,
        },
      },

      {
        arrayFilters: [
          {
            "element._id": messageId,
          },
        ],
      }
    ).exec();

    const updatedMessage = await this.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $set: {
          message: {
            $filter: {
              input: "$messages",
              as: "m",
              cond: {
                $eq: ["$$m._id", new mongoose.Types.ObjectId(messageId)],
              },
            },
          },
        },
      },
      { $unwind: { path: "$message" } },

      {
        $project: { message: 1, _id: 0 },
      },
    ]);

    return updatedMessage[0].message;
  } catch (error) {
    constole.log("Could not update reactions");
  }
};

allMessagesSchema.statics.findMessageById = async function (roomId, messageId) {
  try {
    const item = await this.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $set: {
          message: {
            $filter: {
              input: "$messages",
              as: "m",
              cond: {
                $eq: ["$$m._id", new mongoose.Types.ObjectId(messageId)],
              },
            },
          },
        },
      },
      { $unwind: { path: "$message" } },

      {
        $project: { message: 1, _id: 0 },
      },
    ]);

    return item[0].message;
  } catch (error) {
    constole.log("Could not get the message.");
  }
};

allMessagesSchema.statics.getImageURLsByRoomId = async function (roomId) {
  try {
    const imageURLs = await this.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $set: {
          messages: {
            $filter: {
              input: "$messages",
              as: "m",
              cond: { $eq: ["$$m.type", "image"] },
            },
          },
        },
      },
      { $unwind: { path: "$messages" } },
      { $unwind: { path: "$messages.imageURLs" } },
      { $project: { "messages.imageURLs": 1, _id: 0 } },
    ]);

    return imageURLs
      .reverse()
      .map((message) => Object.values(message)[0].imageURLs);
  } catch (error) {
    constole.log("Could not get the images URLs.");
  }
};

allMessagesSchema.statics.deleteMessageById = function (messageId) {
  try {
    AllMessages.updateOne(
      {
        _id: "roomId",
        "messages._id": messageId,
      },
      { $set: { "messages.$.deleted": true } }
    ).exec();

    return true;
  } catch (error) {
    constole.log("Could not delete the message.");
  }
};

allMessagesSchema.statics.addNewMessage = function (roomId, message) {
  try {
    AllMessages.updateOne(
      { _id: roomId },
      { $addToSet: { messages: message } }
    ).exec();

    return true;
  } catch (error) {
    constole.log("Could not add the message.");
  }
};

allMessagesSchema.statics.getAllMessagesOnInit = async function (
  roomId,
  SEND_MESSAGES_FIRST_SUM
) {
  try {
    return await this.findById(roomId)
      .slice("messages", -SEND_MESSAGES_FIRST_SUM)
      .lean();
  } catch (error) {
    constole.log("Could not get messages.");
  }
};

allMessagesSchema.statics.getAllImageURLsOnInit = async function (roomId) {
  try {
    return await this.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $set: {
          messages: {
            $filter: {
              input: "$messages",
              as: "m",
              cond: { $eq: ["$$m.type", "image"] },
            },
          },
        },
      },
      { $unwind: { path: "$messages" } },
      { $unwind: { path: "$messages.imageURLs" } },
      {
        $project: { "messages.imageURLs": 1, _id: 0 },
      },
    ]);
  } catch (error) {
    constole.log("Could not get images.");
  }
};

allMessagesSchema.statics.getRoomMessagesById = async function (roomId) {
  try {
    const result = await this.findById(roomId).lean();

    return {
      _id: result._id,
      messages: addObjectIds(result.messages.reverse()),
    };
  } catch (error) {
    constole.log("Could not get the messages.");
  }
};

allMessagesSchema.statics.addReadByRecipients = function (
  roomId,
  currentUserId
) {
  try {
    this.findOneAndUpdate(
      { _id: roomId },
      {
        $addToSet: {
          "messages.$[element].readByRecipients": {
            readByUserId: currentUserId,
            readAt: Date.now(),
          },
        },
      },

      {
        arrayFilters: [
          {
            "element.readByRecipients.readByUserId": { $ne: currentUserId },
            "element.postedByUser": { $ne: currentUserId },
          },
        ],
      }
    ).exec();

    return true;
  } catch (error) {
    constole.log("Could not add recepient.");
  }
};

allMessagesSchema.statics.getRestMessagesOnInit = async function (messagesNow) {
  try {
    const userAllMessages = [];

    await Promise.all(
      Object.keys(messagesNow).map(async (currentRoomId) => {
        const result = await this.findById(currentRoomId).lean();

        if (
          Object.values(messagesNow[currentRoomId].messages)[
            Object.values(messagesNow[currentRoomId].messages).length - 1
          ]
        ) {
          const lastMessageIndex = result.messages.findIndex(
            (message) =>
              message._id.toString() ===
              Object.values(messagesNow[currentRoomId].messages)[
                Object.values(messagesNow[currentRoomId].messages).length - 1
              ]._id
          );

          if (lastMessageIndex === 0) {
            return;
          }
          const allMessages = await this.find(
            { _id: currentRoomId },
            { messages: { $slice: [0, lastMessageIndex] } }
          ).lean();

          if (allMessages[0].messages) {
            const messagesObject = {
              _id: allMessages[0]._id,
              messages: addObjectIds(allMessages[0].messages.reverse()),
            };
            userAllMessages.push(messagesObject);
          }
        }
      })
    );

    return userAllMessages;
  } catch (error) {
    constole.log("Could not get messages.");
  }
};

const AllMessages = mongoose.model("AllMessages", allMessagesSchema);

exports.allMessagesSchema = allMessagesSchema;
exports.AllMessages = AllMessages;
