// imports
import * as cashAccountClass from "cashaccounts"
import * as express from "express"
import * as util from "util"
import {
  CashAccountBatchResults,
  CashAccountInterface,
  CashAccountReverseLookupResults
} from "./interfaces/RESTInterfaces"
import routeUtils = require("./route-utils")
import wlogger = require("../../util/winston-logging")

// consts
const router: express.Router = express.Router()
const cashAccounts: cashAccountClass = new cashAccountClass(
  process.env.CASHACCOUNT_LOOKUPSERVER
)

// Used for processing error messages before sending them to the user.
util.inspect.defaultOptions = { depth: 1 }

// Connect the route endpoints to their handler functions.
router.get("/", root)
router.get("/lookup/:account/:number/:collision?", lookup)
router.get("/check/:account/:number", check)
router.get("/reverselookup/:address", reverseLookup)
// router.post("/registration", registration)

// Root API endpoint. Simply acknowledges that it exists.
function root(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): express.Response {
  return res.json({ status: "cashaccount" })
}

/**
 * Form Handle
 *
 * @param {string} account
 * @param {string} number
 * @param {string} collision
 * @returns Jonathan#100.123 // if collision supplied
 */
function formHandle(account: string, number: string, collision?: string) {
  const handle = `${account}#${number}${
    collision !== undefined ? `.${collision}` : ""
  }`
  return handle
}

/**
 *  Check if valid cashaccount
 *
 * @param {string} handle
 * @returns {boolean}
 */
function isCashAccount(handle: string) {
  return cashAccounts.isCashAccount(handle)
}

// This function is a simple wrapper to make unit tests possible.
// Wrapping this in a function allows it to be stubbed so that the
// route can be tested as a unit test.
async function trustedLookup(cashAccountsInstance, handle) {
  try {
    const result: Promise<any> = await cashAccountsInstance.trustedLookup(
      handle
    )

    return result
  } catch (err) {
    return undefined
  }
}

/**
 *  CashAccount Lookup
 *
 * @param {string} account - Jonathan
 * @param {string} number - 100
 * @param {string} collision - optional
 * @returns {object} - CashAccountInterface
 */
