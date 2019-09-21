/*
  Instantiates and configures the Winston logging library. This utitlity library
  can be called by other parts of the application to conveniently tap into the
  logging library.
*/
"use strict";
var winston = require("winston");
require("winston-daily-rotate-file");
var NETWORK = process.env.NETWORK;
// Configure daily-rotation transport.
// Configured to only save 20 megs worth of files. Specifically 20 files of
// 1 megabyte each. Old log files will be deleted to make room for new log files.
var transport = new winston.transports.DailyRotateFile({
    filename: __dirname + "/../../logs/rest-" + NETWORK + "-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: false,
    maxSize: "1m",
    maxFiles: "100",
    format: winston.format.combine(winston.format.timestamp(), winston.format.json())
});
transport.on("rotate", function (oldFilename, newFilename) {
    wlogger.info("Rotating log files");
});
// This controls what goes into the log FILES
var wlogger = winston.createLogger({
    level: "verbose",
    format: winston.format.json(),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // new winston.transports.File({ filename: 'logs/combined.log' })
        transport
    ]
});
// This controls the logs to CONSOLE
/*
wlogger.add(
  new winston.transports.Console({
    format: winston.format.simple(),
    level: "info"
  })
)
*/
module.exports = wlogger;
