const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const _ = require("lodash");

const mongoose = require("mongoose");
const { News, validate } = require("../models/news");
const express = require("express");
const router = express.Router();
const firebase = require("firebase");
require("firebase/firestore");
const { Expo } = require("expo-server-sdk");

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

const firebaseLogin = async () => {
  // Listen for authentication state to change.
  let isUser;
  try {
    await firebase
      .auth()
      //   .signInWithEmailAndPassword("testuser@riverc.com", "testUser"); //tämä testiympäristö
      // .signInWithEmailAndPassword("koivisto_timo@hotmail.com", "jaaha1234");
      .signInWithEmailAndPassword(
        "tk_development@tkdevelopment.com",
        "jaaha1234"
      );

    await firebase.auth().onAuthStateChanged((user) => {
      if (user != null) {
        console.log("We are authenticated now!");
        isUser = true;
      } else {
        console.log("Ei olla nyt kirjautunut");
        isUser = false;
      }
    });
  } catch (error) {
    console.log(error);
  }
  return isUser;
};

const converter = (value) => {
  var reutrnValue;

  if (typeof value === "boolean") {
    if (value === true) {
      reutrnValue = "true";
      return reutrnValue;
    } else {
      reutrnValue = "false";
      return reutrnValue;
    }
  } else {
    return value;
  }
};

router.get("/", async (req, res) => {
  const isLoggedIn = await firebaseLogin();
  try {
    if (isLoggedIn) {
      try {
        firebase
          .database()
          .ref("/")
          .on("value", (snap1) => {
            const result = [];
            res.send(snap1.val());
            console.log(snap1.val());
            // snap1.forEach((snap2) => {
            //   result.push(snap2.val());
            //   console.log(result);

            // });
          });
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    res.status(404).send(error);
  }
});

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  // console.log(error, "eriririr");
  if (error) return res.status(400).send(error.details[0].message);

  // const news = req.body;
  // console.log(req.body, "tässsä  news body");
  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();

  const reqData = req.body;
  const dataToSave = {
    type: reqData.type,
    titleEN: reqData.titleEN,
    titleFIN: reqData.titleFIN,
    imageSmall: reqData.imageSmall,
    imageNormal: reqData.imageNormal,
    date: reqData.date,
    publish: converter(reqData.publish),
    expired: reqData.expired,
    textEN: reqData.textEN,
    textFIN: reqData.textFIN,
    order: reqData.order,
    //extrat vanhan koodin takia sovelluksessa
    title: reqData.titleEN,
    text: reqData.textEN,
  };

  try {
    if (isLoggedIn) {
      try {
        await db.collection("appContent").doc().set(dataToSave);
        res.send(true);
      } catch (error) {
        console.log(error);
        res.status(404).send(error);
      }
    }
  } catch (error) {
    res.status(404).send(error);
  }
});

router.put("/:id", auth, async (req, res) => {
  // console.log(req.body, "putissa");
  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();

  const reqData = req.body;
  const dataToSave = {
    type: reqData.type,
    titleEN: reqData.titleEN,
    titleFIN: reqData.titleFIN,
    imageSmall: reqData.imageSmall,
    imageNormal: reqData.imageNormal,
    date: reqData.date,
    publish: converter(reqData.publish),
    expired: reqData.expired,
    textEN: reqData.textEN,
    textFIN: reqData.textFIN,
    order: reqData.order,
    //extrat vanhan koodin takia sovelluksessa
    title: reqData.titleEN,
    text: reqData.textEN,
  };

  try {
    if (isLoggedIn) {
      try {
        db.collection("appContent").doc(req.params.id).update(dataToSave);
        res.send(true);
      } catch (error) {
        console.log(error);
        res.status(404).send(error);
      }
    }
  } catch (error) {
    res.status(404).send(error);
  }
});

router.get("/:id", auth, async (req, res) => {
  const isLoggedIn = await firebaseLogin();

  var db = firebase.firestore();

  try {
    if (isLoggedIn) {
      try {
        db.collection("appContent")
          .doc(req.params.id)
          .get()
          .then(function (querySnapshot) {
            const newsData = { id: querySnapshot.id, ...querySnapshot.data() };
            res.send(newsData);
          });
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    res.status(404).send(error);
  }
});

module.exports = router;