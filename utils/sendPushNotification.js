const { User } = require("../models/user");
const { Expo } = require("expo-server-sdk");

module.exports = async function (members, data) {
  const allUsers = await User.find().lean().exec();
  const allPushTokensData = [];

  members.map((currentUserId) => {
    if (currentUserId === data.postedByUser) {
      return;
    }

    const index = allUsers.findIndex(
      (user) => user._id.toString() === currentUserId
    );

    if (
      index !== -1 &&
      allUsers[index].pushNotificationToken &&
      !["null", null, undefined, "undefined", ""].includes(
        allUsers[index].pushNotificationToken
      )
    ) {
      allPushTokensData.push(
        getPushMessage(allUsers[index].pushNotificationToken, data)
      );
    }
  });

  sendPushMessages(allPushTokensData);
};

const sendPushMessages = async (allPushTokensData) => {
  const uniqueIds = [];

  const unique = allPushTokensData.filter((token) => {
    const isDuplicate = uniqueIds.includes(token.to);

    if (!isDuplicate) {
      uniqueIds.push(token.to);

      return true;
    }
  });

  const expo = new Expo();

  let chunks;
  try {
    chunks = expo.chunkPushNotifications(unique);
  } catch (error) {}

  const sendChunks = () => {
    chunks.forEach(async (chunk) => {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {}
    });
  };

  sendChunks();
};

const getPushMessage = (token, data) => {
  const { roomId, postedByUser, messageBody, type } = data;

  return {
    to: token,
    sound: "default",
    body: data.messageBody,
    channelId: "live-notifications",
    data: { roomId, postedByUser, messageBody, type },
    ttl: 1000,
    priority: "high",
  };
};
