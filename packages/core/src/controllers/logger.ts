export enum LOG_LEVEL {
  quiet = 0,
  normal = 1,
  verbose = 2,
  debug = 3,
}

export type LoggerLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL]

export interface LoggerConfig {
  level?: LoggerLevel
}

export class Logger {
  level: LoggerLevel

  constructor(public config: LoggerConfig = {}) {
    this.level = config.level ?? LOG_LEVEL.normal
  }

  log(...args: any[]) {
    if (this.level > 0) {
      console.log(...args)
    }
  }

  error(...args: any[]) {
    if (this.level > 1) {
      console.error(...args)
    }
  }

  debug(...args: any[]) {
    if (this.level > 2) {
      console.debug(...args)
    }
  }
}
