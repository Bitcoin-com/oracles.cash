// imports
import { BITBOX } from "bitbox-sdk"
import * as express from "express"
import * as util from "util"
import logger = require("./logging.js")
import routeUtils = require("./route-utils")
import wlogger = require("../../util/winston-logging")

// consts
const router: express.Router = express.Router()
const bitbox: BITBOX = new BITBOX()
const SLPSDK: any = require("slp-sdk")
const SLP: any = new SLPSDK()
let Utils = SLP.slpjs.Utils

// Used for processing error messages before sending them to the user.
util.inspect.defaultOptions = { depth: 1 }

// Use the default (and max) page size of 1000
// https://github.com/bitpay/insight-api#notes-on-upgrading-from-v03
const PAGE_SIZE: number = 1000

// Connect the route endpoints to their handler functions.
router.get("/", root)
router.get("/details", details)

// Root API endpoint. Simply acknowledges that it exists.
function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "address" })
}

async function details(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    // Return the retrieved address information.
    res.status(200)
    return res.json({
      data: "all good"
    })
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg })
    }

    // Write out error to error log.
    //logger.error(`Error in price.ts/details: `, err)
    wlogger.error(`Error in price.ts/details().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

module.exports = {
  router,
  testableComponents: {
    root,
    details
  }
}
