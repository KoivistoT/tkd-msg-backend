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
      .signInWithEmailAndPassword(
        "dev.riverchurch@gmail.com",
        process.env.vidly_jwtPrivateKey
      );
    // .signInWithEmailAndPassword("testuser@riverc.com", "testUser");
    // .signInWithEmailAndPassword("koivisto_timo@hotmail.com", "jaaha1234");

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

router.get("/", auth, async (req, res) => {
  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();
  try {
    if (isLoggedIn) {
      try {
        var allData = [];
        db.collection("appContent")
          .get()
          .then(function (querySnapshot) {
            querySnapshot.forEach(function (doc) {
              if (doc.data().type === "news") {
                allData.push({ id: doc.id, ...doc.data() });
              }
              // console.log(doc.data());
            });
            res.send(allData);
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

  const news = req.body;
  console.log(req.body, "tässsä  news body");
  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();

  try {
    if (isLoggedIn) {
      try {
        await db.collection("appContent").doc().set(news);
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

  try {
    if (isLoggedIn) {
      try {
        db.collection("appContent").doc(req.params.id).update(req.body);
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
