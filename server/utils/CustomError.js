export class CustomError extends Error {
    constructor(message, statusCode = 500, extra = {}) {
        super(message);

        this.name = this.constructor.name;
        this.status = statusCode; // Ensure consistency with 'status' usage in controllers
        this.statusCode = statusCode;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();

        if (extra.code) this.code = extra.code;
        if (extra.details) this.details = extra.details;
        if (extra.log) this.log = extra.log; // For internal logging if needed

        Error.captureStackTrace(this, this.constructor);
    }
}
