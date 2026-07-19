/**
 * Application error carrying an HTTP status code.
 * Throw in lower layers, let the API endpoint map statusCode to res.status().
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message)
        this.statusCode = statusCode
    }
}

export default AppError
