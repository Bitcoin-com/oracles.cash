// imports
import axios, { AxiosResponse } from "axios"
import { BITBOX } from "bitbox-sdk"
import { HDNode } from "bitcoincashjs-lib"
import * as express from "express"
import * as util from "util"
import { PriceOracle } from "./PriceOracle"
import routeUtils = require("./route-utils")
import wlogger = require("../../util/winston-logging")

// consts
const router: express.Router = express.Router()
const bitbox: BITBOX = new BITBOX()
const SLPSDK: any = require("slp-sdk")
const SLP: any = new SLPSDK()
const network: string = "testnet"

const rootSeed: Buffer = bitbox.Mnemonic.toSeed("")
const hdNode: HDNode = bitbox.HDNode.fromSeed(rootSeed, network)
const oracle: PriceOracle = new PriceOracle(
  bitbox.HDNode.toKeyPair(bitbox.HDNode.derive(hdNode, 1))
)

// Used for processing error messages before sending them to the user.
util.inspect.defaultOptions = { depth: 1 }

// Connect the route endpoints to their handler functions.
router.get("/", root)
router.get("/details", details)

// Root API endpoint. Simply acknowledges that it exists.
function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "price" })
}

async function details(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    let getBlockCount = await bitbox.Blockchain.getBlockCount()
    const response: AxiosResponse = await axios.get(
      `https://index-api.bitcoin.com/api/v0/cash/price/usd`
    )
    const oracleMessage: Buffer = oracle.createMessage(
      getBlockCount,
      response.data.price
    )
    const oracleSignature: Buffer = oracle.signMessage(oracleMessage)
    res.status(200)
    return res.json({
      price: response.data.price,
      height: getBlockCount,
      message: oracleMessage.toString("hex"),
      signature: oracleSignature.toString("hex")
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
