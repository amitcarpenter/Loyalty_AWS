const utils = require("../utils/helper")
module.exports = async (req, res, next) => {
    let token = utils.getcookie(req)
    if (token) {
        req.query.isLoggedIn = token
        next()
    } else {
        req.query.isLoggedIn = false
        next()
    }
}