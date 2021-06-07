const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const { User, validate } = require("../models/user");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const firebase = require("firebase");
// Required for side-effects
// require("firebase/firestore");
const { Expo } = require("expo-server-sdk");
// firebase.initializeApp({
//   apiKey: "AIzaSyCIIA2_x2vIpq_H7h0lukW5MZejf_3YP9U",
//   authDomain: "rivers-app-9ab9d.firebaseapp.com",
//   projectId: "rivers-app-9ab9d",
// });

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.post("/push", async (req, res) => {
  var db = firebase.firestore();

  const language = req.body.language;

  // console.log(req.body.pushContent.pushMessage);
  const pushType = req.body.pushType;
  // console.log(language);
  // return;
  try {
    firebase
      .auth()
      .signInWithEmailAndPassword("koivisto_timo@hotmail.com", "jaaha1234");

    firebase.auth().onAuthStateChanged((user) => {
      if (user != null) {
        console.log("We are authenticated now!");
        const chuncToSend = [];
        try {
          // const docRef = db.collection("testdb");
          // ExponentPushToken[OMbqczJy2Vr2yuRoIajbP3] minun expo
          // ExponentPushToken[YqIYMgGwfvUNVvk7t2Fl3r] Minun oikea
          // "ExponentPushToken[uZPuvjCRaWdLKu4Rfmpj6X]" Pastoi Tomin push token tämä
          db.collection("pushTokens")
            .get()
            .then(function (querySnapshot) {
              querySnapshot.forEach(function (doc) {
                const docObject = doc.data();
                var pushTokenObject;
                if (language === "ALL") {
                  pushTokenObject = getPushToken(pushType, docObject, req);
                } else if (
                  doc.data().selectedLanguage === "FIN" &&
                  language === "FIN"
                ) {
                  pushTokenObject = getPushToken(pushType, docObject, req);
                } else if (
                  language === "EN" &&
                  (doc.data().selectedLanguage === undefined ||
                    doc.data().selectedLanguage === "EN")
                ) {
                  pushTokenObject = getPushToken(pushType, docObject, req);
                }
                if (pushTokenObject) {
                  chuncToSend.push(pushTokenObject);
                }
              });
              console.log(chuncToSend);
              console.log(chuncToSend.length);
              sendPushMessage(chuncToSend);
            });
        } catch (err) {
          console.log("jokin meni pieleen" + err);
        }
      } else console.log("Ei olla nyt kirjautunut");
    });
    res.status(200).send("lähetetty");
  } catch (error) {
    res.status(404).send("Jokin meni pieleen");
    console.log(error);
  }
});

const sendPushMessage = async (chuncToSend) => {
  // console.log(thisToken);
  // const sendPushNotification = async (targetExpoPushToken, message) => {
  var chunks = chuncToSend;
  const expo = new Expo();
  try {
    chunks = expo.chunkPushNotifications(chuncToSend);
  } catch (error) {
    console.log(error, "kk");
  }

  // const chunks = expo.chunkPushNotifications([
  //   chuncToSend,
  //   {
  //     to: chuncToSend,
  //     sound: "default",
  //     body: "Tästä avaamalla menee featureen",
  //     data: { goScreen: "feature" },
  //   }
  //   // req.body,
  //   // https://www.npmjs.com/package/expo-server-sdks
  // ]);

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

  //     if (Platform.OS === "android") {
  //   Notifications.setNotificationChannelAsync("default", {
  //     name: "default",
  //     importance: Notifications.AndroidImportance.MAX,
  //     vibrationPattern: [0, 250, 250, 250],
  //     lightColor: "#FF231F7C",
  //   });
  // }
  await sendChunks();
};

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

const getPushToken = (pushType, docObject, req) => {
  const pushTokenObject = {
    to: docObject.pushToken,
    sound: "default",
    body: req.body.body,
    channelId: "live-notifications",
    data: req.body.data,
    ttl: 1000,
    priority: "high",
  };
  if (pushType === "1001") {
    if (docObject.liveAlert1 === "true") {
      return pushTokenObject;
    }
  }
  if (pushType === "1002") {
    if (docObject.liveAlert2 === "true") {
      return pushTokenObject;
    }
  }
  if (pushType === "1003" || pushType === "1004") {
    return pushTokenObject;
  }
};
