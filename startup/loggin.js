const winston = require("winston");
// require("winston-mongodb");
require("express-async-errors");

//tämä ei vain toimi kunnolla
module.exports = function () {
  // process.on("uncaughtException", (ex) => {
  //   winston.error(ex.message, ex);
  //   process.exit(1);
  // });

  // winston.handleExeptions(
  //   new winston.transports.Console({ colorize: true, prettyPrint: true }),
  //   new winston.transports.File({ filename: "uncaughtexeptions.log" })
  // );
  winston.exceptions.handle(
    new winston.transports.File({ filename: "uncaughtexeptions.log" })
  );

  // process.on("unhandledRejection", (ex) => {
  //   winston.error(ex.message, ex);
  //   process.exit(1);
  // });
  process.on("unhandledRejection", (ex) => {
    throw ex; //tämä menee winstoniin.
  });

  winston.add(new winston.transports.File({ filename: "logfile.log" }));
  // winston.add(
  //   new winston.transports.MongoDB({
  //     db: "mongodb://localhost/vidly",
  //     level: "info",
  //   })
  // );
};
