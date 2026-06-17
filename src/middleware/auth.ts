import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

import config from '../config';
import { ForbiddenError } from '../errors/ForbiddenError';

export function createAuthMiddleware(tokenOverride?: string) {
    return (req: Request, _res: Response, next: NextFunction): void => {
        const secret = tokenOverride || config.authToken;

        if (!secret) {
            return next(new ForbiddenError('Server not configured'));
        }

        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

        if (!token) {
            return next(new ForbiddenError('Forbidden'));
        }

        try {
            jwt.verify(token, secret);
            next();
        } catch {
            next(new ForbiddenError('Forbidden'));
        }
    };
}