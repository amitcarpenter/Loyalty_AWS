module.exports = async (error, req, res, next) => {
    console.log(error)
    req.flash('formValue', req.body);
    req.flash('success', req.success);
    req.flash('error', res.locals.__(error.message));
    return res.redirect(req.header('Referer'))
}
