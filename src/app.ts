"use strict"

import * as express from "express"
// Middleware
import { routeRateLimit } from "./middleware/route-ratelimit"

const path = require("path")
const cookieParser = require("cookie-parser")
const bodyParser = require("body-parser")
// const basicAuth = require("express-basic-auth")
const helmet = require("helmet")
const debug = require("debug")("rest-cloud:server")
const http = require("http")
const cors = require("cors")
const AuthMW = require("./middleware/auth")

let apiSpec
if (process.env.NETWORK === "mainnet") {
  apiSpec = require("./public/oracles-cash-mainnet-rest-v1.json")
} else {
  apiSpec = require("./public/oracles-cash-testnet-rest-v1.json")
}

// v2
const indexV1 = require("./routes/v1/index")
const priceV1 = require("./routes/v1/price")

interface IError {
  message: string
  status: number
}

require("dotenv").config()

const app: express.Application = express()

app.locals.env = process.env

app.use(helmet())

app.use(cors())
app.enable("trust proxy")

// view engine setup
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "jade")

app.use("/public", express.static(`${__dirname}/public`))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))

// Local logging middleware for tracking incoming connection information.

//
// let username = process.env.USERNAME;
// let password = process.env.PASSWORD;
//
// app.use(basicAuth(
//   {
//     users: { username: password }
//   }
// ));

interface ICustomRequest extends express.Request {
  io: any
}

// Make io accessible to our router
app.use(
  (req: ICustomRequest, res: express.Response, next: express.NextFunction) => {
    req.io = io

    next()
  }
)

const v1prefix = "v1"

// Instantiate the authorization middleware, used to implement pro-tier rate limiting.
const auth = new AuthMW()
app.use(`/${v1prefix}/`, auth.mw())

// Rate limit on all v2 routes
app.use(`/${v1prefix}/`, routeRateLimit)
app.use("/", indexV1)
app.use(`/${v1prefix}/` + `price`, priceV1.router)

// catch 404 and forward to error handler
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const err: IError = {
      message: "Not Found",
      status: 404
    }

    next(err)
  }
)

// error handler
app.use(
  (
    err: IError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const status = err.status || 500

    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get("env") === "development" ? err : {}

    // render the error page
    res.status(status)
    res.json({
      status: status,
      message: err.message
    })
  }
)

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || "3000")
app.set("port", port)
console.log(`rest.bitcoin.com started on port ${port}`)

/**
 * Create HTTP server.
 */
const server = http.createServer(app)
const io = require("socket.io").listen(server)

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on("error", onError)
server.on("listening", onListening)

// Set the time before a timeout error is generated. This impacts testing and
// the handling of timeout errors. Is 10 seconds too agressive?
server.setTimeout(30 * 1000)

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error: any) {
  if (error.syscall !== "listen") throw error

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`)
      process.exit(1)
      break
    case "EADDRINUSE":
      console.error(`${bind} is already in use`)
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address()
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`
  debug(`Listening on ${bind}`)
}
//
// module.exports = app;
