module.exports = async (req, res, next) => {
    const error = new Error('Invalid url')
    error.status = 404
    res.status(error.status || 500)
    return res.json({
        status: false,
        message: res.locals.__(error.message)
    })
}