const validateObjectId = require("../middleware/validateObjectId");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { Genre, validate } = require("../models/genre");
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const firebase = require("firebase");
// Required for side-effects
require("firebase/firestore");

router.get("/", async (req, res) => {
  // throw new Error("Could not get the genres.");
  // firebase.initializeApp({
  //   apiKey: "AIzaSyBtRUWm_VJznsRIWH_hGgC4M-SFCuQe1SM",
  //   authDomain: "test2-6663b.firebaseapp.com",
  //   projectId: "test2-6663b",
  // });

  // var db = firebase.firestore();

  // try {
  //   firebase
  //     .auth()
  //     //   .signInWithEmailAndPassword(this.state.email, this.state.password)
  //     .signInWithEmailAndPassword("koivisto_timo@hotmail.com", "jaaha1234");
  //   // .signInWithEmailAndPassword("testi@joojaa.fi", "123456");
  //   //pitää aina varmistaa, että auth voimassa ennen muita kutsuja
  //   firebase.auth().onAuthStateChanged((user) => {
  //     if (user != null) {
  //       console.log("We are authenticated now!");
  //       // console.log(user);
  //       db.collection("testdb")
  //         .add({
  //           first: "Hadnna",
  //           last: "Koivisto",
  //           born: 1999,
  //         })
  //         .then(function (docRef) {
  //           console.log("Document written with ID: ", docRef.id);
  //         })
  //         .catch(function (error) {
  //           console.error("Error adding document: ", error);
  //         });
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
