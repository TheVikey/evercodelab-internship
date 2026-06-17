import { ValidationError } from './errors/ValidationError';
import type { Logger, Scheduler, TaskFunction } from './types';

function createScheduler(logger: Logger): Scheduler {
    const intervals: NodeJS.Timeout[] = [];

    logger.info('Scheduler started');

    function scheduleTask(name: string, interval: number, task: TaskFunction): NodeJS.Timeout {
        if (!name || typeof name !== 'string') {
            throw new ValidationError('Task name must be a non-empty string');
        }

        if (typeof interval !== 'number' || interval <= 0) {
            throw new ValidationError('Interval must be a positive number');
        }

        if (typeof task !== 'function') {
            throw new ValidationError('Task must be a function');
        }

        logger.info(`Task "${name}" scheduled`);

        const id = setInterval(() => {
            logger.info(`Task "${name}" started`);
            try {
                const result = task();
                if (result && typeof result.then === 'function') {
                    result.catch((err: Error) => {
                        logger.error(`Task "${name}" failed: ${err.message}`);
                    });
                }
            } catch (err) {
                logger.error(`Task "${name}" failed: ${(err as Error).message}`);
            }
        }, interval);

        intervals.push(id);

        return id;
    }

    function stopAll(): void {
        intervals.forEach(id => clearInterval(id));
        intervals.length = 0;
        logger.info('All scheduled tasks stopped');
    }

    return {
        scheduleTask,
        stopAll
    };
}

export default createScheduler;