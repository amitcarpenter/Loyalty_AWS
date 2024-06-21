module.exports = {
    /**
     * @description This function use for format success response of rest api
     * @param data
     * @param code
     * @param message
     * @param res
     * @param extras
     * @returns {{data: *, meta: {message: *, code: *}}}
     */
          
    successResponseData(res, data, message, extras, code = 200) {
        const response = {
            data,
            message: message,
        }
        if (extras) {
            Object.keys(extras).forEach((key) => {
                if ({}.hasOwnProperty.call(extras, key)) {
                    response[key] = extras[key]
                }
            })
        }
        return res.status(code).send(response)
    },

    successResponseWithoutData(res, message, code = 202) {
        const response = {
            message: message,
        }
        return res.status(code).send(response)
    },
    NOContentResponseWithoutData(res, message, code = 204) {
        const response = {
            message: message,
        }
        return res.status(code).send(response)
    },

    errorResponseWithoutData(res, message, code = 400) {
        const response = {
            message: message,
        }
        return res.status(code).send(response)
    },

    errorResponseData(res, message, data,code = 400) {
        const response = {
            data : data,
            message: message
        }
        return res.status(code).send(response)
    },

    validationErrorResponseData(res, message, code = 400) {
        const response = {
            message: message
        }
        return res.status(code).send(response)
    },

    apiError(err) {
        let error = {};
        if (err.name == 'Validation error' && err.isJoi == true) {
            error.error_message = err.message.replace(/"/g, "");
            error.error_key = err.details[0]['context']['label'];
        } else if (typeof err == 'string') {
            error.error_message = err;
        } else {
            error = err;
            if (error.status == 401) error.message = 'unauthorized';
        }
        error.status = error.status || 400;
        return error;
    }

}