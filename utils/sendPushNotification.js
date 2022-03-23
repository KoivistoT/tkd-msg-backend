const { User } = require("../models/user");
const { Expo } = require("expo-server-sdk");
module.exports = async function (members, data) {
  const allUsers = await User.find().lean().exec();
  const allPushTokensData = [];
  members.map((currentUserId) => {
    //laita tämä taas pois
    //laita tämä taas pois
    //laita tämä taas pois
    //laita tämä taas pois
    //laita tämä taas pois
    //laita tämä taas pois
    // if (currentUserId === data.postedByUser) return;
    //laita tämä taas pois
    //laita tämä taas pois
    //laita tämä taas pois
    //laita tämä taas pois
    //laita tämä taas pois
    //laita tämä taas pois

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

  try {
    chunks = expo.chunkPushNotifications(unique);
  } catch (error) {
    console.log(error, "code 837728333");
  }

  //   const chunks = expo.chunkPushNotifications([
  //     unique,
  //     {
  //       to: unique,
  //       sound: "default",
  //       body: "Tästä avaamalla menee featureen",
  //       data: { goScreen: "feature" },
  //     },
  //   ]);

  const sendChunks = async () => {
    // This code runs synchronously. We're waiting for each chunk to be send.
    // A better approach is to use Promise.all() and send multiple chunks in parallel.
    // console.log("Sending Chunk", chunks);
    chunks.forEach(async (chunk) => {
      // return;
      try {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        console.log("Tickets", tickets);
      } catch (error) {
        console.log("Error sending chunk", error);
      }
    });
  };

  await sendChunks();
};

const getPushMessage = (token, data) => {
  return {
    to: token,
    sound: "default",
    body: data.messageBody,
    channelId: "live-notifications",
    data: { roomId: data.roomId },
    ttl: 1000,
    priority: "high",
  };
};
