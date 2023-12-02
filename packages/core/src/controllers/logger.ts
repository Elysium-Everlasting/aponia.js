export type LogLevel = 0 | 1 | 2 | 3 | 4 | 5

export class Logger {
  static logLevel = 1

  static setLogLevel(logLevel: LogLevel) {
    Logger.logLevel = logLevel
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
