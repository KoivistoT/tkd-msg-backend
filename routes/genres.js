const validateObjectId = require("../middleware/validateObjectId");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { Genre, validate } = require("../models/genre");
const mongoose = require("mongoose");
const express = require("express");

const { Expo } = require("expo-server-sdk");
const router = express.Router();
const firebase = require("firebase");
// Required for side-effects
require("firebase/firestore");

router.get("/", async (req, res) => {
  // throw new Error("Could not get the genres.");
  // firebase.initializeApp({
  //   apiKey: "AIzaSyCIIA2_x2vIpq_H7h0lukW5MZejf_3YP9U",
  //   authDomain: "rivers-app-9ab9d.firebaseapp.com",
  //   projectId: "rivers-app-9ab9d",
  // });

  // var db = firebase.firestore();

  // try {
  //   firebase
  //     .auth()
  //     .signInWithEmailAndPassword("koivistolle@gmail.com", "Front1213");

  //   firebase.auth().onAuthStateChanged((user) => {
  //     if (user != null) {
  //       console.log("We are authenticated now!");
  //       const chuncToSend = [];
  //       try {
  //         // const docRef = db.collection("testdb");
  //         // "ExponentPushToken[uZPuvjCRaWdLKu4Rfmpj6X]" Pastoi Tomin push token tämä
  //         db.collection("pushTokens")
  //           .get()
  //           .then(function (querySnapshot) {
  //             querySnapshot.forEach(function (doc) {
  //               if (
  //                 doc.data().pushToken ===
  //                   "ExponentPushToken[1ET0mtLqCB7u4fMjZYS7Hs]" ||
  //                 doc.data().pushToken ===
  //                   "ExponentPushToken[jfKe5PF3batyNXVwRNgNvD]"
  //               ) {
  //                 // doc.data() is never undefined for query doc snapshots
  //                 // console.log(doc.data().liveAlert2);
  //                 // var thisToken = doc.data().pushToken;
  //                 chuncToSend.push({
  //                   to: doc.data().pushToken,
  //                   sound: "default",
  //                   body: "Tästä avaamalla menee featureen",
  //                   data: { goScreen: "feature" },
  //                 });
  //               }
  //             });
  //             sendPushMessage(chuncToSend);
  //           });
  //       } catch (err) {
  //         console.log("jokin meni pieleen" + err);
  //         // return; //tämä kai turha
  //       }
  //       // console.log(user);
  //       // db.collection("testdb")
  //       //   .add({
  //       //     first: "Hadnna",
  //       //     last: "Koivisto",
  //       //     born: 1999,
  //       //   })
  //       //   .then(function (docRef) {
  //       //     console.log("Document written with ID: ", docRef.id);
  //       //   })
  //       //   .catch(function (error) {
  //       //     console.error("Error adding document: ", error);
  //       //   });
  //     } else console.log("Ei olla nyt kirjautunut");
  //     // console.log(user.email);
  //     // Do other things
  //   });
  // } catch (error) {
  //   console.log(error);
  // }

  const genres = await Genre.find().sort("name");
  res.send(genres);
});

const sendPushMessage = async (chuncToSend) => {
  // console.log(thisToken);
  // const sendPushNotification = async (targetExpoPushToken, message) => {
  const expo = new Expo();
  const chunks = expo.chunkPushNotifications(chuncToSend);

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
    chunks.forEach(async (chunk) => {
      console.log("Sending Chunk", chunk);
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

// };

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let genre = new Genre({ name: req.body.name });
  genre = await genre.save();

  res.send(genre);
});

router.put("/:id", [auth, validateObjectId], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const genre = await Genre.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name },
    {
      new: true,
    }
  );

  if (!genre)
    return res.status(404).send("The genre with the given ID was not found.");

  res.send(genre);
});

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const genre = await Genre.findByIdAndRemove(req.params.id);

  if (!genre)
    return res.status(404).send("The genre with the given ID was not found.");

  res.send(genre);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const genre = await Genre.findById(req.params.id);

  if (!genre)
    return res.status(404).send("The genre with the given ID was not found.");

  res.send(genre);
});

module.exports = router;
