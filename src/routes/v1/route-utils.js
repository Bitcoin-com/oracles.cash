/*
  A private library of utility functions used by several different routes.
*/

const axios = require("axios")
const logger = require("./logging.js")
const wlogger = require("../../util/winston-logging")

const util = require("util")
util.inspect.defaultOptions = { depth: 1 }

const BITBOX = require("bitbox-sdk").BITBOX
const bitbox = new BITBOX()

const SLPSDK = require("slp-sdk")
const SLP = new SLPSDK()
let Utils = SLP.slpjs.Utils

module.exports = {
  validateNetwork, // Prevents a common user error
  setEnvVars, // Allows RPC variables to be set dynamically based on changing env vars.
  decodeError, // Extract and interpret error messages.
  validateArraySize // Ensure the passed array meets rate limiting requirements.
}

// This function expects the Request Express.js object and an array as input.
// The array is then validated against freemium and pro-tier rate limiting
// requirements. A boolean is returned to indicate if the array size if valid
// or not.
function validateArraySize(req, array) {
  const FREEMIUM_INPUT_SIZE = 20
  const PRO_INPUT_SIZE = 100

  if (req.locals && req.locals.proLimit) {
    if (array.length <= PRO_INPUT_SIZE) return true
  } else if (array.length <= FREEMIUM_INPUT_SIZE) {
    return true
  }

  return false
}

// Returns true if user-provided cash address matches the correct network,
// mainnet or testnet. If NETWORK env var is not defined, it returns false.
// This prevent a common user-error issue that is easy to make: passing a
// testnet address into rest.bitcoin.com or passing a mainnet address into
// trest.bitcoin.com.
function validateNetwork(addr) {
  try {
    const network = process.env.NETWORK

    // Return false if NETWORK is not defined.
    if (!network || network === "") {
      console.log(`Warning: NETWORK environment variable is not defined!`)
      return false
    }

    // Convert the user-provided address to a cashaddress, for easy detection
    // of the intended network.
    const cashAddr = Utils.toCashAddress(addr)

    // Return true if the network and address both match testnet
    const addrIsTest = bitbox.Address.isTestnetAddress(cashAddr)
    if (network === "testnet" && addrIsTest) return true

    // Return true if the network and address both match mainnet
    const addrIsMain = bitbox.Address.isMainnetAddress(cashAddr)
    if (network === "mainnet" && addrIsMain) return true

    return false
  } catch (err) {
    logger.error(`Error in validateNetwork()`)
    return false
  }
}

// Dynamically set these based on env vars. Allows unit testing.
function setEnvVars() {
  const BitboxHTTP = axios.create({
    baseURL: process.env.RPC_BASEURL
  })
  const username = process.env.RPC_USERNAME
  const password = process.env.RPC_PASSWORD

  const requestConfig = {
    method: "post",
    auth: {
      username: username,
      password: password
    },
    data: {
      jsonrpc: "1.0"
    }
  }

  return { BitboxHTTP, username, password, requestConfig }
}

// Error messages returned by a full node can be burried pretty deep inside the
// error object returned by Axios. This function attempts to extract and interpret
// error messages.
// Returns an object. If successful, obj.msg is a string.
// If there is a failure, obj.msg is false.
function decodeError(err) {
  try {
    // Attempt to extract the full node error message.
    if (
      err.response &&
      err.response.data &&
      err.response.data.error &&
      err.response.data.error.message
    )
      return { msg: err.response.data.error.message, status: 400 }

    // Attempt to extract the Insight error message
    if (err.response && err.response.data)
      return { msg: err.response.data, status: err.response.status }

    // Attempt to detect a network connection error.
    if (err.message && err.message.indexOf("ENOTFOUND") > -1) {
      return {
        msg:
          "Network error: Could not communicate with full node or other external service.",
        status: 503
      }
    }

    // Different kind of network error
    if (err.message && err.message.indexOf("ENETUNREACH") > -1) {
      return {
        msg:
          "Network error: Could not communicate with full node or other external service.",
        status: 503
      }
    }

    return { msg: false, status: 500 }
  } catch (err) {
    wlogger.error(`unhandled error in route-utils.js/decodeError(): `, err)
    return { msg: false, status: 500 }
  }
}
