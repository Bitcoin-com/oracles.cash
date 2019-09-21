"use strict"

const express = require("express")
const router = express.Router()

/* GET home page. */
router.get("/", (req, res, next) => {
  res.render("swagger-v1")
})

router.get("/v2", (req, res, next) => {
  res.render("swagger-v1")
})

module.exports = router
