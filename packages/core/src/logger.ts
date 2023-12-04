export type LogLevel = 0 | 1 | 2 | 3 | 4 | 5

export class Logger {
  static DEFAULT_LOG_LEVEL: LogLevel = 1

  static logLevel = Logger.DEFAULT_LOG_LEVEL

  static setLogLevel(logLevel: LogLevel) {
    Logger.logLevel = logLevel
  }

  static resetLogLevel() {
    Logger.logLevel = Logger.DEFAULT_LOG_LEVEL
  }

  static log(message: string, logLevel: LogLevel = 0) {
    if (logLevel >= Logger.logLevel) {
      console.log(message)
    }
  }

  static error(message: string, logLevel: LogLevel = 0) {
    if (logLevel >= Logger.logLevel) {
      console.error(message)
    }
  }
}
