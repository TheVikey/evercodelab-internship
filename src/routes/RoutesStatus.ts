import type { Application, Request, Response } from 'express';

export function setupStatusRoute(app: Application): void {
    app.get('/status', (_req: Request, res: Response) => {
        res.status(200).send('ok');
    });
}