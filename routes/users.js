const mongoose = require("mongoose");
const express = require("express");
const { User, validate, schema } = require("../models/user");
const bcrypt = require("bcrypt");
const router = express.Router();
const _ = require("lodash");

router.post("/create_user", async (req, res) => {
  //tässä username ja userName!!!!!!!!!!!

  let user = new User({
    username: req.body.userName,
    password: req.body.password,
    accountType: req.body.accountType,
    email: req.body.userName,
  });
  user = await user.save();

  res.send(user);
});

router.post("/", async (req, res) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // let user = await User.findOne({ email: req.body.email });
  // if (user) return res.status(400).send("User already registered.");

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

router.get("/all", async (req, res) => {
  const user = await User.find({});
  if (!user) return res.status(404).send("Users not found");

  res.send(user);
});

module.exports = router;
