"use strict";
/*
  This middleware logs connection information to local logs. It gives the ability
  to detect when the server is being DDOS attacked, and also to collect metrics,
  like the most popular endpoints.
*/
Object.defineProperty(exports, "__esModule", { value: true });
var wlogger = require("../util/winston-logging");
// Used for debugging and iterrogating JS objects.
var util = require("util");
util.inspect.defaultOptions = { depth: 1 };
var logReqInfo = function (req, res, next) {
    /*
      //console.log(`req: ${util.inspect(req)}`)
      console.log(`req.headers: ${util.inspect(req.headers)}`)
      console.log(`req.url: ${req.url}`)
      console.log(`req.method: ${req.method}`)
      console.log(`req.sws.ip: ${req.sws.ip}`)
      console.log(`req.sws.real_ip: ${req.sws.real_ip}`)
      console.log(`req.body: ${util.inspect(req.body)}`)
      console.log(` `)
      console.log(` `)
    */
    var ip = req.sws.real_ip;
    var method = req.method;
    var url = req.url;
    var dataToLog = {
        headers: req.headers,
        url: url,
        method: method,
        ip: req.sws.ip,
        real_ip: ip,
        body: req.body
    };
    wlogger.verbose("Request: " + ip + " " + method + " " + url, dataToLog);
    next();
};
exports.logReqInfo = logReqInfo;
