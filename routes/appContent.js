const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const _ = require("lodash");
// const { User, validate } = require("../models/user");
const mongoose = require("mongoose");
const { Video, validate } = require("../models/video");
const express = require("express");
const router = express.Router();
const firebase = require("firebase");
require("firebase/firestore");
const { Expo } = require("expo-server-sdk");

firebase.initializeApp({
  apiKey: "AIzaSyBtRUWm_VJznsRIWH_hGgC4M-SFCuQe1SM",
  authDomain: "test2-6663b.firebaseapp.com",
  projectId: "test2-6663b",
});

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
      .signInWithEmailAndPassword("testuser@riverc.com", "testUser");

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

// router.get("/appContent", auth, async (req, res) => {
router.get("/videos", async (req, res) => {
  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();
  try {
    if (isLoggedIn) {
      try {
        var allData = [];
        db.collection("appContent")
          .get()
          .then(function (querySnapshot) {
            console.log("täällä");
            querySnapshot.forEach(function (doc) {
              allData.push({ id: doc.id, ...doc.data() });
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

  //   console.log("ttässä mnee");
  //   res.send(user);
});

router.post("/videos", async (req, res) => {
  const { error } = validate(req.body);

  if (error) return res.status(400).send(error.details[0].message);

  // const genre = await Genre.findById(req.body.genreId);
  // if (!genre) return res.status(400).send("Invalid genre.");

  const video = {
    title: req.body.title,
    date: req.body.date,
  };

  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();

  try {
    if (isLoggedIn) {
      try {
        db.collection("appContent").doc().set(video);
        res.send(true);
      } catch (error) {
        console.log(error);
        res.status(404).send(error);
      }
    }
  } catch (error) {
    res.status(404).send(error);
  }
  // await video.save();

  // res.send(video);
});

router.put("/videos/:id", async (req, res) => {
  console.log(req.body, "putissa");
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

router.get("/videos/:id", async (req, res) => {
  const isLoggedIn = await firebaseLogin();

  var db = firebase.firestore();

  try {
    if (isLoggedIn) {
      try {
        db.collection("appContent")
          .doc(req.params.id)
          .get()
          .then(function (querySnapshot) {
            const videoData = { id: querySnapshot.id, ...querySnapshot.data() };
            res.send(videoData);
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
