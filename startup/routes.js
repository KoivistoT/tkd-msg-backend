const express = require("express");
const auth = require("../routes/auth");
const error = require("../middleware/error");
const initial = require("../routes/initial");
const messages = require("../routes/messages");
const rooms = require("../routes/rooms");
const tasks = require("../routes/tasks");
const users = require("../routes/users");

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
