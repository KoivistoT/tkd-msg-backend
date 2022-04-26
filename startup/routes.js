const express = require("express");
const error = require("../middleware/error");
const rooms = require("../routes/rooms");
const messages = require("../routes/messages");
const users = require("../routes/users");
const tasks = require("../routes/tasks");
const auth = require("../routes/auth");
const initial = require("../routes/initial");

module.exports = function (app) {
  app.use(express.json());
  app.use("/api/tasks", tasks);
  app.use("/api/messages", messages);
  app.use("/api/initial", initial);
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use("/api/rooms", rooms);
  app.use(error);
};
