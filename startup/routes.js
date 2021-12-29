const express = require("express");
const test = require("../routes/test");
const error = require("../middleware/error");
// const genres = require("../routes/genres");
const rooms = require("../routes/rooms");
const messages = require("../routes/messages");
const users = require("../routes/users");
const auth = require("../routes/auth");
module.exports = function (app) {
  app.use(express.json());
  app.use("/api/test", test);
  // app.use("/api/genres", genres);
  app.use("/api/messages", messages);
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/rooms", rooms);
  app.use(error);
};
