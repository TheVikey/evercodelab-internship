import { AppError } from './AppError';

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden', context: Record<string, unknown> = {}) {
        super(message, 403, context);
    }
}