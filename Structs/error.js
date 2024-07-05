function createError(errorHeader, errorCode, errorMessage, res) {
    res.prettyPrintJson({
        errorHeader: errorHeader,
        errorCode: errorCode,
        errorMessage: errorMessage,
        numericErrorCode: 1004,
        intent : "prod-live",
        originatingService : "fortress",
    });
}

module.exports = {
    createError
}