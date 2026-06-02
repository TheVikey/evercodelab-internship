const createScheduler = require('../src/scheduler');
const createLogger = require('../src/logger');
const ValidationError = require('../src/errors/ValidationError');

describe('scheduleTask', () => {
  let scheduler;

  beforeAll(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'trace').mockImplementation(() => {});

    const logger = createLogger({ requestId: 'test-scheduler' });
    scheduler = createScheduler(logger);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('should throw ValidationError for invalid interval', () => {
    expect(() => {
      scheduler.scheduleTask('heartbeat', -1000, () => {});
    }).toThrow(ValidationError);
  });

  test('should execute task successfully', () => {
    jest.useFakeTimers();

    const mockTask = jest.fn();
    scheduler.scheduleTask('heartbeat', 10000, mockTask);

    jest.advanceTimersByTime(10000);
    expect(mockTask).toHaveBeenCalled();

    jest.useRealTimers();
  });
});