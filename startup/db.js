const mongoose = require("mongoose");
const config = require("config");

module.exports = function () {
  const db = config.get("db");
  mongoose
    .connect(db)
    // .then(mongoose.set("useCreateIndex", true)) // tämä ei ollut kursissa
    // .then(() => winston.info(`Connected to ${db}...`))
    .then(() => console.log(`Connected to ${db}...`))
    .catch((error) => console.log(error, "code 2881772"));
};
