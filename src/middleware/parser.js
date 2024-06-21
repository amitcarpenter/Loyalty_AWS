module.exports = async (req, res, next) => {
    req.query.page = parseInt(req.query.page? req.query.page-1 : 0)
    req.query.limit = parseInt(req.query.limit? req.query.limit: 10)
    // req.query.order = parseInt(req.query.order? req.query.order: 'DESC')
    req.query.error = req.flash('error')
    req.query.message = req.flash('success')
    req.query.formValue = req.flash('formValue')[0];
    next()
}