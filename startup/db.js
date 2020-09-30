const winston = require("winston");
const mongoose = require("mongoose");
const config = require("config");

module.exports = function () {
  const db = config.get("db");
  mongoose
    .connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(mongoose.set("useCreateIndex", true)) // tämä ei ollut kursissa
    .then(() => winston.info(`Connected to ${db}...`))
    .then(() => console.log(`Connected to ${db}...`));
};
