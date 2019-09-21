/*
  This middleware logs connection information to local logs. It gives the ability
  to detect when the server is being DDOS attacked, and also to collect metrics,
  like the most popular endpoints.
*/

import * as express from "express"
const wlogger = require("../util/winston-logging")

// Used for debugging and iterrogating JS objects.
const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

// Add the 'locals' property to the express.Request interface.
declare global {
  namespace Express {
    interface Request {
      locals: any,
      sws: any
    }
  }
}

const logReqInfo = function(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {

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
  const ip = req.sws.real_ip
  const method = req.method
  const url = req.url

  const dataToLog = {
    headers: req.headers,
    url: url,
    method: method,
    ip: req.sws.ip,
    real_ip: ip,
    body: req.body
  }

  wlogger.verbose(`Request: ${ip} ${method} ${url}`, dataToLog)

  next()
}

export { logReqInfo }
