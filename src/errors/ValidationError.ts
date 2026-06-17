import { AppError } from './AppError';

export class ValidationError extends AppError {
    constructor(message: string, context: Record<string, unknown> = {}) {
        super(message, 400, context);
    }
}