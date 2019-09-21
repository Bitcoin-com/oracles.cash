"use strict";
/*
  This file controls the request-per-minute (RPM) rate limits.

  It is assumed that this middleware is run AFTER the auth.js middleware which
  checks for Basic auth. If the user adds the correct Basic auth to the header
  of their API request, they will get pro-tier rate limits. By default, the
  freemium rate limits apply.
*/
Object.defineProperty(exports, "__esModule", { value: true });
var RateLimit = require("express-rate-limit");
// Set max requests per minute
var maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
    : 60;
// Pro-tier rate limits are 10x the freemium limits.
var PRO_RPM = 10 * maxRequests;
// Unique route mapped to its rate limit
var uniqueRateLimits = {};
var routeRateLimit = function (req, res, next) {
    // Create a res.locals object if not passed in.
    if (!req.locals)
        req.locals = {};
    // Disable rate limiting if 0 passed from RATE_LIMIT_MAX_REQUESTS
    if (maxRequests === 0)
        return next();
    // Current route
    var rateLimitTier = req.locals.proLimit ? "PRO" : "BASIC";
    var path = req.baseUrl + req.path;
    var route = rateLimitTier +
        req.method +
        path
            .split("/")
            .slice(0, 4)
            .join("/");
    // This boolean value is passed from the auth.js middleware.
    var proRateLimits = req.locals.proLimit;
    // Pro level rate limits
    if (proRateLimits) {
        // TODO: replace the console.logs with calls to our logging system.
        //console.log(`applying pro-rate limits`)
        // Create new RateLimit if none exists for this route
        if (!uniqueRateLimits[route]) {
            uniqueRateLimits[route] = new RateLimit({
                windowMs: 60 * 1000,
                delayMs: 0,
                max: PRO_RPM,
                handler: function (req, res /*next*/) {
                    //console.log(`pro-tier rate-handler triggered.`)
                    res.status(429); // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
                    return res.json({
                        error: "Too many requests. Limits are " + PRO_RPM + " requests per minute."
                    });
                }
            });
        }
        // Freemium level rate limits
    }
    else {
        // TODO: replace the console.logs with calls to our logging system.
        //console.log(`applying freemium limits`)
        // Create new RateLimit if none exists for this route
        if (!uniqueRateLimits[route]) {
            uniqueRateLimits[route] = new RateLimit({
                windowMs: 60 * 1000,
                delayMs: 0,
                max: maxRequests,
                handler: function (req, res /*next*/) {
                    //console.log(`freemium rate-handler triggered.`)
                    res.status(429); // https://github.com/Bitcoin-com/rest.bitcoin.com/issues/330
                    return res.json({
                        error: "Too many requests. Limits are " + maxRequests + " requests per minute."
                    });
                }
            });
        }
    }
    // Call rate limit for this route
    uniqueRateLimits[route](req, res, next);
};
exports.routeRateLimit = routeRateLimit;
