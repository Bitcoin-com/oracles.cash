// imports
import * as express from "express"

// consts
const router: any = express.Router()

/* GET home page. */
router.get("/", (req, res, next) => {
  res.json({ status: "winning v2" })
})

module.exports = router
