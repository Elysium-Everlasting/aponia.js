import { beforeEach } from 'node:test'

import { describe, test, expect, vi } from 'vitest'

import { Logger } from '../../src/controllers/logger'

beforeEach(() => {
  Logger.resetLogLevel()
})

describe('Logger', () => {
  describe('setLogLevel', () => {
    test('should set logLevel', () => {
      const newLogLevel = 2
      Logger.setLogLevel(newLogLevel)
      expect(Logger.logLevel).toBe(newLogLevel)
    })
  })

  describe('resetLogLevel', () => {
    test('should reset logLevel to default', () => {
      Logger.setLogLevel(4)
      Logger.resetLogLevel()
      expect(Logger.logLevel).toBe(Logger.DEFAULT_LOG_LEVEL)
    })
  })

  describe('log', () => {
    test('should log message if logLevel is greater than or equal to Logger.logLevel', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      Logger.log('test', 1)
      expect(logSpy).toHaveBeenCalledWith('test')
    })

    test('should not log message if logLevel is less than Logger.logLevel', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      Logger.log('test', 0)
      expect(logSpy).not.toHaveBeenCalled()
    })
  })

  describe('error', () => {
    test('should log message if logLevel is greater than or equal to Logger.logLevel', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      Logger.error('test', 1)
      expect(errorSpy).toHaveBeenCalledWith('test')
    })

    test('should not log message if logLevel is less than Logger.logLevel', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      Logger.error('test', 0)
      expect(errorSpy).not.toHaveBeenCalled()
    })
  })
})