async function lookup(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const {
      account,
      number,
      collision
    }: { account: string; number: string; collision: string } = req.params

    if (!account || account === "") {
      res.status(400)
      return res.json({ error: "account name can not be empty" })
    }
    if (!number || number === "") {
      res.status(400)
      return res.json({ error: "number can not be empty" })
    }

    const handle: string = formHandle(account, number, collision)
    const valid: boolean = isCashAccount(handle)

    if (!valid) {
      res.status(500)
      return res.json({
        error: "No account could be found with the requested parameters."
      })
    }

    const lookup: CashAccountInterface = await module.exports.testableComponents.trustedLookup(
      cashAccounts,
      handle
    )

    if (lookup === undefined) {
      res.status(500)
      return res.json({
        error: "No account could be found with the requested parameters."
      })
    }

    // Return the retrieved address information.
    res.status(200)
    return res.json(lookup)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg.error })
    }

    wlogger.error(`Error in cashaccounts.ts/lookup().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// This function is a simple wrapper to make unit tests possible.
// Wrapping this in a function allows it to be stubbed so that the
// route can be tested as a unit test.
async function getBatchResults(cashAccountsInstance, handle) {
  try {
    const result: Promise<any> = await cashAccountsInstance.getBatchResults(
      handle
    )

    return result
  } catch (err) {
    return undefined
  }
}

/**
 *  CashAccount Check
 *
 * @param {string} account - Jonathan
 * @param {string} number - 100
 * @returns {object} - CashAccountBatchResults
 */
async function check(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const { account, number }: { account: string; number: string } = req.params

    if (!account || account === "") {
      res.status(400)
      return res.json({ error: "account name can not be empty" })
    }
    if (!number || number === "") {
      res.status(400)
      return res.json({ error: "number can not be empty" })
    }

    const handle: string = formHandle(account, number)
    const valid: boolean = isCashAccount(handle)

    if (!valid) {
      res.status(500)
      return res.json({ error: "Not a valid CashAccount" })
    }

    const lookup: CashAccountBatchResults = await module.exports.testableComponents.getBatchResults(
      cashAccounts,
      handle
    )

    if (lookup === undefined) {
      res.status(500)
      return res.json({
        error: "No account could be found with the requested parameters."
      })
    }

    lookup.results.forEach((result: any) => {
      result.inclusionProof = result.inclusion_proof
      delete result.inclusion_proof
    })

    // Return the retrieved address information.
    res.status(200)
    return res.json(lookup)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg.error })
    }

    wlogger.error(`Error in cashaccounts.ts/check().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

// This function is a simple wrapper to make unit tests possible.
// Wrapping this in a function allows it to be stubbed so that the
// route can be tested as a unit test.
async function caReverseLookup(cashAccountsInstance, address) {
  try {
    const result: Promise<any> = await cashAccountsInstance.reverseLookup(
      address
    )

    return result
  } catch (err) {
    return undefined
  }
}

/**
 *  CashAccount Reverse Lookup
 *
 * @param {string} address - bitcoincash:qr4aadjrpu73d2wxwkxkcrt6gqxgu6a7usxfm96fst
 * @returns {object} - results
 */
async function reverseLookup(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<express.Response> {
  try {
    const { address }: { address: string } = req.params

    if (!address || address === "") {
      res.status(400)
      return res.json({ error: "address can not be empty" })
    }

    //const lookup: {
    //  results: CashAccountReverseLookupResults[]
    //} = await cashAccounts.reverseLookup(address)
    const lookup: {
      results: CashAccountReverseLookupResults[]
    } = await module.exports.testableComponents.caReverseLookup(
      cashAccounts,
      address
    )
    //console.log(`lookup: ${JSON.stringify(lookup, null, 2)}`)

    if (lookup === undefined) {
      res.status(500)
      return res.json({
        error: "No account could be found with the requested parameters."
      })
    }

    lookup.results.forEach((result: CashAccountReverseLookupResults) => {
      result.accountEmoji = result.account_emoji
      result.nameText = result.name_text
      result.accountNumber = result.account_number
      result.accountHash = result.account_hash
      result.accountCollisionLength = result.account_collision_length
      result.payloadType = result.payload_type
      result.payloadAddress = result.payload_address
      delete result.account_emoji
      delete result.name_text
      delete result.account_number
      delete result.account_hash
      delete result.account_collision_length
      delete result.payload_type
      delete result.payload_address
    })

    // Return the retrieved address information.
    res.status(200)
    return res.json(lookup)
  } catch (err) {
    // Attempt to decode the error message.
    const { msg, status } = routeUtils.decodeError(err)
    if (msg) {
      res.status(status)
      return res.json({ error: msg.error })
    }

    wlogger.error(`Error in cashaccounts.ts/reverseLookup().`, err)

    res.status(500)
    return res.json({ error: util.inspect(err) })
  }
}

/**
 *  CashAccount Registration
 *
 * @param {string} username - Jonathan
 * @param {string} bchAddress - bitcoincash:asdf
 * @param {string} slpAddress - simpleledger:asdf
 * @returns {object} - CashAccountRegistration
 */
// async function registration(
//   req: express.Request,
//   res: express.Response,
//   next: express.NextFunction
// ): Promise<express.Response> {
//   try {
//     const {
//       username,
//       cashAddress,
//       slpAddress
//     }: {
//       username: string
//       cashAddress: string
//       slpAddress: string
//     } = req.body

//     if (username === undefined) {
//       res.status(400)
//       return res.json({
//         error: `Missing username.`
//       })
//     }

//     if (cashAddress === undefined) {
//       res.status(400)
//       return res.json({
//         error: `Missing BCH address.`
//       })
//     }

//     // Ensure the input is a valid BCH address.
//     try {
//       isCashAccount(cashAddress)
//     } catch (err) {
//       res.status(400)
//       return res.json({
//         error: `Invalid BCH address. Double check your address is valid: ${cashAddress}`
//       })
//     }

//     // Ensure the input is a valid SLP address.
//     try {
//       cashAccounts.toSlpAddress(slpAddress)
//     } catch (err) {
//       res.status(400)
//       return res.json({
//         error: `Invalid SLP address. Double check your address is valid: ${slpAddress}`
//       })
//     }

//     const cashAccountRegex: RegExp = /^([a-zA-Z0-9_]{2,99})?$/i
//     const valid: boolean = cashAccountRegex.test(username)

//     if (!valid) {
//       return res.status(500).json({ error: "Invalid characters" })
//     }

//     let txid: CashAccountRegistration = await cashAccounts.trustedRegistration(
//       username,
//       cashAddress,
//       slpAddress
//     )

//     res.status(200)
//     return res.json(txid)
//   } catch (err) {
//     // Attempt to decode the error message.
//     const { msg, status } = routeUtils.decodeError(err)
//     if (msg) {
//       res.status(status)
//       return res.json({ error:.error msg })
//     }

//     wlogger.error(`Error in cashaccounts.ts/registration().`, err)

//     res.status(500)
//     return res.json({ error: util.inspect(err) })
//   }
// }

module.exports = {
  router,
  testableComponents: {
    root,
    lookup,
    check,
    reverseLookup,
    trustedLookup,
    getBatchResults,
    caReverseLookup
  }
}
