const createScheduler = require('../src/scheduler');
const ValidationError = require('../src/errors/ValidationError');

describe('scheduleTask', () => {

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn()
  };

  const scheduler = createScheduler(mockLogger);

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