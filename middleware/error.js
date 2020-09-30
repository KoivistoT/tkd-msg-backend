const winston = require("winston");

module.exports = function (err, req, res, next) {
  winston.error(err.message, err);
  //ei tule metadataa tuosta err, kun menee mongodb. vika voi olla index.js:ssä

  //err
  //warn
  //info
  //verbose
  //debug
  //silly

  res.status(500).send("Something failed.");
};
