const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { User, validate } = require("../models/user");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const { Expo } = require("expo-server-sdk");

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

// router.post("/", async (req, res) => {
//   console.log("menee");

//   const sendPushNotification = async (targetExpoPushToken, message) => {
//     const expo = new Expo();
//     const chunks = expo.chunkPushNotifications([
//       // { to: targetExpoPushToken, sound: "default", body: message },
//       // {
//       //   to: "ExponentPushToken[3vcfsuIUA38AfF4LGWW87F]",
//       //   sound: "default",
//       //   body: "Viesti juu",
//       // },
//       req.body,
//       // https://www.npmjs.com/package/expo-server-sdks
//     ]);

//     const sendChunks = async () => {
//       // This code runs synchronously. We're waiting for each chunk to be send.
//       // A better approach is to use Promise.all() and send multiple chunks in parallel.
//       chunks.forEach(async (chunk) => {
//         console.log("Sending Chunk", chunk);
//         try {
//           const tickets = await expo.sendPushNotificationsAsync(chunk);
//           console.log("Tickets", tickets);
//         } catch (error) {
//           console.log("Error sending chunk", error);
//         }
//       });
//     };

//     //     if (Platform.OS === "android") {
//     //   Notifications.setNotificationChannelAsync("default", {
//     //     name: "default",
//     //     importance: Notifications.AndroidImportance.MAX,
//     //     vibrationPattern: [0, 250, 250, 250],
//     //     lightColor: "#FF231F7C",
//     //   });
//     // }
//     await sendChunks();
//   };

//   sendPushNotification();

//   res.status(404).send("lähetetty?");
// });

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(_.pick(req.body, ["name", "email", "password"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  const token = user.generateAuthToken();

  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.pick(user, ["_id", "name", "email"]));
});

module.exports = router;

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});
