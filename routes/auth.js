const bcrypt = require("bcrypt");
const express = require("express");
const Joi = require("joi");
const router = express.Router();
const { User } = require("../models/user");
const _ = require("lodash");

router.post("/", async (req, res) => {
  const { error } = schema.validate(req.body);
  const { email } = req.body;

  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  const userQuery = { email: email.toString() };
  let user = await User.findOne(userQuery);

  if (!user) {
    return res.status(400).send("Invalid email or password.");
  }

  if (user.status !== "active") {
    return res.status(400).send("Your account is not active.");
  }

  const validPassword = await bcrypt.compare(req.body.password, user.password);

  if (!validPassword) {
    return res.status(400).send("Invalid email or password.");
  }

  const token = user.generateAuthToken();

  res.status(200).send(token);
});

const schema = Joi.object({
  email: Joi.string().min(5).max(255).required().email(),
  password: Joi.string().min(5).max(255).required(),
});

module.exports = router;
