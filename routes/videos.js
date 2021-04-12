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
  // *************************
  // *************************
  // *************************
  //oikea ympäristö
  apiKey: "AIzaSyCIIA2_x2vIpq_H7h0lukW5MZejf_3YP9U",
  authDomain: "rivers-app-9ab9d.firebaseapp.com",
  projectId: "rivers-app-9ab9d",
  // *************************
  // *************************
  // VAIHDA MYÖS AUTH SÄHKÖPOSTI
  // *************************
  // *************************
  // testiympäristö
  // apiKey: "AIzaSyBtRUWm_VJznsRIWH_hGgC4M-SFCuQe1SM",
  // authDomain: "test2-6663b.firebaseapp.com",
  // projectId: "test2-6663b",
  // *************************
  // *************************
  // *************************
  //tämä raamattuhaku
  // apiKey: "AIzaSyCn-YZvbuefdELoBgmD9BfybSbZJx7AH_c",
  // authDomain: "test-cfdd9.firebaseapp.com",
  // databaseURL: "https://test-cfdd9-default-rtdb.firebaseio.com",
  // projectId: "test-cfdd9",
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

const firebaseLogin = async () => {
  let isUser;
  try {
    await firebase
      .auth()
      // .signInWithEmailAndPassword("testuser@riverc.com", "testUser"); //tämä testiympäristö
      .signInWithEmailAndPassword("koivisto_timo@hotmail.com", "jaaha1234");

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
    console.log(error, "tästä");
  }
  return isUser;
};

const changeFeatured = async (videoId) => {
  console.log(videoId, "tässä video id");
  var db = firebase.firestore();
  try {
    try {
      const ref = db.collection("appContent");
      const snapshot = await ref.where("isFeature", "==", "true").get();
      if (snapshot.empty) {
        console.log("No matching documents.");
        return;
      }
      snapshot.forEach((doc) => {
        if (doc.id !== videoId && videoId !== "new") {
          ref.doc(doc.id).update({ isFeature: "false" });
        }
        if (videoId === "new") {
          // jos on uusi niin poistaa ensin kaikki truet ja sitten lisää uuden videon vasta, jossa true
          ref.doc(doc.id).update({ isFeature: "false" });
        }
      });
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    res.status(404).send(error);
  }
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
              if (doc.data().type === "video" && doc.data().isDeleted !== true)
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

router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  // console.log(error, "eriririr");
  if (error) return res.status(400).send(error.details[0].message);

  // const genre = await Genre.findById(req.body.genreId);
  // if (!genre) return res.status(400).send("Invalid genre.");

  //!!!!!!!
  //huomaa, että feature muuttujatyökalu changeFeatured pitää kanssa vaihtaa booleaniksi myöhemmin. sekä kutsussa, että itse functiossa
  //!!!!!!!
  const reqData = req.body;
  const dataToSave = {
    type: reqData.type,
    titleEN: reqData.titleEN,
    titleFIN: reqData.titleFIN,
    shareEN: reqData.shareEN,
    shareFIN: reqData.shareFIN,
    url: reqData.url,
    thumbnailSmall: reqData.thumbnailSmall,
    thumbnailNormal: reqData.thumbnailNormal,
    date: reqData.date,
    isWordFor: converter(reqData.isWordFor),
    isFeature: converter(reqData.isFeature),
    hideDate: converter(reqData.hideDate),
    publish: converter(reqData.publish),
    expired: reqData.expired,
    notesEN: reqData.notesEN,
    notesFIN: reqData.notesFIN,
    order: reqData.order,
    //extrat vanhan koodin takia sovelluksessa
    title: reqData.titleEN,
    share: reqData.shareEN,
    notes: reqData.notesEN,
  };

  // console.log(req.body, "tässsä body");
  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();

  try {
    if (isLoggedIn) {
      try {
        // console.log("tämänäin", req.body.isFeature, req.body.publish);
        if (req.body.isFeature === true && req.body.publish === true) {
          // tämä ei convertoitu, tulee suodaan frontissta
          const videoId = "new"; //tässä tekee ensin muutoksen ja lisää sitten videon, koska videolla ei ole vielä id:tä
          await changeFeatured(videoId);
        }
        await db.collection("appContent").doc().set(dataToSave);
        // await db.collection("test").doc().set(video);

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

router.put("/:id", auth, async (req, res) => {
  // console.log(req.body, "putissa");
  const isLoggedIn = await firebaseLogin();
  var db = firebase.firestore();

  const reqData = req.body;
  var dataToSave;
  if (reqData.isDeleted === true) {
    dataToSave = {
      type: reqData.type,
      titleEN: reqData.titleEN,
      titleFIN: reqData.titleFIN,
      shareEN: reqData.shareEN,
      shareFIN: reqData.shareFIN,
      url: reqData.url,
      thumbnailSmall: reqData.thumbnailSmall,
      thumbnailNormal: reqData.thumbnailNormal,
      date: reqData.date,
      isWordFor: false,
      isFeature: false,
      hideDate: converter(reqData.hideDate),
      publish: false,
      expired: reqData.expired,
      notesEN: reqData.notesEN,
      notesFIN: reqData.notesFIN,
      order: reqData.order,
      //extrat vanhan koodin takia sovelluksessa
      title: reqData.titleEN,
      share: reqData.shareEN,
      notes: reqData.notesEN,
      isDeleted: true,
    };
  } else {
    dataToSave = {
      type: reqData.type,
      titleEN: reqData.titleEN,
      titleFIN: reqData.titleFIN,
      shareEN: reqData.shareEN,
      shareFIN: reqData.shareFIN,
      url: reqData.url,
      thumbnailSmall: reqData.thumbnailSmall,
      thumbnailNormal: reqData.thumbnailNormal,
      date: reqData.date,
      isWordFor: converter(reqData.isWordFor),
      isFeature: converter(reqData.isFeature),
      hideDate: converter(reqData.hideDate),
      publish: converter(reqData.publish),
      expired: reqData.expired,
      notesEN: reqData.notesEN,
      notesFIN: reqData.notesFIN,
      order: reqData.order,
      //extrat vanhan koodin takia sovelluksessa
      title: reqData.titleEN,
      share: reqData.shareEN,
      notes: reqData.notesEN,
    };
  }

  try {
    if (isLoggedIn) {
      try {
        db.collection("appContent").doc(req.params.id).update(dataToSave);
        // console.log(req.body.isFeature);
        if (req.body.isFeature === true && req.body.publish === true) {
          // ei convertoitu vaan tulee suoraan frontista
          await changeFeatured(req.params.id);
        }
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
