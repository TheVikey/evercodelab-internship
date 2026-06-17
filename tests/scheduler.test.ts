import createScheduler from '../src/scheduler';
import createLogger from '../src/logger';
import { ValidationError } from '../src/errors/ValidationError';

describe('Scheduler', () => {
    let scheduler: ReturnType<typeof createScheduler>;

    beforeAll(() => {
        jest.spyOn(console, 'info').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'debug').mockImplementation(() => { });

        const logger = createLogger({ requestId: 'test-scheduler' });
        scheduler = createScheduler(logger);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    test('should throw ValidationError for invalid interval', () => {
        expect(() => {
            scheduler.scheduleTask('heartbeat', -1000, () => { });
        }).toThrow(ValidationError);
    });

    test('should throw ValidationError for empty name', () => {
        expect(() => {
            scheduler.scheduleTask('', 1000, () => { });
        }).toThrow(ValidationError);
    });

    test('should throw ValidationError for non-function task', () => {
        expect(() => {
            scheduler.scheduleTask('test', 1000, 'not a function' as any);
        }).toThrow(ValidationError);
    });

    test('should execute task successfully', () => {
        jest.useFakeTimers();

        const mockTask = jest.fn();
        scheduler.scheduleTask('heartbeat', 10000, mockTask);

        jest.advanceTimersByTime(10000);
        expect(mockTask).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(10000);
        expect(mockTask).toHaveBeenCalledTimes(2);

        jest.useRealTimers();
    });

    test('should handle async task errors gracefully', () => {
        jest.useFakeTimers();

        const failingTask = () => Promise.reject(new Error('Async failure'));
        scheduler.scheduleTask('failing', 5000, failingTask);

        // Не должно бросить — ошибка ловится внутри
        expect(() => {
            jest.advanceTimersByTime(5000);
        }).not.toThrow();

        jest.useRealTimers();
    });

    test('stopAll should clear all scheduled intervals', () => {
        jest.useFakeTimers();

        const mockTask = jest.fn();
        scheduler.scheduleTask('task1', 5000, mockTask);
        scheduler.scheduleTask('task2', 10000, mockTask);

        scheduler.stopAll();

        jest.advanceTimersByTime(15000);
        expect(mockTask).not.toHaveBeenCalled();

        jest.useRealTimers();
    });
});