export class AppError extends Error {
    public readonly statusCode: number;
    public readonly timestamp: string;
    public readonly context: Record<string, unknown>;

    constructor(message: string, statusCode: number, context: Record<string, unknown> = {}) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.timestamp = new Date().toISOString();
        this.context = context;

        Error.captureStackTrace(this, this.constructor);
    }
}