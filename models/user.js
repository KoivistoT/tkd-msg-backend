const config = require("config");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    displayName: { type: String },
    email: { type: String, lowercase: true, unique: true },
    lastSeenMessages: { type: Array, default: [] },
    userRooms: { type: Array, default: [] },
    phone: { type: String, default: "" },
    lastPresent: { type: String },
    password: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 1024,
    },
    pushNotificationToken: { type: String },
    accountType: { type: String },
    status: { type: String, default: "active" },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      isAdmin: this.isAdmin,
      accountType: this.accountType,
      pushNotificationToken: this.pushNotificationToken,
    },
    config.get("jwtPrivateKey")
  );
};

const schema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  displayName: Joi.string().min(1).max(50).required(),
  lastPresent: Joi.string(),
  accountType: Joi.string().min(1).max(50).required(),
  email: Joi.string().min(5).max(255).required().email(),
  phone: Joi.string(),
  password: Joi.string().min(5).max(255).required(),
  status: Joi.string(),
  pushNotificationToken: Joi.string(),
});

userSchema.statics.addRoomToUsers = function (roomUsers, roomId) {
  try {
    roomUsers.forEach((userId) => {
      this.updateOne(
        { _id: userId },
        {
          $addToSet: {
            userRooms: roomId,
            lastSeenMessages: {
              roomId,
              lastSeenMessageSum: 0,
            },
          },
        }
      )
        .lean()
        .exec();
    });
  } catch (error) {
    console.log("Could not add the room.");
  }
};

userSchema.statics.updateUserDataById = async function (data) {
  try {
    const {
      accountType,
      firstName,
      lastName,
      displayName,
      email,
      phone,
      userId,
    } = data;

    return await this.findOneAndUpdate(
      { _id: userId },
      { accountType, firstName, lastName, displayName, email, phone },
      { new: true }
    ).lean();
  } catch (error) {
    console.log("Could not update the data.");
  }
};

userSchema.statics.updateOneField = async function (
  currentUserId,
  fieldName,
  value
) {
  try {
    return await User.findOneAndUpdate(
      { _id: currentUserId },
      { [fieldName]: value },
      { new: true }
    ).lean();
  } catch (error) {
    console.log("Could not update the field.");
  }
};
userSchema.statics.archiveOrDeleteUser = async function (userId, status) {
  try {
    await this.findOneAndUpdate(
      { _id: userId },
      { status, lastSeenMessages: [] },
      { new: true }
    ).lean();

    return true;
  } catch (error) {
    console.log("Could not update user data.");
  }
};

userSchema.statics.removeRoomFromUserById = function (roomId, userId) {
  try {
    this.findOneAndUpdate(
      { _id: userId },
      { $pull: { userRooms: roomId, lastSeenMessages: { roomId: roomId } } }
    )
      .lean()
      .exec();

    return true;
  } catch (error) {
    console.log("Could not remove the room.");
  }
};

userSchema.statics.getActiveUsers = async function () {
  try {
    return await this.aggregate([
      { $match: { status: "active" } },
      { $project: { _id: 1 } },
    ]);
  } catch (error) {
    console.log("Could not get active users.");
  }
};

userSchema.statics.addOrRemoveItemsInArrayById = async function (
  userId,
  action,
  fieldName,
  value
) {
  try {
    return await this.findOneAndUpdate(
      { _id: userId },
      {
        [action]: {
          [fieldName]: value,
        },
      },
      { new: true }
    )
      .lean()
      .exec();
  } catch (error) {
    console.log("Could not update the data.");
  }
};

userSchema.statics.addReadByMessageSum = async function (
  currentUserId,
  roomId,
  lastSeenMessageSum
) {
  try {
    const isLastSeenMessagesAlreadyAdded = await this.aggregate([
      {
        $match: {
          $and: [
            { _id: new mongoose.Types.ObjectId(currentUserId) },
            { "lastSeenMessages.roomId": roomId },
          ],
        },
      },
    ]);

    if (isLastSeenMessagesAlreadyAdded.length === 0) {
      this.updateOne(
        { _id: currentUserId },
        {
          $addToSet: {
            userRooms: roomId,
            lastSeenMessages: {
              roomId,
              lastSeenMessageSum: lastSeenMessageSum,
            },
          },
        }
      ).exec();
    } else {
      this.updateOne(
        { _id: currentUserId, "lastSeenMessages.roomId": roomId },
        {
          $set: {
            "lastSeenMessages.$.lastSeenMessageSum": lastSeenMessageSum,
          },
        },
        { new: true }
      )
        .lean()
        .exec();
    }

    return true;
  } catch (error) {
    console.log("Could not read or update the data.");
  }
};

const User = mongoose.model("User", userSchema);
exports.userSchema = userSchema;
exports.User = User;
exports.schema = schema;
